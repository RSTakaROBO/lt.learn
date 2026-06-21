import { useRef } from "react"

import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"
import { useHelpScreenOpenEffect } from "src/hooks/useHelpScreenOpenEffect.js"
import { VerbFormsHelpTables } from "src/screens/help/VerbFormsHelpTables.jsx"

export function VerbFormsHelpScreen({ heightMode = "fill" } = {}) {
    const [uiState, dispatch] = useTrainerApp()
    const open = uiState.overlay.verbFormsHelp
    const shellRef = useRef(null)
    const titleRef = useRef(null)
    const scrollBlockRef = useRef(null)

    useHelpScreenOpenEffect({ open, shellRef, scrollBlockRef, titleRef })

    return (
        <AppFlowScreen
            ref={shellRef}
            id="verb-forms-help-shell"
            heightMode={heightMode}
            className={["verb-forms-help-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="verb-forms-help"
                className="app-screen__panel widget panel"
                aria-labelledby="verb-forms-help-title"
            >
                <h2 ref={titleRef} id="verb-forms-help-title" tabIndex={-1}>
                    Три спряжения глаголов
                </h2>
                <div
                    ref={scrollBlockRef}
                    className="app-screen__body cases-help-scroll-block u-scrollbar-hidden"
                >
                    <VerbFormsHelpTables />
                </div>
                <div className="app-screen__footer actions">
                    <Button
                        variant="primary"
                        type="button"
                        onClick={() => dispatch({ type: "OVERLAY_OPEN", name: "helpHub" })}
                    >
                        {STR.help.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
