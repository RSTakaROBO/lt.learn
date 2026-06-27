import { useCallback, useState } from "react"

import { VERB_MODE } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { getResolvedVerbMode, saveVerbMode } from "js/storage.js"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { CardList } from "src/components/ui/CardList.jsx"
import { CheckboxButton } from "src/components/ui/CheckboxButton.jsx"

export function WizardVerbModeForm() {
    const dispatch = useTrainerDispatch()
    const [mode, setMode] = useState(() => getResolvedVerbMode())

    const commit = useCallback(
        (nextMode) => {
            dispatch({ type: "WIZARD_CLEAR_STATUS", name: "verbMode" })
            saveVerbMode(nextMode)
            setMode(nextMode)
        },
        [dispatch]
    )

    return (
        <CardList
            className="vocab-hardcore-list"
            role="radiogroup"
            aria-labelledby="verb-mode-step-title"
        >
            <CheckboxButton
                id="verb-mode-cards"
                type="radio"
                name="verb-mode"
                title={STR.verbMode.cardsTitle}
                meta={STR.verbMode.cardsMeta}
                checked={mode === VERB_MODE.CARDS}
                onChange={() => commit(VERB_MODE.CARDS)}
            />
            <CheckboxButton
                id="verb-mode-form-cards"
                type="radio"
                name="verb-mode"
                title={STR.verbMode.formCardsTitle}
                meta={STR.verbMode.formCardsMeta}
                checked={mode === VERB_MODE.FORM_CARDS}
                onChange={() => commit(VERB_MODE.FORM_CARDS)}
            />
            <CheckboxButton
                id="verb-mode-forms"
                type="radio"
                name="verb-mode"
                title={STR.verbMode.formsTitle}
                meta={STR.verbMode.formsMeta}
                checked={mode === VERB_MODE.FORMS}
                onChange={() => commit(VERB_MODE.FORMS)}
            />
        </CardList>
    )
}
