export function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

export function normalizeAnswer(s) {
    return s.trim().normalize("NFC")
}

/** Ключ для сравнения ответов и дедупликации вариантов (пробелы, NFC, регистр, е/ё). */
export function comparableAnswerKey(s) {
    return normalizeAnswer(s)
        .toLowerCase()
        .replace(/\u0451/g, "\u0435")
}

export function answersMatch(user, expected) {
    return comparableAnswerKey(user) === comparableAnswerKey(expected)
}
