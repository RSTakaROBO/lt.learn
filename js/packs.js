import { fmt } from "./i18n/core.js"
import { STR } from "./i18n/strings-ru.js"
import { getEngine, mutateEngine, trainerStore } from "./trainer-ui-state.js"
import { normalizeWordEntries } from "./word-entry.js"

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

export function resolveFilesFromPackIds(packIds) {
    if (!getEngine().manifestCache?.packs) return []
    const out = []
    const seen = new Set()
    for (const id of packIds) {
        const pack = getEngine().manifestCache.packs.find((p) => p.id === id)
        if (!pack) continue
        if (pack.custom && Array.isArray(pack.words)) {
            const token = `custom:${pack.id}`
            if (!seen.has(token)) {
                seen.add(token)
                out.push(token)
            }
            continue
        }
        if (!pack.files?.length) continue
        for (const file of pack.files) {
            if (typeof file !== "string" || !file || seen.has(file)) continue
            seen.add(file)
            out.push(file)
        }
    }
    return out
}

/** refs — пути вида «имя.json» или «custom:id». */
export async function loadWordsFromFiles(refs) {
    if (!Array.isArray(refs) || !refs.length) throw new Error(STR.errors.noFilesToLoad)

    const base = "words/"
    const all = []
    for (const ref of refs) {
        if (typeof ref === "string" && ref.startsWith("custom:")) {
            const id = ref.slice("custom:".length)
            const pack = getEngine().manifestCache?.packs?.find((p) => p.id === id && p.custom)
            if (!pack?.words?.length) throw new Error(STR.errors.customPackMissing)
            all.push(...normalizeWordEntries(pack.words))
            continue
        }
        const url = `${base}${ref}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(fmt(STR.errors.fileBadStatus, { ref, status: res.status }))
        const data = await res.json()
        const words = data.words
        if (!Array.isArray(words)) throw new Error(fmt(STR.errors.fileNoWordsArray, { ref }))
        all.push(...normalizeWordEntries(words))
    }

    mutateEngine((e) => {
        e.wordBank = all
    })
}
