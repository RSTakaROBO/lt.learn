import { comparableAnswerKey } from "./text-utils.js"

export function wordRuPrimary(word) {
    if (Array.isArray(word?.ru_list)) return word.ru_list[0] ?? ""
    if (Array.isArray(word?.ru)) {
        return typeof word.ru[0] === "string" ? word.ru[0].trim() : ""
    }
    return typeof word?.ru === "string" ? word.ru.trim() : ""
}

export function wordRuAlt(word) {
    if (Array.isArray(word?.ru_list)) return word.ru_list.slice(1).join(", ")
    if (Array.isArray(word?.ru)) {
        return word.ru
            .slice(1)
            .map((s) => String(s).trim())
            .filter(Boolean)
            .join(", ")
    }
    return ""
}

/** Основной и альтернативный перевод (оба засчитываются при проверке). */
export function wordRuAcceptedList(word) {
    if (Array.isArray(word?.ru_list)) return word.ru_list.filter(Boolean)
    const p = wordRuPrimary(word)
    const alt = wordRuAlt(word)
    const out = []
    if (p) out.push(p)
    for (const a of alt.split(",")) {
        const s = a.trim()
        if (s) out.push(s)
    }
    return out
}

export function hasWordRu(word) {
    return wordRuPrimary(word).length > 0
}

export function vocabRuUserMatches(word, userInput) {
    const keys = wordRuAcceptedList(word).map(comparableAnswerKey)
    if (!keys.length) return false
    const u = comparableAnswerKey(userInput)
    return keys.some((k) => k === u)
}

/** Строка для обратной связи: основной вариант и альтернатива в скобках. */
export function wordRuFeedbackLine(word) {
    const p = wordRuPrimary(word)
    const a = wordRuAlt(word)
    if (!p) return ""
    return a ? `${p} (${a})` : p
}
