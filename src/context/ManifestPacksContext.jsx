import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { shallowEqual, useDispatch, useSelector } from "react-redux"

import { fmt } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"
import { setReloadManifestPacksImpl } from "js/packs.js"
import {
    manifestClearPackRows,
    manifestSetPackRows,
    manifestSetSelectedPackIds,
    mutateEngine,
    receiveTrainerUiAction,
    trainerStore,
} from "js/trainer-ui-state.js"
import { loadSelectedPacks, saveSelectedPacks } from "js/storage.js"
import { TRAIN_MODE } from "js/config.js"
import {
    isRenderablePackEntry,
    loadAllPacksFromManifest,
    safePackInputId,
} from "src/context/manifestPacks/manifestPacksLoader.js"
import { wordsForPackPreview } from "src/context/manifestPacks/packPreviewRows.js"
import { wordCountsForPackWords, wordsForPack } from "src/context/manifestPacks/packWordCounts.js"

const ManifestPacksContext = createContext(null)

/**
 * @typedef {{ pack: object; title: string; words: unknown[]; wordCountsByMode: Record<string, {total: number; suitable: number}|null>; safeInputId: string; previewRows: { type: string; lemma: string; translation: string }[] }} PackRowUi
 */

/**
 * @returns {{
 *   packRows: PackRowUi[];
 *   selectedIds: string[];
 *   previewPackRow: PackRowUi | null;
 *   togglePack: (id: string, checked: boolean) => void;
 *   openPackPreview: (id: string) => void;
 *   closePackPreview: () => void;
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
    const screen = useSelector((s) => s.trainer.screen)
    const overlay = useSelector((s) => s.trainer.overlay, shallowEqual)
    const wizardStep = useSelector((s) => s.trainer.wizard.step)
    const [previewPackId, setPreviewPackId] = useState("")
    const previewPackRow = useMemo(
        () => packRows.find((row) => row.pack.id === previewPackId) || null,
        [packRows, previewPackId]
    )

    const runLoad = useCallback(async () => {
        try {
            const { packs, fileMap, manifestForCache } = await loadAllPacksFromManifest()
            mutateEngine((e) => {
                e.manifestCache = manifestForCache
            })
            const rows = packs.filter(isRenderablePackEntry).map((pack) => {
                const words = wordsForPack(pack, fileMap)
                return {
                    pack,
                    title: typeof pack.title === "string" ? pack.title : "",
                    words,
                    wordCountsByMode: {
                        [TRAIN_MODE.CASES]: wordCountsForPackWords(words, TRAIN_MODE.CASES),
                        [TRAIN_MODE.VOCAB]: wordCountsForPackWords(words, TRAIN_MODE.VOCAB),
                        [TRAIN_MODE.VERBS]: wordCountsForPackWords(words, TRAIN_MODE.VERBS),
                    },
                    safeInputId: safePackInputId(pack.id),
                    previewRows: wordsForPackPreview(pack, fileMap),
                }
            })
            if (!rows.length) throw new Error(STR.errors.manifestNoValidPack)
            dispatch(manifestSetPackRows(rows))
            dispatch(manifestSetSelectedPackIds(loadSelectedPacks() || []))
            return true
        } catch (err) {
            mutateEngine((e) => {
                e.manifestCache = null
            })
            setPreviewPackId("")
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

    /** Предпросмотр пака только на шаге выбора наборов; любой другой экран/оверлей его закрывает */
    useEffect(() => {
        if (!previewPackId) return
        if (screen !== "setup") {
            setPreviewPackId("")
            return
        }
        if (Object.values(overlay).some(Boolean)) {
            setPreviewPackId("")
            return
        }
        if (wizardStep !== 2) {
            setPreviewPackId("")
        }
    }, [screen, overlay, wizardStep, previewPackId])

    const value = {
        packRows,
        selectedIds,
        previewPackRow,
        togglePack,
        openPackPreview: setPreviewPackId,
        closePackPreview: () => setPreviewPackId(""),
        reloadManifestPacks: runLoad,
    }

    return <ManifestPacksContext.Provider value={value}>{children}</ManifestPacksContext.Provider>
}
