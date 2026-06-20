import { CASE_KEYS, VERB_FORM_KEYS } from "./config.js"

export const WORD_PACK_SCHEMA_VERSION = 1

export const WORD_ENTRY_TYPE = {
    NOUN: "noun",
    VERB: "verb",
    ADJECTIVE: "adjective",
}

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

function uniqueStrings(values) {
    const out = []
    for (const value of values) {
        const text = cleanString(value)
        if (text && !out.includes(text)) out.push(text)
    }
    return out
}

function legacyTranslations(entry) {
    if (Array.isArray(entry?.translations)) return uniqueStrings(entry.translations)
    if (Array.isArray(entry?.ru_list)) return uniqueStrings(entry.ru_list)
    if (Array.isArray(entry?.ru)) return uniqueStrings(entry.ru)
    return uniqueStrings([entry?.ru])
}

function legacyForms(entry, keys) {
    const source = entry && typeof entry.forms === "object" && entry.forms ? entry.forms : entry
    const forms = {}
    for (const key of keys) {
        const value = cleanString(source?.[key])
        if (value) forms[key] = value
    }
    return forms
}

function migrateLegacyWordEntry(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
    const type = cleanString(raw.type) || WORD_ENTRY_TYPE.NOUN
    const formKeys =
        type === WORD_ENTRY_TYPE.NOUN
            ? CASE_KEYS
            : type === WORD_ENTRY_TYPE.VERB
              ? VERB_FORM_KEYS
              : []
    const forms = legacyForms(raw, formKeys)
    const lemma =
        cleanString(raw.lemma) ||
        (type === WORD_ENTRY_TYPE.NOUN ? cleanString(forms.nominative) : "")
    if (!lemma) return null

    const legacyKeys = new Set([
        "ru",
        "ru_list",
        "translations",
        "forms",
        ...CASE_KEYS,
        ...VERB_FORM_KEYS,
    ])
    const migrated = {}
    for (const [key, value] of Object.entries(raw)) {
        if (!legacyKeys.has(key)) migrated[key] = value
    }
    return {
        ...migrated,
        type,
        lemma,
        forms,
        translations: legacyTranslations(raw),
    }
}

function currentForms(raw, keys) {
    if (!raw?.forms || typeof raw.forms !== "object" || Array.isArray(raw.forms)) return null
    const forms = {}
    for (const key of keys) {
        const value = cleanString(raw.forms[key])
        if (!value) return null
        forms[key] = value
    }
    return forms
}

export function parseCurrentWordEntry(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
    if (
        ["ru", "ru_list", ...CASE_KEYS, ...VERB_FORM_KEYS].some((key) =>
            Object.prototype.hasOwnProperty.call(raw, key)
        )
    ) {
        return null
    }
    const type = cleanString(raw.type)
    const lemma = cleanString(raw.lemma)
    if (!type || !lemma || !Array.isArray(raw.translations)) return null

    let forms = {}
    if (type === WORD_ENTRY_TYPE.NOUN) {
        forms = currentForms(raw, CASE_KEYS)
        if (!forms) return null
    } else if (type === WORD_ENTRY_TYPE.VERB) {
        forms = currentForms(raw, VERB_FORM_KEYS)
        if (!forms) return null
    } else {
        if (!raw.forms || typeof raw.forms !== "object" || Array.isArray(raw.forms)) return null
        if (Object.keys(raw.forms).length !== 0) return null
    }

    return {
        ...raw,
        type,
        lemma,
        forms,
        translations: uniqueStrings(raw.translations),
    }
}

export function parseCurrentWordEntries(words) {
    if (!Array.isArray(words)) return []
    return words.map(parseCurrentWordEntry).filter(Boolean)
}

export function parseCurrentWordPackDocument(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
    if (raw.schemaVersion !== WORD_PACK_SCHEMA_VERSION || !Array.isArray(raw.words)) return null
    return {
        ...raw,
        schemaVersion: WORD_PACK_SCHEMA_VERSION,
        words: parseCurrentWordEntries(raw.words),
    }
}

/** Одноразовый переход импортируемого JSON старого формата к текущей схеме пака. */
export function migrateWordPackDocument(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
    const sourceVersion = raw.schemaVersion == null ? 0 : Number(raw.schemaVersion)
    if (sourceVersion === WORD_PACK_SCHEMA_VERSION) return parseCurrentWordPackDocument(raw)
    if (sourceVersion !== 0 || !Array.isArray(raw.words)) return null

    return parseCurrentWordPackDocument({
        ...raw,
        schemaVersion: WORD_PACK_SCHEMA_VERSION,
        words: raw.words.map(migrateLegacyWordEntry).filter(Boolean),
    })
}
