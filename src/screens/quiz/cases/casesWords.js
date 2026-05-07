function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function casesLemma(word) {
    return cleanString(word?.lemma || word?.nominative)
}

export function casesRuPrimary(word) {
    if (Array.isArray(word?.ru_list)) return cleanString(word.ru_list[0])
    if (Array.isArray(word?.ru)) return cleanString(word.ru[0])
    return cleanString(word?.ru)
}

export function isCasesTrainingWord(word, selectedKeys = []) {
    if (word?.type !== "noun") return false
    if (!Array.isArray(selectedKeys)) return false
    return selectedKeys.every((key) => typeof word[key] === "string" && word[key])
}
