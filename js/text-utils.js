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
export function comparableAnswerKey(s, options = {}) {
    const simplifyLtDiacritics = !!options?.simplifyLtDiacritics
    let key = normalizeAnswer(s)
        .toLowerCase()
        .replace(/\u0451/g, "\u0435")
    if (simplifyLtDiacritics) {
        key = key.replace(/\u0117/g, "e").replace(/\u016b/g, "u")
    }
    return key
}

export function answersMatch(user, expected, options) {
    return comparableAnswerKey(user, options) === comparableAnswerKey(expected, options)
}
