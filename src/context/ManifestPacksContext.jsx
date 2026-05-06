import { createContext, useCallback, useContext, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { fmt } from "../../js/i18n/core.js"
import { STR } from "../../js/i18n/strings-ru.js"
import { setReloadManifestPacksImpl } from "../../js/packs.js"
import {
    manifestClearPackRows,
    manifestSetPackRows,
    manifestSetSelectedPackIds,
    mutateEngine,
    receiveTrainerUiAction,
    trainerStore,
} from "../../js/trainer-ui-state.js"
import { loadSelectedPacks, saveSelectedPacks } from "../../js/storage.js"
import { TRAIN_MODE } from "../../js/config.js"
import {
    isRenderablePackEntry,
    loadAllPacksFromManifest,
    safePackInputId,
    wordCountsForPack,
} from "../lib/manifestPacksCore.js"

const ManifestPacksContext = createContext(null)

/**
 * @typedef {{ pack: object; title: string; wordCountsByMode: Record<string, {total: number; suitable: number}|null>; safeInputId: string }} PackRowUi
 */

/**
 * @returns {{
 *   packRows: PackRowUi[];
 *   selectedIds: string[];
 *   togglePack: (id: string, checked: boolean) => void;
 *   reloadManifestPacks: () => Promise<boolean>;
 * }}
 */
export function useManifestPacks() {
    const v = useContext(ManifestPacksContext)
    if (!v) throw new Error("useManifestPacks вне ManifestPacksProvider")
    return v
}

export function ManifestPacksProvider({ children }) {
    const dispatch = useDispatch()
    const packRows = useSelector((s) => s.trainer.manifestUi.packRows)
    const selectedIds = useSelector((s) => s.trainer.manifestUi.selectedPackIds)

    const runLoad = useCallback(async () => {
        try {
            const { packs, fileMap, manifestForCache } = await loadAllPacksFromManifest()
            mutateEngine((e) => {
                e.manifestCache = manifestForCache
            })
            const rows = packs.filter(isRenderablePackEntry).map((pack) => ({
                pack,
                title: typeof pack.title === "string" ? pack.title : "",
                wordCountsByMode: {
                    [TRAIN_MODE.CASES]: wordCountsForPack(pack, fileMap, TRAIN_MODE.CASES),
                    [TRAIN_MODE.VOCAB]: wordCountsForPack(pack, fileMap, TRAIN_MODE.VOCAB),
                },
                safeInputId: safePackInputId(pack.id),
            }))
            if (!rows.length) throw new Error(STR.errors.manifestNoValidPack)
            dispatch(manifestSetPackRows(rows))
            dispatch(manifestSetSelectedPackIds(loadSelectedPacks() || []))
            return true
        } catch (err) {
            mutateEngine((e) => {
                e.manifestCache = null
            })
            dispatch(manifestClearPackRows())
            const message = err instanceof Error ? err.message : String(err)
            dispatch(
                receiveTrainerUiAction({
                    type: "WIZARD_SET_STATUS",
                    name: "pack",
                    message: fmt(STR.main.loadManifestError, { message }),
                })
            )
            console.error(err)
            return false
        }
    }, [dispatch])

    const togglePack = useCallback(
        (id, checked) => {
            const prev = trainerStore.getState().trainer.manifestUi.selectedPackIds
            const next = checked
                ? prev.includes(id)
                    ? prev
                    : [...prev, id]
                : prev.filter((x) => x !== id)
            saveSelectedPacks(next)
            dispatch(manifestSetSelectedPackIds(next))
        },
        [dispatch]
    )

    useEffect(() => {
        runLoad()
    }, [runLoad])

    useEffect(() => {
        setReloadManifestPacksImpl(runLoad)
        return () => setReloadManifestPacksImpl(async () => false)
    }, [runLoad])

    const value = {
        packRows,
        selectedIds,
        togglePack,
        reloadManifestPacks: runLoad,
    }

    return <ManifestPacksContext.Provider value={value}>{children}</ManifestPacksContext.Provider>
}
