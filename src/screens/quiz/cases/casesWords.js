function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function casesLemma(word) {
    return cleanString(word?.lemma)
}

export function casesRuPrimary(word) {
    return Array.isArray(word?.translations) ? cleanString(word.translations[0]) : ""
}

export function isCasesTrainingWord(word, selectedKeys = []) {
    if (word?.type !== "noun") return false
    if (!Array.isArray(selectedKeys)) return false
    return selectedKeys.every((key) => typeof word.forms?.[key] === "string" && word.forms[key])
}
