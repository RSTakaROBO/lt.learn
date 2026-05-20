/** Константы приложения (без побочных эффектов). */

/**
 * Root path prefix from Vite `base` (e.g. `/lt.learn/` on GitHub Pages). Always ends with `/`.
 * Relative `fetch("words/…")` breaks when the page URL omits a trailing slash — resolve against this instead.
 */
export function staticSiteRootPrefix() {
    const raw =
        typeof import.meta !== "undefined" &&
        import.meta.env &&
        typeof import.meta.env.BASE_URL === "string"
            ? import.meta.env.BASE_URL
            : "/"
    return raw.endsWith("/") ? raw : `${raw}/`
}

/** Base URL for word JSON files (`public/words` → `dist/words`). */
export function wordsFetchBase() {
    return `${staticSiteRootPrefix()}words/`
}

export const CASE_BY_KEY = {
    nominative: { key: "nominative", lt: "vardininkas" },
    genitive: { key: "genitive", lt: "kilmininkas" },
    dative: { key: "dative", lt: "naudininkas" },
    accusative: { key: "accusative", lt: "galininkas" },
    instrumental: { key: "instrumental", lt: "įnagininkas" },
    locative: { key: "locative", lt: "vietininkas" },
    vocative: { key: "vocative", lt: "šauksmininkas" },
}

export const CASE_ORDER = Object.values(CASE_BY_KEY)
export const CASE_KEYS = CASE_ORDER.map((c) => c.key)

export const STORAGE_KEYS = {
    /** Версия схемы данных приложения (миграции в js/storage.js). */
    schemaVersion: "lt-trainer-storage-schema-version",
    cases: "lt-cases-trainer-selected-cases",
    packs: "lt-cases-trainer-selected-packs",
    wordStats: "lt-trainer-word-stats-v1",
    trainMode: "lt-trainer-train-mode-v1",
    theme: "lt-trainer-theme-v1",
    vocabBestStreak: "lt-trainer-vocab-best-streak-v1",
    vocabDirections: "lt-trainer-vocab-directions-v1",
    casesShowTranslation: "lt-trainer-cases-show-translation-v1",
    casesUseNativeKeyboard: "lt-trainer-cases-use-native-keyboard-v1",
    vocabShowWrongTranslation: "lt-trainer-vocab-show-wrong-translation-v1",
    vocabShowVerbForms: "lt-trainer-vocab-show-verb-forms-v1",
    excludeLearnedWords: "lt-trainer-exclude-learned-words-v1",
    customPacks: "lt-trainer-custom-packs-v1",
}

/** Текущая версия схемы; при увеличении добавить миграцию `STORAGE_MIGRATIONS[nextVersion]`. */
export const STORAGE_SCHEMA_VERSION = 1

/** Направление в режиме «Изучение слов». */
export const VOCAB_DIRECTION = {
    RU_TO_LT: "ru_to_lt",
    LT_TO_RU: "lt_to_ru",
}

/** Формат ответа в режиме «Изучение слов». */
export const VOCAB_MODE = {
    CHOICES: "choices",
    SINGLE: "single",
    HARDCORE: "hardcore",
}

/** Доступные профили из themes.css (атрибут data-theme на documentElement). */
export const THEME_IDS = ["ocean", "forest", "ember", "paper", "mist"]

export const TRAIN_MODE = {
    CASES: "cases",
    VOCAB: "vocab",
    VERBS: "verbs",
}

export const VERB_FORM_BY_KEY = {
    infinitive: { key: "infinitive", label: "Инфинитив", lt: "bendratis" },
    present3: { key: "present3", label: "3 л. наст.", lt: "esamasis laikas" },
    past3: { key: "past3", label: "3 л. прош.", lt: "būtasis kartinis laikas" },
}

export const VERB_FORM_ORDER = Object.values(VERB_FORM_BY_KEY)
export const VERB_FORM_KEYS = VERB_FORM_ORDER.map((form) => form.key)

/** Цикл символов при Shift + эта латинская буква (нижний регистр). */
export const LT_SHIFT_KEY_CYCLES = {
    a: ["a", "ą"],
    c: ["c", "č"],
    e: ["e", "ė", "ę"],
    i: ["i", "į"],
    s: ["s", "š"],
    u: ["u", "ū", "ų"],
    z: ["z", "ž"],
}

export const MIN_GAP_BEFORE_SAME_LEMMA = 5

export const LEARNED_WORD_CORRECT_WRONG_DELTA = 5

export const WEIGHT_MIN = 0.28
export const WEIGHT_BASE = 1
export const WEIGHT_PER_WRONG = 0.92
export const WEIGHT_PER_SKIP = 0.38
export const WEIGHT_PER_CORRECT = 0.3
