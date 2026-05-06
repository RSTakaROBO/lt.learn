import {
    TRAIN_MODE,
    WEIGHT_BASE,
    WEIGHT_MIN,
    WEIGHT_PER_CORRECT,
    WEIGHT_PER_SKIP,
    WEIGHT_PER_WRONG,
} from "./config.js"
import { getEngine, mutateEngine, postTrainerUiAction } from "./trainer-ui-state.js"
import { isCompleteVerbEntry, wordLemma } from "./word-entry.js"
import { hasWordRu } from "./wordTranslations.js"

/** Сколько верных подряд по одному слову — исключение из пула раунда. */
export const VOCAB_ROUND_STREAK_TO_REMOVE = 3

/**
 * Ключ леммы в раунде (trim), чтобы пул, веса и счётчики совпадали.
 *
 * Семантика «подряд» только по **этой лемме**: между показами одного и того же слова
 * могут быть любые другие слова — прогресс к трём верным подряд по этой лемме не сбрасывается.
 * Обнуляется счётчик только при неверном ответе по этой лемме или при пропуске карточки.
 */
export function roundLemmaKey(word) {
    return wordLemma(word)
}

function ensureRoundRow(vr, lemma) {
    if (!vr.roundRow[lemma]) vr.roundRow[lemma] = { correct: 0, wrong: 0, skipped: 0 }
    return vr.roundRow[lemma]
}

/**
 * Инициализация конечного раунда «Слова»: пул — все подходящие слова из wordBank.
 * @returns {boolean}
 */
export function initVocabRound(mode = TRAIN_MODE.VOCAB) {
    const usable =
        mode === TRAIN_MODE.VERBS
            ? getEngine().wordBank.filter(isCompleteVerbEntry)
            : getEngine().wordBank.filter((w) => hasWordRu(w) && wordLemma(w))
    let success = true
    mutateEngine((e) => {
        if (!usable.length) {
            e.vocabRound = null
            success = false
            return
        }
        const pool = new Set(usable.map((w) => roundLemmaKey(w)).filter(Boolean))
        const roundRow = {}
        for (const w of usable) {
            const k = roundLemmaKey(w)
            if (k) roundRow[k] = { correct: 0, wrong: 0, skipped: 0 }
        }
        e.vocabRound = {
            pool,
            initialSize: pool.size,
            gradedCorrect: 0,
            gradedWrong: 0,
            wrongByLemma: Object.create(null),
            roundRow,
            lemmaTowardThree: Object.create(null),
            maxStreak: 0,
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

/** Учитывает ответ по текущей карточке: серия «к 3» только по этой лемме, без сброса при смене карточки на другую. */
export function applyVocabRoundAnswer(word, ok) {
    const lem = roundLemmaKey(word)
    if (!lem) return
    /** @type {{ dots: number }} */
    const out = { dots: 0 }
    mutateEngine((e) => {
        const vr = e.vocabRound
        if (!vr) return
        const inPool = vr.pool.has(lem)
        if (!inPool) {
            if (!ok) vr.lemmaTowardThree[lem] = 0
            const slot = vr.lemmaTowardThree[lem]
            out.dots = typeof slot === "number" ? slot : 0
            return
        }
        const row = ensureRoundRow(vr, lem)
        let dotsForUi = 0
        if (ok) {
            row.correct += 1
            vr.gradedCorrect += 1
            const n = (vr.lemmaTowardThree[lem] || 0) + 1
            vr.lemmaTowardThree[lem] = n
            dotsForUi = Math.min(n, VOCAB_ROUND_STREAK_TO_REMOVE)
            if (n >= VOCAB_ROUND_STREAK_TO_REMOVE) {
                vr.pool.delete(lem)
                delete vr.lemmaTowardThree[lem]
                dotsForUi = VOCAB_ROUND_STREAK_TO_REMOVE
            }
        } else {
            row.wrong += 1
            vr.gradedWrong += 1
            vr.lemmaTowardThree[lem] = 0
            dotsForUi = 0
            vr.wrongByLemma[lem] = (vr.wrongByLemma[lem] || 0) + 1
        }
        if (ok) {
            vr.maxStreak = Math.max(vr.maxStreak, e.vocabCorrectStreak || 0)
        }
        out.dots = dotsForUi
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
        vr.lemmaTowardThree[lem] = 0
    })
    setVocabRoundLemmaDots(word, 0)
}

/**
 * Три точки внизу карточки: сколько верных подряд по этой лемме в раунде (0–3).
 * @param {object | null} word
 * @param {number} [filledOverride] явное значение после ответа (например 3 в момент снятия с пула)
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
            filled = Math.min(VOCAB_ROUND_STREAK_TO_REMOVE, vr.lemmaTowardThree[lem] || 0)
        }
        e.vocabRoundDots = { lemma: lem, filled }
    })
}

export function getVocabRoundSummarySnapshot() {
    const vr = getEngine().vocabRound
    if (!vr) return null
    const graded = vr.gradedCorrect + vr.gradedWrong
    const accuracyPct = graded > 0 ? Math.round((100 * vr.gradedCorrect) / graded) : null
    const topHard = Object.entries(vr.wrongByLemma)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "lt"))
        .slice(0, 3)
        .map(([lemma, wrong]) => ({ lemma, wrong }))
    return {
        accuracyPct,
        maxStreak: vr.maxStreak,
        topHard,
        initialSize: vr.initialSize,
        poolLeft: vr.pool.size,
    }
}

/** Итог раунда «Слова»: открыть модалку (вызывается из quiz). */
export function openVocabRoundSummaryOverlay() {
    const snap = getVocabRoundSummarySnapshot()
    if (!snap) return
    postTrainerUiAction({ type: "OVERLAY_OPEN", name: "vocabRound", snapshot: snap })
}
