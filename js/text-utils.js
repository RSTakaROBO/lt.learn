export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function normalizeAnswer(s) {
  return s.trim().normalize("NFC");
}

/** Ключ для сравнения ответов и дедупликации вариантов (пробелы, NFC, регистр, е/ё). */
export function comparableAnswerKey(s) {
  return normalizeAnswer(s).toLowerCase().replace(/\u0451/g, "\u0435");
}

export function answersMatch(user, expected) {
  return comparableAnswerKey(user) === comparableAnswerKey(expected);
}

/** Склонение: «N слов» по-русски. */
export function formatWordCountRu(n) {
  if (typeof n !== "number" || n < 0) return "";
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${n} слов`;
  if (mod10 === 1) return `${n} слово`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} слова`;
  return `${n} слов`;
}
