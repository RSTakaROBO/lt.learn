import { comparableAnswerKey } from "./text-utils.js";

export function wordRuPrimary(word) {
  const ru = typeof word?.ru === "string" ? word.ru.trim() : "";
  return ru;
}

export function wordRuAlt(word) {
  const v = word?.ru_alt;
  return typeof v === "string" ? v.trim() : "";
}

/** Основной и альтернативный перевод (оба засчитываются при проверке). */
export function wordRuAcceptedList(word) {
  const p = wordRuPrimary(word);
  const a = wordRuAlt(word);
  const out = [];
  if (p) out.push(p);
  if (a) out.push(a);
  return out;
}

export function hasWordRu(word) {
  return wordRuPrimary(word).length > 0;
}

export function vocabRuUserMatches(word, userInput) {
  const keys = wordRuAcceptedList(word).map(comparableAnswerKey);
  if (!keys.length) return false;
  const u = comparableAnswerKey(userInput);
  return keys.some((k) => k === u);
}

/** Строка для обратной связи: основной вариант и альтернатива в скобках. */
export function wordRuFeedbackLine(word) {
  const p = wordRuPrimary(word);
  const a = wordRuAlt(word);
  if (!p) return "";
  return a ? `${p} (${a})` : p;
}
