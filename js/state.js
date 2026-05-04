/** Изменяемое состояние приложения (одна точка правды). */

export const state = {
  wordBank: [],
  currentTask: null,
  answered: false,
  shownLemmaHistory: [],
  manifestCache: null,
  wordStats: {},
  /** Подряд верных ответов в режиме «Слова» (сбрасывается при ошибке, пропуске, выходе). */
  vocabCorrectStreak: 0,
  /** Конечный раунд «Слова»: пул лемм, локальные веса и статистика до «Ок» / «Повторить». */
  vocabRound: null,
};
