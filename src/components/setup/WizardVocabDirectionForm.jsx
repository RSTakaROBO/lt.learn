import { useCallback, useState } from "react"

import { STR } from "js/i18n/strings-ru.js"
import { loadVocabDirections, saveVocabDirections } from "js/storage.js"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { CardList } from "src/components/ui/CardList.jsx"
import { CheckboxButton } from "src/components/ui/CheckboxButton.jsx"
import { ChoiceGroup } from "src/components/ui/ChoiceGroup.jsx"

const defaultDirs = () => ({ ru_to_lt: true, lt_to_ru: false, hardcore: false })

/**
 * Направления и hardcore для режима «Слова»: состояние в React, каждое изменение пишет storage.
 */
export function WizardVocabDirectionForm() {
    const dispatch = useTrainerDispatch()
    const [dirs, setDirs] = useState(() => loadVocabDirections() ?? defaultDirs())

    const commit = useCallback(
        (patch) => {
            dispatch({ type: "WIZARD_CLEAR_STATUS", name: "vocabDirection" })
            setDirs((d) => {
                const next = { ...d, ...patch }
                saveVocabDirections(next)
                return next
            })
        },
        [dispatch]
    )

    return (
        <>
            <ChoiceGroup
                className="vocab-direction-grid"
                aria-labelledby="vocab-direction-step-title"
            >
                <CheckboxButton
                    id="vocab-dir-ru-lt"
                    title={STR.vocabDirection.ruLtTitle}
                    meta={STR.vocabDirection.ruLtMeta}
                    checked={dirs.ru_to_lt}
                    onChange={(e) => commit({ ru_to_lt: e.target.checked })}
                />
                <CheckboxButton
                    id="vocab-dir-lt-ru"
                    title={STR.vocabDirection.ltRuTitle}
                    meta={STR.vocabDirection.ltRuMeta}
                    checked={dirs.lt_to_ru}
                    onChange={(e) => commit({ lt_to_ru: e.target.checked })}
                />
            </ChoiceGroup>
            <div className="vocab-hardcore-block">
                <div className="vocab-hardcore-divider" role="presentation" aria-hidden="true" />
                <CardList className="vocab-hardcore-list">
                    <CheckboxButton
                        id="vocab-hardcore"
                        title={STR.vocabDirection.hardcoreTitle}
                        meta={STR.vocabDirection.hardcoreMeta}
                        checked={dirs.hardcore}
                        onChange={(e) => commit({ hardcore: e.target.checked })}
                    />
                </CardList>
            </div>
        </>
    )
}
