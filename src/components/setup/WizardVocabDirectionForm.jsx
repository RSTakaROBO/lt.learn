import { useCallback, useState } from "react"

import { VOCAB_MODE } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { loadVocabDirections, saveVocabDirections } from "js/storage.js"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { CardList } from "src/components/ui/CardList.jsx"
import { CheckboxButton } from "src/components/ui/CheckboxButton.jsx"
import { ChoiceGroup } from "src/components/ui/ChoiceGroup.jsx"

const defaultDirs = () => ({
    ru_to_lt: true,
    lt_to_ru: false,
    hardcore: false,
    vocabMode: VOCAB_MODE.CHOICES,
})

/**
 * Направления и формат ответа для режима «Слова»: состояние в React, каждое изменение пишет storage.
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
                <CardList className="vocab-hardcore-list" role="radiogroup">
                    <CheckboxButton
                        id="vocab-mode-single"
                        type="radio"
                        name="vocab-mode"
                        title={STR.vocabDirection.modeSingleTitle}
                        meta={STR.vocabDirection.modeSingleMeta}
                        checked={dirs.vocabMode === VOCAB_MODE.SINGLE}
                        onChange={() => commit({ vocabMode: VOCAB_MODE.SINGLE, hardcore: false })}
                    />
                    <CheckboxButton
                        id="vocab-mode-choices"
                        type="radio"
                        name="vocab-mode"
                        title={STR.vocabDirection.modeChoicesTitle}
                        meta={STR.vocabDirection.modeChoicesMeta}
                        checked={(dirs.vocabMode || VOCAB_MODE.CHOICES) === VOCAB_MODE.CHOICES}
                        onChange={() => commit({ vocabMode: VOCAB_MODE.CHOICES, hardcore: false })}
                    />
                    <CheckboxButton
                        id="vocab-hardcore"
                        type="radio"
                        name="vocab-mode"
                        className="vocab-mode-card--hardcore"
                        title={STR.vocabDirection.hardcoreTitle}
                        meta={STR.vocabDirection.hardcoreMeta}
                        checked={dirs.vocabMode === VOCAB_MODE.HARDCORE || dirs.hardcore}
                        onChange={() => commit({ vocabMode: VOCAB_MODE.HARDCORE, hardcore: true })}
                    />
                </CardList>
            </div>
        </>
    )
}
