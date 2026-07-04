import {
    LEARNED_WORD_CORRECT_WRONG_DELTA,
    normalizeLearningScopeSize,
    STORAGE_KEYS,
    TRAIN_MODE,
    VERB_MODE,
    VOCAB_MODE,
} from "./config.js"
import { STR } from "./i18n/strings-ru.js"
import { migrateStorage } from "./storage-migrations.js"
import { getEngine, mutateEngine } from "./trainer-ui-state.js"
import { WORD_PACK_SCHEMA_VERSION } from "./word-entry.js"
import {
    DEFAULT_SENTENCE_PACK_IDS,
    SENTENCE_BANK,
    sentenceExpectedText,
    sentencePackIds,
} from "../src/screens/quiz/sentences/sentenceBank.js"

const MS_PER_DAY = 24 * 60 * 60 * 1000
let appVisitSnapshot = {
    previousDate: "",
    today: "",
    daysWithoutLithuanian: 0,
}

const SENTENCE_STAT_KEYS = new Set(SENTENCE_BANK.map(sentenceExpectedText).filter(Boolean))

export function isSentenceStatKey(lemma) {
    return SENTENCE_STAT_KEYS.has(lemma)
}

function normalizeSentencePackIds(ids, fallback = []) {
    const valid = new Set(sentencePackIds())
    const out = []
    for (const id of Array.isArray(ids) ? ids : fallback) {
        if (typeof id === "string" && valid.has(id) && !out.includes(id)) out.push(id)
    }
    return out
}

function localDateKey(date = new Date()) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function dateKeyToUtcDay(key) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""))
    if (!m) return NaN
    const y = Number(m[1])
    const month = Number(m[2])
    const d = Number(m[3])
    if (!Number.isInteger(y) || month < 1 || month > 12 || d < 1 || d > 31) return NaN
    return Math.floor(Date.UTC(y, month - 1, d) / MS_PER_DAY)
}

function daysBetweenDateKeys(fromKey, toKey) {
    const fromDay = dateKeyToUtcDay(fromKey)
    const toDay = dateKeyToUtcDay(toKey)
    if (!Number.isFinite(fromDay) || !Number.isFinite(toDay)) return 0
    return Math.max(0, toDay - fromDay)
}

/**
 * Единая точка работы с данными в `localStorage`: версия схемы и миграции при старте.
 */
export class TrainerStorage {
    /** @param {Storage} [backing] */
    constructor(backing = localStorage) {
        this._store = backing
        this._initialized = false
    }

    /** Вызвать один раз при загрузке приложения (до чтения остальных ключей). */
    init() {
        if (this._initialized) return
        migrateStorage(this._store)
        this._initialized = true
    }

    loadSelectedCases() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.cases)
            if (!raw) return null
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : null
        } catch {
            return null
        }
    }

    saveSelectedCases(keys) {
        try {
            this._store.setItem(STORAGE_KEYS.cases, JSON.stringify(keys))
        } catch {
            /* ignore */
        }
    }

    loadSelectedPacks() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.packs)
            if (!raw) return null
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : null
        } catch {
            return null
        }
    }

    saveSelectedPacks(ids) {
        try {
            this._store.setItem(STORAGE_KEYS.packs, JSON.stringify(ids))
        } catch {
            /* ignore */
        }
    }

    loadSelectedSentencePacks() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.sentencePacks)
            if (!raw) return normalizeSentencePackIds(DEFAULT_SENTENCE_PACK_IDS)
            const parsed = JSON.parse(raw)
            return normalizeSentencePackIds(parsed)
        } catch {
            return normalizeSentencePackIds(DEFAULT_SENTENCE_PACK_IDS)
        }
    }

    saveSelectedSentencePacks(ids) {
        try {
            this._store.setItem(
                STORAGE_KEYS.sentencePacks,
                JSON.stringify(normalizeSentencePackIds(ids))
            )
        } catch {
            /* ignore */
        }
    }

    loadCustomPackRecords() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.customPacks)
            if (!raw) return []
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    appendCustomPackRecord(record) {
        const rows = this.loadCustomPackRecords()
        rows.push({
            id: record.id,
            title: record.title,
            schemaVersion: WORD_PACK_SCHEMA_VERSION,
            words: record.words,
        })
        try {
            this._store.setItem(STORAGE_KEYS.customPacks, JSON.stringify(rows))
        } catch (e) {
            if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) {
                throw new Error(STR.errors.storageQuota)
            }
            throw e
        }
    }

    removeCustomPackById(id) {
        if (typeof id !== "string" || !id.startsWith("custom-")) return
        const rows = this.loadCustomPackRecords().filter((r) => r && r.id !== id)
        try {
            this._store.setItem(STORAGE_KEYS.customPacks, JSON.stringify(rows))
        } catch {
            /* ignore */
        }
    }

    loadTrainMode() {
        try {
            const m = this._store.getItem(STORAGE_KEYS.trainMode)
            if (
                m === TRAIN_MODE.VOCAB ||
                m === TRAIN_MODE.CASES ||
                m === TRAIN_MODE.VERBS ||
                m === TRAIN_MODE.SENTENCES
            )
                return m
        } catch {
            /* ignore */
        }
        return null
    }

    saveTrainMode(mode) {
        try {
            if (
                mode === TRAIN_MODE.VOCAB ||
                mode === TRAIN_MODE.CASES ||
                mode === TRAIN_MODE.VERBS ||
                mode === TRAIN_MODE.SENTENCES
            ) {
                this._store.setItem(STORAGE_KEYS.trainMode, mode)
            }
        } catch {
            /* ignore */
        }
    }

    loadPersistedWordStats() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.wordStats)
            if (!raw) return {}
            const parsed = JSON.parse(raw)
            if (!parsed || typeof parsed !== "object") return {}
            const out = {}
            let changed = false
            for (const [k, v] of Object.entries(parsed)) {
                if (isSentenceStatKey(k)) {
                    changed = true
                    continue
                }
                const row = parseCurrentWordStatRow(v)
                if (row) {
                    out[k] = row
                } else {
                    changed = true
                }
            }
            if (changed) {
                try {
                    this._store.setItem(STORAGE_KEYS.wordStats, JSON.stringify(out))
                } catch {
                    /* ignore */
                }
            }
            return out
        } catch {
            return {}
        }
    }

    saveWordStatsToStorage() {
        try {
            this._store.setItem(STORAGE_KEYS.wordStats, JSON.stringify(getEngine().wordStats))
        } catch {
            /* ignore */
        }
    }

    /** Сброс счётчиков по словам в хранилище и в движке (Redux). */
    clearWordStats() {
        try {
            this._store.removeItem(STORAGE_KEYS.wordStats)
        } catch {
            /* ignore */
        }
        mutateEngine((e) => {
            e.wordStats = {}
        })
    }

    getWordStat(lemma) {
        const row = getEngine().wordStats[lemma]
        if (!row) return null
        return parseCurrentWordStatRow(row)
    }

    bumpWordStat(lemma, field) {
        if (!lemma || !["correct", "wrong", "skipped"].includes(field)) return
        if (isSentenceStatKey(lemma)) return
        mutateEngine((e) => {
            const ws = e.wordStats
            if (!ws[lemma]) ws[lemma] = { correct: 0, wrong: 0, skipped: 0, progress: 0 }
            ws[lemma][field]++
            if (field === "correct") {
                ws[lemma].progress = Math.min(
                    LEARNED_WORD_CORRECT_WRONG_DELTA,
                    ws[lemma].progress + 1
                )
            } else if (field === "wrong") {
                // Ошибка снимает одну накопленную отметку, но не создаёт скрытый
                // отрицательный «долг», который пришлось бы отрабатывать ответами.
                ws[lemma].progress = Math.max(0, ws[lemma].progress - 1)
            }
        })
        this.saveWordStatsToStorage()
    }

    loadVocabBestStreak() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.vocabBestStreak)
            const n = raw == null ? NaN : parseInt(raw, 10)
            return Number.isFinite(n) && n >= 0 ? n : 0
        } catch {
            return 0
        }
    }

    saveVocabBestStreakIfHigher(streak) {
        if (!Number.isFinite(streak) || streak < 0) return
        const prev = this.loadVocabBestStreak()
        if (streak <= prev) return
        try {
            this._store.setItem(STORAGE_KEYS.vocabBestStreak, String(Math.floor(streak)))
        } catch {
            /* ignore */
        }
    }

    loadVocabDirections() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.vocabDirections)
            if (!raw) return null
            const p = JSON.parse(raw)
            if (!p || typeof p !== "object") return null
            if (
                typeof p.ru_to_lt !== "boolean" ||
                typeof p.lt_to_ru !== "boolean" ||
                !Object.values(VOCAB_MODE).includes(p.vocabMode)
            ) {
                return null
            }
            return {
                ru_to_lt: p.ru_to_lt,
                lt_to_ru: p.lt_to_ru,
                vocabMode: p.vocabMode,
            }
        } catch {
            return null
        }
    }

    saveVocabDirections(dirs) {
        try {
            if (!Object.values(VOCAB_MODE).includes(dirs.vocabMode)) return
            this._store.setItem(
                STORAGE_KEYS.vocabDirections,
                JSON.stringify({
                    ru_to_lt: !!dirs.ru_to_lt,
                    lt_to_ru: !!dirs.lt_to_ru,
                    vocabMode: dirs.vocabMode,
                })
            )
        } catch {
            /* ignore */
        }
    }

    loadVerbMode() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.verbMode)
            if (raw === VERB_MODE.FORMS || raw === VERB_MODE.CARDS || raw === VERB_MODE.FORM_CARDS)
                return raw
        } catch {
            /* ignore */
        }
        return null
    }

    saveVerbMode(mode) {
        try {
            if (
                mode === VERB_MODE.FORMS ||
                mode === VERB_MODE.CARDS ||
                mode === VERB_MODE.FORM_CARDS
            ) {
                this._store.setItem(STORAGE_KEYS.verbMode, mode)
            }
        } catch {
            /* ignore */
        }
    }

    /** @returns {boolean|null} */
    loadCasesShowTranslation() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.casesShowTranslation)
            if (raw === null) return null
            if (raw === "1") return true
            if (raw === "0") return false
            return null
        } catch {
            return null
        }
    }

    saveCasesShowTranslation(show) {
        try {
            this._store.setItem(STORAGE_KEYS.casesShowTranslation, show ? "1" : "0")
        } catch {
            /* ignore */
        }
    }

    /** @returns {boolean|null} */
    loadCasesUseNativeKeyboard() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.casesUseNativeKeyboard)
            if (raw === null) return null
            if (raw === "1") return true
            if (raw === "0") return false
            return null
        } catch {
            return null
        }
    }

    saveCasesUseNativeKeyboard(useNative) {
        try {
            this._store.setItem(STORAGE_KEYS.casesUseNativeKeyboard, useNative ? "1" : "0")
        } catch {
            /* ignore */
        }
    }

    /** @returns {boolean|null} */
    loadVocabShowWrongTranslation() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.vocabShowWrongTranslation)
            if (raw === null) return null
            if (raw === "1") return true
            if (raw === "0") return false
            return null
        } catch {
            return null
        }
    }

    saveVocabShowWrongTranslation(show) {
        try {
            this._store.setItem(STORAGE_KEYS.vocabShowWrongTranslation, show ? "1" : "0")
        } catch {
            /* ignore */
        }
    }

    /** @returns {boolean|null} */
    loadVocabShowVerbForms() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.vocabShowVerbForms)
            if (raw === null) return null
            if (raw === "1") return true
            if (raw === "0") return false
            return null
        } catch {
            return null
        }
    }

    saveVocabShowVerbForms(show) {
        try {
            this._store.setItem(STORAGE_KEYS.vocabShowVerbForms, show ? "1" : "0")
        } catch {
            /* ignore */
        }
    }

    /** @returns {boolean|null} */
    loadSimplifiedAnswerMode() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.simplifiedAnswerMode)
            if (raw === null) return null
            if (raw === "1") return true
            if (raw === "0") return false
            return null
        } catch {
            return null
        }
    }

    saveSimplifiedAnswerMode(enabled) {
        try {
            this._store.setItem(STORAGE_KEYS.simplifiedAnswerMode, enabled ? "1" : "0")
        } catch {
            /* ignore */
        }
    }

    saveLearningScopeSize(size) {
        try {
            this._store.setItem(
                STORAGE_KEYS.learningScopeSize,
                String(normalizeLearningScopeSize(size))
            )
        } catch {
            /* ignore */
        }
    }

    /** @returns {boolean|null} */
    loadExcludeLearnedWords() {
        try {
            const raw = this._store.getItem(STORAGE_KEYS.excludeLearnedWords)
            if (raw === null) return null
            if (raw === "1") return true
            if (raw === "0") return false
            return null
        } catch {
            return null
        }
    }

    saveExcludeLearnedWords(exclude) {
        try {
            this._store.setItem(STORAGE_KEYS.excludeLearnedWords, exclude ? "1" : "0")
        } catch {
            /* ignore */
        }
    }
}

export const trainerStorage = new TrainerStorage()

export function parseCurrentWordStatRow(raw) {
    if (!raw || typeof raw !== "object") return null
    const { correct, wrong, skipped, progress } = raw
    if (![correct, wrong, skipped, progress].every((n) => Number.isFinite(n))) return null
    const normalizedCorrect = Math.max(0, Math.floor(correct))
    const normalizedWrong = Math.max(0, Math.floor(wrong))
    return {
        correct: normalizedCorrect,
        wrong: normalizedWrong,
        skipped: Math.max(0, Math.floor(skipped)),
        progress: Math.max(0, Math.min(LEARNED_WORD_CORRECT_WRONG_DELTA, Math.floor(progress))),
    }
}

export const loadSelectedCases = () => trainerStorage.loadSelectedCases()
export const saveSelectedCases = (keys) => trainerStorage.saveSelectedCases(keys)
export const loadSelectedPacks = () => trainerStorage.loadSelectedPacks()
export const saveSelectedPacks = (ids) => trainerStorage.saveSelectedPacks(ids)
export const loadSelectedSentencePacks = () => trainerStorage.loadSelectedSentencePacks()
export const saveSelectedSentencePacks = (ids) => trainerStorage.saveSelectedSentencePacks(ids)
export const loadCustomPackRecords = () => trainerStorage.loadCustomPackRecords()
export const appendCustomPackRecord = (record) => trainerStorage.appendCustomPackRecord(record)
export const removeCustomPackById = (id) => trainerStorage.removeCustomPackById(id)
export const loadTrainMode = () => trainerStorage.loadTrainMode()
export const saveTrainMode = (mode) => trainerStorage.saveTrainMode(mode)
export const loadPersistedWordStats = () => trainerStorage.loadPersistedWordStats()
export const saveWordStatsToStorage = () => trainerStorage.saveWordStatsToStorage()
export const getWordStat = (lemma) => trainerStorage.getWordStat(lemma)
export const bumpWordStat = (lemma, field) => trainerStorage.bumpWordStat(lemma, field)
export const clearWordStats = () => trainerStorage.clearWordStats()
export const loadVocabBestStreak = () => trainerStorage.loadVocabBestStreak()
export const saveVocabBestStreakIfHigher = (streak) =>
    trainerStorage.saveVocabBestStreakIfHigher(streak)
export const loadVocabDirections = () => trainerStorage.loadVocabDirections()
export const saveVocabDirections = (dirs) => trainerStorage.saveVocabDirections(dirs)
export const loadVerbMode = () => trainerStorage.loadVerbMode()
export const saveVerbMode = (mode) => trainerStorage.saveVerbMode(mode)
export const saveLearningScopeSize = (size) => trainerStorage.saveLearningScopeSize(size)

/** Как в мастере до первого сохранения; для логики вне React (события, квиз). */
export function getResolvedVocabDirections() {
    const d = loadVocabDirections()
    if (d) return d
    return {
        ru_to_lt: true,
        lt_to_ru: false,
        vocabMode: VOCAB_MODE.CHOICES,
    }
}

export function getResolvedVerbMode() {
    return loadVerbMode() || VERB_MODE.FORMS
}

export const loadCasesShowTranslation = () => trainerStorage.loadCasesShowTranslation()
export const saveCasesShowTranslation = (show) => trainerStorage.saveCasesShowTranslation(show)
export const loadCasesUseNativeKeyboard = () => trainerStorage.loadCasesUseNativeKeyboard()
export const saveCasesUseNativeKeyboard = (useNative) =>
    trainerStorage.saveCasesUseNativeKeyboard(useNative)
export const loadVocabShowWrongTranslation = () => trainerStorage.loadVocabShowWrongTranslation()
export const saveVocabShowWrongTranslation = (show) =>
    trainerStorage.saveVocabShowWrongTranslation(show)
export const loadVocabShowVerbForms = () => trainerStorage.loadVocabShowVerbForms()
export const saveVocabShowVerbForms = (show) => trainerStorage.saveVocabShowVerbForms(show)
export const loadSimplifiedAnswerMode = () => trainerStorage.loadSimplifiedAnswerMode()
export const saveSimplifiedAnswerMode = (enabled) =>
    trainerStorage.saveSimplifiedAnswerMode(enabled)
export const loadExcludeLearnedWords = () => trainerStorage.loadExcludeLearnedWords()
export const saveExcludeLearnedWords = (exclude) => trainerStorage.saveExcludeLearnedWords(exclude)

export function recordAppVisit(now = new Date()) {
    const today = localDateKey(now)
    let previousDate = ""
    try {
        previousDate = localStorage.getItem(STORAGE_KEYS.appLastVisitDate) || ""
        localStorage.setItem(STORAGE_KEYS.appLastVisitDate, today)
    } catch {
        /* ignore */
    }
    appVisitSnapshot = {
        previousDate,
        today,
        daysWithoutLithuanian: daysBetweenDateKeys(previousDate, today),
    }
    return appVisitSnapshot
}

export function getAppVisitSnapshot() {
    return appVisitSnapshot
}
