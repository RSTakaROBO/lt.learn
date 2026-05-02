/** Константы приложения (без побочных эффектов). */

export const CASE_ORDER = [
  { key: "nominative", ru: "Именительный", lt: "vardininkas" },
  { key: "genitive", ru: "Родительный", lt: "kilmininkas" },
  { key: "dative", ru: "Дательный", lt: "naudininkas" },
  { key: "accusative", ru: "Винительный", lt: "galininkas" },
  { key: "instrumental", ru: "Творительный", lt: "įnagininkas" },
  { key: "locative", ru: "Местный", lt: "vietininkas" },
  { key: "vocative", ru: "Звательный", lt: "šauksmininkas" },
];

export const STORAGE_KEYS = {
  cases: "lt-cases-trainer-selected-cases",
  packs: "lt-cases-trainer-selected-packs",
  wordStats: "lt-trainer-word-stats-v1",
  trainMode: "lt-trainer-train-mode-v1",
  theme: "lt-trainer-theme-v1",
  vocabBestStreak: "lt-trainer-vocab-best-streak-v1",
  vocabDirections: "lt-trainer-vocab-directions-v1",
  casesShowTranslation: "lt-trainer-cases-show-translation-v1",
  customPacks: "lt-trainer-custom-packs-v1",
};

/** Направление в режиме «Изучение слов». */
export const VOCAB_DIRECTION = {
  RU_TO_LT: "ru_to_lt",
  LT_TO_RU: "lt_to_ru",
};

/** Доступные профили из themes.css (атрибут data-theme на documentElement). */
export const THEME_IDS = [
  "default",
  "ocean",
  "forest",
  "dusk",
  "ember",
  "day",
  "paper",
  "mist",
  "bloom",
];

export const TRAIN_MODE = {
  CASES: "cases",
  VOCAB: "vocab",
};

/** Цикл символов при Shift + эта латинская буква (нижний регистр). */
export const LT_SHIFT_KEY_CYCLES = {
  a: ["a", "ą"],
  c: ["c", "č"],
  e: ["e", "ę", "ė"],
  i: ["i", "į"],
  s: ["s", "š"],
  u: ["u", "ų", "ū"],
  z: ["z", "ž"],
};

export const MIN_GAP_BEFORE_SAME_LEMMA = 5;

export const WEIGHT_MIN = 0.28;
export const WEIGHT_BASE = 1;
export const WEIGHT_PER_WRONG = 0.92;
export const WEIGHT_PER_SKIP = 0.38;
export const WEIGHT_PER_CORRECT = 0.3;
