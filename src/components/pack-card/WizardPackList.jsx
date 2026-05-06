import { TRAIN_MODE } from "../../../js/config.js"
import { fmt } from "../../../js/i18n/core.js"
import { STR } from "../../../js/i18n/strings-ru.js"
import {
    loadSelectedPacks,
    loadTrainMode,
    removeCustomPackById,
    saveSelectedPacks,
} from "../../../js/storage.js"
import { useManifestPacks } from "../../context/ManifestPacksContext.jsx"
import { useTrainerDispatch } from "../../context/TrainerAppContext.jsx"
import { CheckboxButton } from "../ui/CheckboxButton.jsx"
import { ListHolder } from "../ui/ListHolder.jsx"
import { PackCardDeleteButton } from "./PackCardDeleteButton.jsx"

function wordCountLabelFromCounts(counts) {
    if (!counts) return STR.errors.countFailed
    return fmt(STR.packs.wordCountMeta, {
        total: counts.total,
        suitable: counts.suitable,
    })
}

/**
 * @param {{ scrollWell?: boolean }} props
 */
export function WizardPackList({ scrollWell = true }) {
    const { packRows, selectedIds, togglePack, reloadManifestPacks } = useManifestPacks()
    const dispatch = useTrainerDispatch()
    const trainMode = loadTrainMode() || TRAIN_MODE.CASES

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

    return (
        <ListHolder id="pack-list" scrollWell={scrollWell}>
            {packRows.map((row) => (
                <CheckboxButton
                    key={row.pack.id}
                    id={row.safeInputId}
                    value={row.pack.id}
                    title={row.title}
                    meta={wordCountLabelFromCounts(row.wordCountsByMode?.[trainMode])}
                    metaClassName="pack-word-count"
                    className={row.pack.custom ? "pack-card--custom-user" : undefined}
                    checked={selectedIds.includes(row.pack.id)}
                    onChange={(e) => togglePack(row.pack.id, e.target.checked)}
                    faceBeforeTick={
                        row.pack.custom ? (
                            <PackCardDeleteButton
                                packId={row.pack.id}
                                ariaLabel={fmt(STR.errors.deletePackAria, { title: row.title })}
                                onClick={(e) => onDeleteCustomPack(e, row.pack.id)}
                            />
                        ) : undefined
                    }
                />
            ))}
        </ListHolder>
    )
}
