import { CASE_BY_KEY, CASE_KEYS, VERB_FORM_BY_KEY, VERB_FORM_KEYS } from "js/config.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

function tokenKey(value) {
    return cleanString(value).toLocaleLowerCase("lt")
}

function translationsForWord(word) {
    return Array.isArray(word?.translations)
        ? word.translations.map(cleanString).filter(Boolean)
        : []
}

function caseMatchForWord(word, token) {
    const forms = word?.forms
    if (!forms || typeof forms !== "object") return null
    const needle = tokenKey(token)
    for (const key of CASE_KEYS) {
        if (tokenKey(forms[key]) === needle) {
            return {
                key,
                label: CASE_BY_KEY[key]?.lt || key,
            }
        }
    }
    return null
}

function verbFormsForWord(word) {
    const source = word?.forms
    if (word?.type !== "verb" || !source || typeof source !== "object") return []
    return VERB_FORM_KEYS.map((key) => ({
        key,
        label: VERB_FORM_BY_KEY[key]?.label || key,
        value: cleanString(source?.[key] || (key === "infinitive" ? word?.lemma : "")),
    })).filter((row) => row.value)
}

function wordMatchesToken(word, token) {
    const needle = tokenKey(token)
    if (!needle || !word || typeof word !== "object") return false
    if (tokenKey(word.lemma) === needle) return true
    const forms = word.forms && typeof word.forms === "object" ? Object.values(word.forms) : []
    return forms.some((form) => tokenKey(form) === needle)
}

export function collectSentenceLookupWords({ wordBank = [], packRows = [] } = {}) {
    const out = []
    const seen = new Set()
    for (const word of [...wordBank, ...packRows.flatMap((row) => row?.words || [])]) {
        if (!word || typeof word !== "object") continue
        const id = `${word.type || ""}:${word.lemma || ""}:${translationsForWord(word).join("|")}`
        if (seen.has(id)) continue
        seen.add(id)
        out.push(word)
    }
    return out
}

export function sentenceTokenInfo(token, lookupWords) {
    const word = Array.isArray(lookupWords)
        ? lookupWords.find((candidate) => wordMatchesToken(candidate, token))
        : null
    if (!word) return null

    const translations = translationsForWord(word)
    const match = caseMatchForWord(word, token)
    const verbForms = verbFormsForWord(word)
    if (!translations.length && !match && !verbForms.length) return null

    return {
        word,
        translations,
        verbForms,
        caseKey: match?.key || "",
        caseLabel: match?.label || "",
    }
}
