import {
    LEARNED_WORD_CORRECT_WRONG_DELTA,
    normalizeLearningScopeSize,
    TRAIN_MODE,
    VERB_MODE,
    WEIGHT_BASE,
    WEIGHT_MIN,
    WEIGHT_PER_CORRECT,
    WEIGHT_PER_SKIP,
    WEIGHT_PER_WRONG,
} from "./config.js"
import { shuffleArray } from "./random.js"
import { loadExcludeLearnedWords } from "./storage.js"
import {
    getEngine,
    getLearningScopeSize,
    mutateEngine,
    postTrainerUiAction,
} from "./trainer-ui-state.js"
import { isCasesTrainingWord } from "../src/screens/quiz/cases/casesWords.js"
import { isVocabTrainingWord } from "../src/screens/quiz/vocab/vocabWords.js"
import { sentenceRoundWords } from "../src/screens/quiz/sentences/sentenceTask.js"
import {
    isVerbCardsTrainingWord,
    isVerbConjugationTrainingWord,
    isVerbsTrainingWord,
} from "../src/screens/quiz/verbs/verbsWords.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

/** Глобальный прогресс слова до статуса «выучено». */
export const VOCAB_ROUND_STREAK_TO_REMOVE = LEARNED_WORD_CORRECT_WRONG_DELTA

/**
 * Ключ леммы в раунде (trim), чтобы пул, веса и счётчики совпадали.
 */
export function roundLemmaKey(word) {
    return cleanString(word?.lemma)
}

function ensureRoundRow(vr, lemma) {
    if (!vr.roundRow[lemma]) vr.roundRow[lemma] = { correct: 0, wrong: 0, skipped: 0 }
    return vr.roundRow[lemma]
}

function learnedProgress(wordStats, lemma) {
    const row = wordStats?.[lemma]
    if (!row) return 0
    const progress = Number(row.progress)
    if (!Number.isFinite(progress)) return 0
    return Math.max(0, Math.min(LEARNED_WORD_CORRECT_WRONG_DELTA, progress))
}

function isLearnedLemma(wordStats, lemma) {
    return learnedProgress(wordStats, lemma) >= LEARNED_WORD_CORRECT_WRONG_DELTA
}

function roundProgress(vr, lemma) {
    const row = vr?.roundRow?.[lemma]
    const correct = Number(row?.correct)
    if (!Number.isFinite(correct)) return 0
    return Math.max(0, Math.min(VOCAB_ROUND_STREAK_TO_REMOVE, Math.floor(correct)))
}

function correctAnswersToRemove(word) {
    return word?.type === "sentence" ? 1 : VOCAB_ROUND_STREAK_TO_REMOVE
}

function remainingRoundWords(vr) {
    return vr.pool.size + vr.reserve.length
}

function fillActivePool(vr, wordStats) {
    while (vr.pool.size < vr.scopeSize && vr.reserve.length) {
        const lemma = vr.reserve.shift()
        if (lemma && (!vr.excludeLearnedWords || !isLearnedLemma(wordStats, lemma))) {
            vr.pool.add(lemma)
        }
    }
}

/**
 * Инициализация урока: активный пул ограничен настройкой, остальные слова ждут в резерве.
 * @returns {boolean}
 */
export function initVocabRound(mode = TRAIN_MODE.VOCAB, { verbMode = VERB_MODE.FORMS } = {}) {
    const usable =
        mode === TRAIN_MODE.CASES
            ? getEngine().wordBank.filter((word) =>
                  isCasesTrainingWord(word, getEngine().selectedCaseKeys)
              )
            : mode === TRAIN_MODE.VERBS
              ? getEngine().wordBank.filter(
                    verbMode === VERB_MODE.CARDS
                        ? isVerbCardsTrainingWord
                        : verbMode === VERB_MODE.CONJUGATION
                          ? isVerbConjugationTrainingWord
                          : isVerbsTrainingWord
                )
              : mode === TRAIN_MODE.SENTENCES
                ? sentenceRoundWords()
                : getEngine().wordBank.filter(isVocabTrainingWord)
    const wordStats = getEngine().wordStats
    const excludeLearnedWords = mode === TRAIN_MODE.SENTENCES ? false : !!loadExcludeLearnedWords()
    const uniqueRoundLemmas = [
        ...new Set(
            usable
                .map(roundLemmaKey)
                .filter(
                    (lemma) => lemma && (!excludeLearnedWords || !isLearnedLemma(wordStats, lemma))
                )
        ),
    ]
    const shuffledLemmas = shuffleArray(uniqueRoundLemmas)
    const scopeSize = normalizeLearningScopeSize(getLearningScopeSize())
    let success = true
    mutateEngine((e) => {
        if (!shuffledLemmas.length) {
            e.vocabRound = null
            success = false
            return
        }
        const activeLemmas = shuffledLemmas.slice(0, scopeSize)
        const reserve = shuffledLemmas.slice(scopeSize)
        const pool = new Set(activeLemmas)
        const roundRow = {}
        for (const lemma of shuffledLemmas) {
            roundRow[lemma] = { correct: 0, wrong: 0, skipped: 0 }
        }
        e.vocabRound = {
            pool,
            reserve,
            scopeSize,
            initialSize: shuffledLemmas.length,
            gradedCorrect: 0,
            gradedWrong: 0,
            wrongByLemma: Object.create(null),
            roundRow,
            maxStreak: 0,
            excludeLearnedWords,
        }
        e.vocabRoundDots = null
    })
    return success
}

export function clearVocabRound() {
    mutateEngine((e) => {
        e.vocabRound = null
        e.vocabRoundDots = null
    })
}

export function isVocabRoundActive() {
    return !!getEngine().vocabRound
}

/** Вес слова в раунде (без учёта глобальной статистики). */
export function computeVocabRoundWeightForLemma(lemma) {
    const vr = getEngine().vocabRound
    if (!vr) {
        const z = { correct: 0, wrong: 0, skipped: 0 }
        return weightFromRoundRow(z)
    }
    const row = vr.roundRow[lemma] || { correct: 0, wrong: 0, skipped: 0 }
    return weightFromRoundRow(row)
}

function weightFromRoundRow(row) {
    const w =
        WEIGHT_BASE +
        row.wrong * WEIGHT_PER_WRONG +
        row.skipped * WEIGHT_PER_SKIP -
        row.correct * WEIGHT_PER_CORRECT
    return Math.max(WEIGHT_MIN, w)
}

/** Учитывает ответ и заменяет слово из активного стека, когда оно стало выученным. */
export function applyVocabRoundAnswer(word, ok) {
    const lem = roundLemmaKey(word)
    if (!lem) return
    /** @type {{ dots: number }} */
    const out = { dots: 0 }
    mutateEngine((e) => {
        const vr = e.vocabRound
        if (!vr) return
        if (!vr.pool.has(lem)) return
        const row = ensureRoundRow(vr, lem)
        if (ok) {
            row.correct += 1
            vr.gradedCorrect += 1
        } else {
            row.wrong += 1
            vr.gradedWrong += 1
            vr.wrongByLemma[lem] = (vr.wrongByLemma[lem] || 0) + 1
        }
        if (ok) {
            vr.maxStreak = Math.max(vr.maxStreak, e.vocabCorrectStreak || 0)
        }
        out.dots = roundProgress(vr, lem)
        if (roundProgress(vr, lem) >= correctAnswersToRemove(word)) {
            vr.pool.delete(lem)
            fillActivePool(vr, e.wordStats)
        }
    })
    setVocabRoundLemmaDots(word, out.dots)
}

export function applyVocabRoundSkip(word) {
    const lem = roundLemmaKey(word)
    if (!lem) return
    mutateEngine((e) => {
        const vr = e.vocabRound
        if (!vr || !vr.pool.has(lem)) return
        vr.maxStreak = Math.max(vr.maxStreak, e.vocabCorrectStreak || 0)
        const row = ensureRoundRow(vr, lem)
        row.skipped += 1
    })
    setVocabRoundLemmaDots(word)
}

export function excludeVocabRoundWord(word) {
    const lem = roundLemmaKey(word)
    if (!lem) return false
    let removed = false
    mutateEngine((e) => {
        const vr = e.vocabRound
        if (!vr) return
        removed = vr.pool.delete(lem)
        const reserveSize = vr.reserve.length
        vr.reserve = vr.reserve.filter((lemma) => lemma !== lem)
        removed = removed || vr.reserve.length !== reserveSize
        if (!removed) return
        vr.maxStreak = Math.max(vr.maxStreak, e.vocabCorrectStreak || 0)
        fillActivePool(vr, e.wordStats)
        e.vocabRoundDots = null
    })
    return removed
}

/**
 * Точки внизу карточки: прогресс слова внутри текущего урока.
 * @param {object | null} word
 * @param {number} [filledOverride] явное значение после ответа (например 5 при снятии с пула)
 */
export function setVocabRoundLemmaDots(word, filledOverride) {
    const lem = roundLemmaKey(word)
    mutateEngine((e) => {
        const vr = e.vocabRound
        if (!vr || !word || !lem) {
            e.vocabRoundDots = null
            return
        }
        let filled = 0
        if (typeof filledOverride === "number" && Number.isFinite(filledOverride)) {
            filled = Math.max(0, Math.min(VOCAB_ROUND_STREAK_TO_REMOVE, filledOverride))
        } else {
            filled = roundProgress(vr, lem)
        }
        e.vocabRoundDots = { lemma: lem, filled }
    })
}

export function getVocabRoundSummarySnapshot() {
    const vr = getEngine().vocabRound
    if (!vr) return null
    const graded = vr.gradedCorrect + vr.gradedWrong
    const skipped = Object.values(vr.roundRow).reduce((sum, row) => sum + (row.skipped || 0), 0)
    const accuracyPct = graded > 0 ? Math.round((100 * vr.gradedCorrect) / graded) : null
    const topHard = Object.entries(vr.wrongByLemma)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "lt"))
        .slice(0, 3)
        .map(([lemma, wrong]) => ({ lemma, wrong }))
    return {
        accuracyPct,
        stages: graded + skipped,
        correct: vr.gradedCorrect,
        wrong: vr.gradedWrong,
        maxStreak: vr.maxStreak,
        topHard,
        initialSize: vr.initialSize,
        poolLeft: remainingRoundWords(vr),
    }
}

/** Итог раунда «Слова»: открыть модалку (вызывается из quiz). */
export function openVocabRoundSummaryOverlay() {
    const snap = getVocabRoundSummarySnapshot()
    if (!snap) return
    postTrainerUiAction({ type: "OVERLAY_OPEN", name: "vocabRound", snapshot: snap })
}
