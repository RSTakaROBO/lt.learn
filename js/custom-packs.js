import { STR } from "./i18n/strings-ru.js"
import { loadCustomPackRecords } from "./storage.js"
import { normalizeWordEntries } from "./word-entry.js"

/** Название набора: только поле `title` в корне JSON/записи. */
export function packDisplayTitle(root) {
    if (!root || typeof root !== "object") return ""
    const t = root.title
    return typeof t === "string" && t.trim() ? t.trim() : ""
}

function newCustomPackId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `custom-${crypto.randomUUID()}`
    }
    return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Из localStorage → объекты паков для manifestCache (поля как у встроенных + custom). */
export function hydrateCustomPacksFromStorage() {
    const rows = loadCustomPackRecords()
    const out = []
    for (const row of rows) {
        if (!row || typeof row.id !== "string" || !row.id.startsWith("custom-")) continue
        const words = normalizeWordEntries(row.words)
        if (!words.length) continue
        const title = packDisplayTitle(row)
        if (!title) continue
        out.push({
            id: row.id,
            title,
            words,
            custom: true,
            files: [],
        })
    }
    return out
}

/**
 * Разбор загруженного файла словаря (тот же формат, что у words/*.json).
 * @param {string} text
 */
export function parseCustomPackJsonFile(text) {
    let data
    try {
        data = JSON.parse(text)
    } catch {
        throw new Error(STR.errors.jsonInvalid)
    }
    if (!data || typeof data !== "object") throw new Error(STR.errors.jsonRootObject)
    const wordsIn = data.words
    if (!Array.isArray(wordsIn)) {
        throw new Error(STR.errors.jsonNeedWords)
    }
    const words = normalizeWordEntries(wordsIn)
    if (!words.length) {
        throw new Error(STR.errors.jsonNoCompleteArticles)
    }
    const title = packDisplayTitle(data)
    if (!title) throw new Error(STR.errors.jsonNeedTitle)
    return {
        id: newCustomPackId(),
        title,
        words,
    }
}
