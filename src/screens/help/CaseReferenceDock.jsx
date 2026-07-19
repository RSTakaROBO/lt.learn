import { CaseReferenceCard } from "src/screens/help/CasesHelpTables.jsx"
import { STR } from "js/i18n/strings-ru.js"

/** Закреплённые на широком десктопном экране карточки падежей. */
export function CaseReferenceDock({ dockedCases, onUnpin }) {
    return (
        <>
            {["left", "right"].map((side) => {
                const cases = dockedCases[side]
                if (!cases?.length) return null

                return (
                    <aside
                        key={side}
                        className={`case-reference-dock case-reference-dock--${side}`}
                        aria-label={STR.help.dockedCasesAria}
                    >
                        {cases.map((caseKey) => (
                            <CaseReferenceCard
                                key={caseKey}
                                caseKey={caseKey}
                                docked
                                controls={
                                    <button
                                        type="button"
                                        className="case-reference-dock__unpin"
                                        aria-label={`${STR.help.unpinCase}: ${STR.cases[caseKey]}`}
                                        onClick={() => onUnpin(caseKey)}
                                    >
                                        ×
                                    </button>
                                }
                            />
                        ))}
                    </aside>
                )
            })}
        </>
    )
}
