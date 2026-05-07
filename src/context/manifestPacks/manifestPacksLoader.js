import { wordsFetchBase } from "../../../js/config.js"
import { hydrateCustomPacksFromStorage, packDisplayTitle } from "../../../js/custom-packs.js"
import { fmt } from "../../../js/i18n/core.js"
import { STR } from "../../../js/i18n/strings-ru.js"

export function normalizeManifest(raw) {
    if (raw.packs && Array.isArray(raw.packs) && raw.packs.length) {
        return raw
    }
    throw new Error(STR.errors.manifestNeedsPacks)
}

/** Загружает каждый JSON словарь один раз (пути из всех паков). */
export async function prefetchPackWordFiles(base, packs) {
    const uniqueFiles = new Set()
    for (const pack of packs) {
        if (!pack?.files) continue
        for (const file of pack.files) {
            if (typeof file === "string" && file) uniqueFiles.add(file)
        }
    }
    const map = new Map()
    await Promise.all(
        [...uniqueFiles].map(async (file) => {
            try {
                const res = await fetch(`${base}${file}`)
                if (!res.ok) {
                    throw new Error(
                        fmt(STR.errors.fileBadStatus, { ref: file, status: res.status })
                    )
                }
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
    for (const pack of packs) {
        if (pack?.custom && Array.isArray(pack.words)) {
            pack.title = packDisplayTitle(pack)
            continue
        }
        if (!pack?.files?.length) continue
        const firstFile = pack.files[0]
        const data = fileMap.get(firstFile)
        pack.title = packDisplayTitle(data)
    }
}

export function safePackInputId(packId) {
    return `pack-${String(packId).replace(/[^a-zA-Z0-9_-]/g, "_")}`
}

export function isRenderablePackEntry(pack) {
    return !!(pack && typeof pack.id === "string" && pack.id && Array.isArray(pack.files))
}

/**
 * Загрузка manifest.json, кастомных паков, prefetch JSON, подстановка title.
 * @returns {{ packs: object[]; fileMap: Map<string, object|null>; manifestForCache: object }}
 */
export async function loadAllPacksFromManifest() {
    const base = wordsFetchBase()
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
