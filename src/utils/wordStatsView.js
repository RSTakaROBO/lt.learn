import { normalizeWordStatRow } from "../../js/storage.js";

/**
 * @param {Record<string, unknown>} wordStats
 * @returns {{ correct: number; wrong: number; skipped: number }}
 */
export function aggregateWordStatsTotals(wordStats) {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  for (const row of Object.values(wordStats)) {
    const n = normalizeWordStatRow(row);
    if (!n) continue;
    correct += n.correct;
    wrong += n.wrong;
    skipped += n.skipped;
  }
  return { correct, wrong, skipped };
}

/**
 * @param {Record<string, unknown>} wordStats
 * @returns {{ lemma: string; correct: number; wrong: number; skipped: number }[]}
 */
export function buildSortedWordStatRows(wordStats) {
  return Object.entries(wordStats)
    .map(([lemma, row]) => {
      const n = normalizeWordStatRow(row);
      if (!n) return null;
      return { lemma, correct: n.correct, wrong: n.wrong, skipped: n.skipped };
    })
    .filter((r) => r && r.correct + r.wrong + r.skipped > 0)
    .sort((a, b) => {
      if (b.wrong !== a.wrong) return b.wrong - a.wrong;
      if (b.skipped !== a.skipped) return b.skipped - a.skipped;
      return a.correct - b.correct;
    });
}
