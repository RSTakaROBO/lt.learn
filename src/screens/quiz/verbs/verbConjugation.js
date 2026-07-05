const PERSON_FORM_KEY = {
    "1s": "1s",
    "2s": "2s",
    "3": "3",
    "3ms": "3",
    "3fs": "3",
    "1p": "1p",
    "2p": "2p",
    "3mp": "3",
    "3fp": "3",
}

export const VERB_CONJUGATION_TENSES = [
    { key: "past", timeCueLt: "vakar" },
    { key: "present", timeCueLt: "šiandien" },
    { key: "future", timeCueLt: "rytoj" },
]

export const VERB_CONJUGATION_PERSONS = [
    { key: "1s", pronounLt: "aš", formKey: "1s" },
    { key: "2s", pronounLt: "tu", formKey: "2s" },
    { key: "3ms", pronounLt: "jis", formKey: "3" },
    { key: "3fs", pronounLt: "ji", formKey: "3" },
    { key: "1p", pronounLt: "mes", formKey: "1p" },
    { key: "2p", pronounLt: "jūs", formKey: "2p" },
    { key: "3mp", pronounLt: "jie", formKey: "3" },
    { key: "3fp", pronounLt: "jos", formKey: "3" },
]

const PRESENT_ENDINGS = {
    I: { "1s": "u", "2s": "i", "3": "a", "1p": "ame", "2p": "ate" },
    II: { "1s": "iu", "2s": "i", "3": "i", "1p": "ime", "2p": "ite" },
    III: { "1s": "au", "2s": "ai", "3": "o", "1p": "ome", "2p": "ote" },
}

const PAST_O_ENDINGS = { "1s": "au", "2s": "ai", "3": "o", "1p": "ome", "2p": "ote" }
const PAST_E_ENDINGS = { "1s": "iau", "2s": "ei", "3": "ė", "1p": "ėme", "2p": "ėte" }
const FUTURE_ENDINGS = { "1s": "siu", "2s": "si", "3": "s", "1p": "sime", "2p": "site" }

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

function cleanConjugation(value) {
    const text = cleanString(value).toUpperCase()
    return text === "I" || text === "II" || text === "III" ? text : ""
}

function cleanStem(word, key) {
    return cleanString(word?.stems?.[key])
}

function buildForms(stem, endings) {
    if (!stem) return null
    const out = {}
    for (const [key, ending] of Object.entries(endings)) {
        out[key] = `${stem}${ending}`
    }
    return out
}

function generatedPresentForms(word) {
    const endings = PRESENT_ENDINGS[cleanConjugation(word?.conjugation)]
    if (!endings) return null
    return buildForms(cleanStem(word, "present"), endings)
}

function generatedPastForms(word) {
    const past3 = cleanString(word?.forms?.past3)
    const endings = past3.endsWith("ė")
        ? PAST_E_ENDINGS
        : past3.endsWith("o")
          ? PAST_O_ENDINGS
          : null
    if (!endings) return null
    return buildForms(cleanStem(word, "past"), endings)
}

function generatedFutureForms(word) {
    return buildForms(cleanStem(word, "infinitive"), FUTURE_ENDINGS)
}

function mergeOverrides(forms, overrides) {
    const out = forms ? { ...forms } : {}
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return out
    for (const [key, value] of Object.entries(overrides)) {
        const text = cleanString(value)
        if (PERSON_FORM_KEY[key] && text) out[PERSON_FORM_KEY[key]] = text
    }
    return out
}

export function generateVerbConjugationForms(word) {
    if (word?.type !== "verb") return null
    const overrides =
        word?.overrides && typeof word.overrides === "object" && !Array.isArray(word.overrides)
            ? word.overrides
            : {}
    const forms = {
        present: mergeOverrides(generatedPresentForms(word), overrides.present),
        past: mergeOverrides(generatedPastForms(word), overrides.past),
        future: mergeOverrides(generatedFutureForms(word), overrides.future),
    }
    if (!Object.values(forms).some((rows) => Object.keys(rows).length > 0)) return null
    return forms
}

export function verbConjugationExpectedForTask(task) {
    const formKey = VERB_CONJUGATION_PERSONS.find((row) => row.key === task?.personKey)?.formKey
    if (!formKey) return ""
    const forms = generateVerbConjugationForms(task?.word)
    return cleanString(forms?.[task?.tenseKey]?.[formKey])
}

export function isVerbConjugationTrainingWord(word) {
    const forms = generateVerbConjugationForms(word)
    return VERB_CONJUGATION_TENSES.every((tense) =>
        VERB_CONJUGATION_PERSONS.every((person) =>
            cleanString(forms?.[tense.key]?.[person.formKey])
        )
    )
}
