import { CASE_KEYS, VERB_FORM_KEYS } from "./config.js"

export const WORD_ENTRY_TYPE = {
    NOUN: "noun",
    VERB: "verb",
    ADJECTIVE: "adjective",
}

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

function normalizeRuList(entry) {
    const out = []
    const add = (value) => {
        const s = cleanString(value)
        if (s && !out.includes(s)) out.push(s)
    }
    if (Array.isArray(entry?.ru)) {
        entry.ru.forEach(add)
    } else {
        add(entry?.ru)
    }
    if (Array.isArray(entry?.ru_alt)) {
        entry.ru_alt.forEach(add)
    } else {
        add(entry?.ru_alt)
    }
    return out
}

function normalizeNounForms(entry) {
    const source = entry && typeof entry.forms === "object" && entry.forms ? entry.forms : entry
    const forms = {}
    for (const key of CASE_KEYS) {
        const value = cleanString(source?.[key])
        if (!value) return null
        forms[key] = value
    }
    return forms
}

function normalizeVerbForms(entry) {
    const source = entry && typeof entry.forms === "object" && entry.forms ? entry.forms : entry
    const forms = {}
    for (const key of VERB_FORM_KEYS) {
        const fallback = key === "infinitive" ? entry?.lemma : ""
        const value = cleanString(source?.[key]) || cleanString(fallback)
        if (!value) return null
        forms[key] = value
    }
    return forms
}

/**
 * Приводит словарную статью к внутреннему формату.
 *
 * Сейчас движок умеет тренировать `noun`, но формат уже допускает будущие
 * `verb`/`adjective`: они просто не попадают в noun-only упражнения.
 */
export function normalizeWordEntry(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
    const type = cleanString(raw.type) || WORD_ENTRY_TYPE.NOUN
    if (type === WORD_ENTRY_TYPE.VERB) {
        const lemma = cleanString(raw.lemma)
        if (!lemma) return null
        const forms = normalizeVerbForms(raw)
        return {
            ...raw,
            type,
            lemma,
            forms: forms || raw.forms,
            ru_list: normalizeRuList(raw),
            ...(forms
                ? {
                      infinitive: forms.infinitive,
                      present3: forms.present3,
                      past3: forms.past3,
                  }
                : {}),
        }
    }

    if (type !== WORD_ENTRY_TYPE.NOUN) {
        const lemma = cleanString(raw.lemma)
        return lemma ? { ...raw, type, lemma, ru_list: normalizeRuList(raw) } : null
    }

    const forms = normalizeNounForms(raw)
    if (!forms) return null
    const lemma = cleanString(raw.lemma) || forms.nominative
    const ruList = normalizeRuList(raw)

    return {
        ...raw,
        type: WORD_ENTRY_TYPE.NOUN,
        lemma,
        forms,
        ru_list: ruList,
        nominative: forms.nominative,
        genitive: forms.genitive,
        dative: forms.dative,
        accusative: forms.accusative,
        instrumental: forms.instrumental,
        locative: forms.locative,
        vocative: forms.vocative,
        ru: ruList[0] ?? "",
        ru_alt: ruList.slice(1).join(", "),
    }
}

export function normalizeWordEntries(words) {
    if (!Array.isArray(words)) return []
    return words.map(normalizeWordEntry).filter(Boolean)
}

export function wordLemma(entry) {
    const normalized = normalizeWordEntry(entry)
    return cleanString(normalized?.lemma || normalized?.nominative)
}
