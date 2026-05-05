import { isCompleteNounEntry, normalizeWordEntries } from "./word-entry.js"

export function isWordEntryComplete(w) {
    return isCompleteNounEntry(w)
}

export function countValidWordsInData(data) {
    return normalizeWordEntries(data?.words).length
}
