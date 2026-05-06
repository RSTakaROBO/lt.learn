/** Константы приложения (без побочных эффектов). */

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
    customPacks: "lt-trainer-custom-packs-v1",
}

/** Текущая версия схемы; при увеличении добавить миграцию `STORAGE_MIGRATIONS[nextVersion]`. */
export const STORAGE_SCHEMA_VERSION = 1

/** Направление в режиме «Изучение слов». */
export const VOCAB_DIRECTION = {
    RU_TO_LT: "ru_to_lt",
    LT_TO_RU: "lt_to_ru",
}

/** Доступные профили из themes.css (атрибут data-theme на documentElement). */
export const THEME_IDS = ["ocean", "forest", "ember", "paper", "mist"]

export const TRAIN_MODE = {
    CASES: "cases",
    VOCAB: "vocab",
}

/** Цикл символов при Shift + эта латинская буква (нижний регистр). */
export const LT_SHIFT_KEY_CYCLES = {
    a: ["a", "ą"],
    c: ["c", "č"],
    e: ["e", "ę", "ė"],
    i: ["i", "į"],
    s: ["s", "š"],
    u: ["u", "ų", "ū"],
    z: ["z", "ž"],
}

export const MIN_GAP_BEFORE_SAME_LEMMA = 5

export const WEIGHT_MIN = 0.28
export const WEIGHT_BASE = 1
export const WEIGHT_PER_WRONG = 0.92
export const WEIGHT_PER_SKIP = 0.38
export const WEIGHT_PER_CORRECT = 0.3
