import { useEffect } from "react"
import { shallowEqual, useSelector } from "react-redux"

import { TRAIN_MODE } from "js/config.js"
import { fmt } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"
import {
    loadSelectedPacks,
    loadTrainMode,
    removeCustomPackById,
    saveSelectedPacks,
} from "js/storage.js"
import { countPackWords } from "src/context/manifestPacks/packWordCounts.js"
import { useManifestPacks } from "src/context/ManifestPacksContext.jsx"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { CardList } from "src/components/ui/CardList.jsx"
import { CheckboxButton } from "src/components/ui/CheckboxButton.jsx"
import { PackCardDeleteButton } from "src/components/pack-card/PackCardDeleteButton.jsx"
import { PackCardPreviewButton } from "src/components/pack-card/PackCardPreviewButton.jsx"

function wordCountLabelFromCounts(counts) {
    if (!counts) return STR.errors.countFailed
    return fmt(STR.packs.wordCountMeta, {
        total: counts.total,
        suitable: counts.suitable,
    })
}

function wordCountsForRow(row, trainMode, excludeLearnedWords, wordStats) {
    if (!excludeLearnedWords) return row.wordCountsByMode?.[trainMode] ?? null
    if (!Array.isArray(row.words)) return null
    return countPackWords(row.words, trainMode, { excludeLearnedWords, wordStats })
}

function isPackSelectable(row, trainMode, excludeLearnedWords, wordStats) {
    return (wordCountsForRow(row, trainMode, excludeLearnedWords, wordStats)?.suitable ?? 0) > 0
}

/**
 * @param {{ scrollWell?: boolean }} props
 */
export function WizardPackList({ scrollWell = true }) {
    const { packRows, selectedIds, togglePack, reloadManifestPacks, openPackPreview } =
        useManifestPacks()
    const { excludeLearnedWords, wordStats } = useSelector(
        (s) => ({
            excludeLearnedWords: s.trainer.persisted.excludeLearnedWords,
            wordStats: s.trainer.engine.wordStats,
        }),
        shallowEqual
    )
    const dispatch = useTrainerDispatch()
    const trainMode = loadTrainMode() || TRAIN_MODE.CASES

    useEffect(() => {
        for (const row of packRows) {
            if (
                selectedIds.includes(row.pack.id) &&
                !isPackSelectable(row, trainMode, excludeLearnedWords, wordStats)
            ) {
                togglePack(row.pack.id, false)
            }
        }
    }, [excludeLearnedWords, packRows, selectedIds, togglePack, trainMode, wordStats])

    async function onDeleteCustomPack(e, packId) {
        e.preventDefault()
        e.stopPropagation()
        removeCustomPackById(packId)
        const sel = loadSelectedPacks()
        if (sel && sel.length) saveSelectedPacks(sel.filter((x) => x !== packId))
        dispatch({ type: "WIZARD_CLEAR_STATUS", name: "pack" })
        const ok = await reloadManifestPacks()
        if (ok) {
            dispatch({
                type: "WIZARD_SET_STATUS",
                name: "pack",
                message: STR.events.customPackRemoved,
            })
        }
    }

    function onPreviewPack(e, packId) {
        e.preventDefault()
        e.stopPropagation()
        openPackPreview(packId)
    }

    return (
        <CardList id="pack-list" scrollWell={scrollWell}>
            {packRows.map((row) => {
                const counts = wordCountsForRow(row, trainMode, excludeLearnedWords, wordStats)
                const selectable = (counts?.suitable ?? 0) > 0
                return (
                    <CheckboxButton
                        key={row.pack.id}
                        id={row.safeInputId}
                        value={row.pack.id}
                        title={row.title}
                        meta={wordCountLabelFromCounts(counts)}
                        metaClassName="pack-word-count"
                        className={row.pack.custom ? "pack-card--custom-user" : undefined}
                        checked={selectable && selectedIds.includes(row.pack.id)}
                        disabled={!selectable}
                        onChange={(e) => togglePack(row.pack.id, e.target.checked)}
                        faceBeforeTick={
                            <>
                                <PackCardPreviewButton
                                    packId={row.pack.id}
                                    ariaLabel={fmt(STR.packs.previewAria, {
                                        title: row.title,
                                    })}
                                    onClick={(e) => onPreviewPack(e, row.pack.id)}
                                />
                                {row.pack.custom ? (
                                    <PackCardDeleteButton
                                        packId={row.pack.id}
                                        ariaLabel={fmt(STR.errors.deletePackAria, {
                                            title: row.title,
                                        })}
                                        onClick={(e) => onDeleteCustomPack(e, row.pack.id)}
                                    />
                                ) : null}
                            </>
                        }
                    />
                )
            })}
        </CardList>
    )
}
