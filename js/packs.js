import { wordsFetchBase } from "./config.js"
import { fmt } from "./i18n/core.js"
import { STR } from "./i18n/strings-ru.js"
import { filterLearnedWords } from "./learned-words.js"
import { loadExcludeLearnedWords } from "./storage.js"
import { getEngine, mutateEngine, trainerStore } from "./trainer-ui-state.js"
import { parseCurrentWordEntries, parseCurrentWordPackDocument } from "./word-entry.js"

export function getCheckedPackIds() {
    return [...trainerStore.getState().trainer.manifestUi.selectedPackIds]
}

let reloadManifestImpl = async () => false

export function setReloadManifestPacksImpl(fn) {
    reloadManifestImpl = fn
}

export async function reloadManifestPacks() {
    return reloadManifestImpl()
}

function refsFromPacks(packs) {
    const out = []
    const seen = new Set()
    for (const pack of Array.isArray(packs) ? packs : []) {
        if (!pack) continue
        if (pack.custom && Array.isArray(pack.words)) {
            const token = `custom:${pack.id}`
            if (typeof pack.id === "string" && !seen.has(token)) {
                seen.add(token)
                out.push(token)
            }
            continue
        }
        if (!Array.isArray(pack.files)) continue
        for (const file of pack.files) {
            if (typeof file !== "string" || !file || seen.has(file)) continue
            seen.add(file)
            out.push(file)
        }
    }
    return out
}

export function resolveFilesFromPackIds(packIds) {
    const packs = getEngine().manifestCache?.packs
    if (!Array.isArray(packIds) || !packs) return []
    const selected = new Set(packIds)
    return refsFromPacks(packs.filter((pack) => selected.has(pack?.id)))
}

export function resolveAllWordFiles() {
    return refsFromPacks(getEngine().manifestCache?.packs)
}

/** refs are "name.json" or "custom:id". */
export async function loadWordsFromFiles(refs, { filterLearned = loadExcludeLearnedWords() } = {}) {
    if (!Array.isArray(refs) || !refs.length) throw new Error(STR.errors.noFilesToLoad)

    const base = wordsFetchBase()
    const all = []
    for (const ref of refs) {
        if (typeof ref === "string" && ref.startsWith("custom:")) {
            const id = ref.slice("custom:".length)
            const pack = getEngine().manifestCache?.packs?.find((p) => p.id === id && p.custom)
            if (!pack?.words?.length) throw new Error(STR.errors.customPackMissing)
            all.push(...parseCurrentWordEntries(pack.words))
            continue
        }
        const url = `${base}${ref}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(fmt(STR.errors.fileBadStatus, { ref, status: res.status }))
        const data = parseCurrentWordPackDocument(await res.json())
        if (!data) throw new Error(fmt(STR.errors.fileNoWordsArray, { ref }))
        all.push(...data.words)
    }

    const words = filterLearned ? filterLearnedWords(all, getEngine().wordStats) : all

    mutateEngine((e) => {
        e.wordBank = words
    })
}
