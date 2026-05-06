import { fmt } from "../../js/i18n/core.js"
import { STR } from "../../js/i18n/strings-ru.js"
import { hydrateCustomPacksFromStorage, packDisplayTitle } from "../../js/custom-packs.js"
import { TRAIN_MODE } from "../../js/config.js"
import {
    isCompleteVerbEntry,
    normalizeWordEntries,
    WORD_ENTRY_TYPE,
    wordLemma,
} from "../../js/word-entry.js"
import { hasWordRu } from "../../js/wordTranslations.js"

function countWordsInData(data, trainMode) {
    const words = normalizeWordEntries(data?.words)
    let suitable
    if (trainMode === TRAIN_MODE.VOCAB) {
        suitable = words.filter((word) => hasWordRu(word) && wordLemma(word)).length
    } else if (trainMode === TRAIN_MODE.VERBS) {
        suitable = words.filter(isCompleteVerbEntry).length
    } else {
        suitable = words.filter((word) => word.type === WORD_ENTRY_TYPE.NOUN).length
    }
    return { total: words.length, suitable }
}

export function normalizeManifest(raw) {
    if (raw.packs && Array.isArray(raw.packs) && raw.packs.length) {
        return raw
    }
    throw new Error(STR.errors.manifestNeedsPacks)
}

/** Загружает каждый JSON словарь один раз (пути из всех паков). */
export async function prefetchPackWordFiles(base, packs) {
    const uniqueFiles = new Set()
    for (const p of packs) {
        if (!p?.files) continue
        for (const f of p.files) {
            if (typeof f === "string" && f) uniqueFiles.add(f)
        }
    }
    const map = new Map()
    await Promise.all(
        [...uniqueFiles].map(async (file) => {
            try {
                const res = await fetch(`${base}${file}`)
                if (!res.ok)
                    throw new Error(
                        fmt(STR.errors.fileBadStatus, { ref: file, status: res.status })
                    )
                map.set(file, await res.json())
            } catch {
                map.set(file, null)
            }
        })
    )
    return map
}

/** Заголовок встроенного пака из `title` первого файла словаря; у пользовательских — из записи. */
export function attachPackTitlesFromFiles(packs, fileMap) {
    for (const p of packs) {
        if (p?.custom && Array.isArray(p.words)) {
            p.title = packDisplayTitle(p)
            continue
        }
        if (!p?.files?.length) continue
        const first = p.files[0]
        const data = fileMap.get(first)
        p.title = packDisplayTitle(data)
    }
}

export function safePackInputId(packId) {
    return `pack-${String(packId).replace(/[^a-zA-Z0-9_-]/g, "_")}`
}

/** Счётчик слов для карточки после prefetch. */
export function wordCountsForPack(p, fileMap, trainMode) {
    if (p.custom && Array.isArray(p.words)) {
        return countWordsInData({ words: p.words }, trainMode)
    }
    if (!p.files?.length) return null
    let total = 0
    let suitable = 0
    let ok = true
    for (const f of p.files) {
        const data = fileMap.get(f)
        if (data == null) {
            ok = false
            break
        }
        const counts = countWordsInData(data, trainMode)
        total += counts.total
        suitable += counts.suitable
    }
    return ok ? { total, suitable } : null
}

export function isRenderablePackEntry(p) {
    return !!(p && typeof p.id === "string" && p.id && Array.isArray(p.files))
}

/**
 * Загрузка manifest.json, кастомных паков, prefetch JSON, подстановка title.
 * @returns {{ packs: object[]; fileMap: Map<string, object|null>; manifestForCache: object }}
 */
export async function loadAllPacksFromManifest() {
    const base = "words/"
    const manifestRes = await fetch(`${base}manifest.json`, { cache: "no-store" })
    if (!manifestRes.ok) {
        throw new Error(
            fmt(STR.errors.fileBadStatus, { ref: "manifest.json", status: manifestRes.status })
        )
    }
    const raw = await manifestRes.json()
    const normalized = normalizeManifest(raw)
    const packs = [...normalized.packs, ...hydrateCustomPacksFromStorage()]
    const fileMap = await prefetchPackWordFiles(base, packs)
    attachPackTitlesFromFiles(packs, fileMap)
    const manifestForCache = { ...normalized, packs }
    return { packs, fileMap, manifestForCache }
}
