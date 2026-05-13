import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION, TRAIN_MODE } from "./config.js"
import { STR } from "./i18n/strings-ru.js"
import { getEngine, mutateEngine } from "./trainer-ui-state.js"

/**
 * Миграции по одной ступени: ключ = целевая версия после шага (1 = первое присвоение версии схемы).
 * Аргумент — `localStorage` (или совместимый Storage) для тестов.
 * @type {Record<number, (store: Storage) => void>}
 */
const STORAGE_MIGRATIONS = {
    1() {
        // 0 → 1: явная запись версии схемы; переименований ключей не требовалось.
    },
}

function readSchemaVersion(store) {
    try {
        const raw = store.getItem(STORAGE_KEYS.schemaVersion)
        if (raw == null || raw === "") return 0
        const n = parseInt(raw, 10)
        return Number.isFinite(n) && n >= 0 ? n : 0
    } catch {
        return 0
    }
}

function writeSchemaVersion(store, version) {
    try {
        store.setItem(STORAGE_KEYS.schemaVersion, String(version))
    } catch {
        /* ignore */
    }
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
        let v = readSchemaVersion(this._store)
        while (v < STORAGE_SCHEMA_VERSION) {
            const next = v + 1
            const step = STORAGE_MIGRATIONS[next]
            if (typeof step === "function") {
                step(this._store)
            }
            writeSchemaVersion(this._store, next)
            v = next
        }
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
            if (m === TRAIN_MODE.VOCAB || m === TRAIN_MODE.CASES || m === TRAIN_MODE.VERBS) return m
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
                mode === TRAIN_MODE.VERBS
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
            for (const [k, v] of Object.entries(parsed)) {
                const row = normalizeWordStatRow(v)
                if (row) out[k] = row
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
        return normalizeWordStatRow(row)
    }

    bumpWordStat(lemma, field) {
        if (!lemma || !["correct", "wrong", "skipped"].includes(field)) return
        mutateEngine((e) => {
            const ws = e.wordStats
            if (!ws[lemma]) ws[lemma] = { correct: 0, wrong: 0, skipped: 0 }
            ws[lemma][field]++
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
            return {
                ru_to_lt: !!p.ru_to_lt,
                lt_to_ru: !!p.lt_to_ru,
                hardcore: !!p.hardcore,
            }
        } catch {
            return null
        }
    }

    saveVocabDirections(dirs) {
        try {
            this._store.setItem(
                STORAGE_KEYS.vocabDirections,
                JSON.stringify({
                    ru_to_lt: !!dirs.ru_to_lt,
                    lt_to_ru: !!dirs.lt_to_ru,
                    hardcore: !!dirs.hardcore,
                })
            )
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

export function initTrainerStorage() {
    trainerStorage.init()
}

export function normalizeWordStatRow(raw) {
    if (!raw || typeof raw !== "object") return null
    const correct = Number(raw.correct)
    const wrong = Number(raw.wrong)
    const skipped = Number(raw.skipped)
    if (![correct, wrong, skipped].every((n) => Number.isFinite(n))) return null
    return {
        correct: Math.max(0, Math.floor(correct)),
        wrong: Math.max(0, Math.floor(wrong)),
        skipped: Math.max(0, Math.floor(skipped)),
    }
}

export const loadSelectedCases = () => trainerStorage.loadSelectedCases()
export const saveSelectedCases = (keys) => trainerStorage.saveSelectedCases(keys)
export const loadSelectedPacks = () => trainerStorage.loadSelectedPacks()
export const saveSelectedPacks = (ids) => trainerStorage.saveSelectedPacks(ids)
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

/** Как в мастере до первого сохранения; для логики вне React (события, квиз). */
export function getResolvedVocabDirections() {
    const d = loadVocabDirections()
    if (d) return d
    return { ru_to_lt: true, lt_to_ru: false, hardcore: false }
}

export const loadCasesShowTranslation = () => trainerStorage.loadCasesShowTranslation()
export const saveCasesShowTranslation = (show) => trainerStorage.saveCasesShowTranslation(show)
export const loadCasesUseNativeKeyboard = () => trainerStorage.loadCasesUseNativeKeyboard()
export const saveCasesUseNativeKeyboard = (useNative) =>
    trainerStorage.saveCasesUseNativeKeyboard(useNative)
export const loadVocabShowWrongTranslation = () => trainerStorage.loadVocabShowWrongTranslation()
export const saveVocabShowWrongTranslation = (show) =>
    trainerStorage.saveVocabShowWrongTranslation(show)
export const loadExcludeLearnedWords = () => trainerStorage.loadExcludeLearnedWords()
export const saveExcludeLearnedWords = (exclude) => trainerStorage.saveExcludeLearnedWords(exclude)
