import { STR } from "js/i18n/strings-ru.js"
import { getOtherVerbTenseItem, VerbFormsTable } from "src/screens/help/VerbFormsHelpTables.jsx"

/** Закреплённые на широком десктопном экране правила прошедшего и будущего времени. */
export function VerbTensesReferenceDock({ dockedTenses, onUnpin }) {
    return (
        <>
            {["left", "right"].map((side) => {
                const tenses = dockedTenses[side]
                if (!tenses?.length) return null

                return (
                    <aside
                        key={side}
                        className={`verb-tenses-reference-dock verb-tenses-reference-dock--${side}`}
                        aria-label={STR.help.dockedVerbTensesAria}
                    >
                        {tenses.map((tenseId) => {
                            const item = getOtherVerbTenseItem(tenseId)
                            if (!item) return null
                            return (
                                <VerbFormsTable
                                    key={tenseId}
                                    item={item}
                                    docked
                                    controls={
                                        <button
                                            type="button"
                                            className="verb-tenses-reference-dock__unpin"
                                            aria-label={`${STR.help.unpinVerbTense}: ${item.title}`}
                                            onClick={() => onUnpin(tenseId)}
                                        >
                                            ×
                                        </button>
                                    }
                                />
                            )
                        })}
                    </aside>
                )
            })}
        </>
    )
}
