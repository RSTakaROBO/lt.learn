import { useRef } from "react"

import { VerbsHelpTables } from "src/screens/help/VerbsHelpTables.jsx"
import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"
import { useHelpScreenOpenEffect } from "src/hooks/useHelpScreenOpenEffect.js"

/**
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function VerbsHelpScreen({ heightMode = "fill" } = {}) {
    const [uiState, dispatch] = useTrainerApp()
    const open = uiState.overlay.verbsHelp
    const shellRef = useRef(null)
    const titleRef = useRef(null)
    const scrollBlockRef = useRef(null)

    useHelpScreenOpenEffect({ open, shellRef, scrollBlockRef, titleRef })

    return (
        <AppFlowScreen
            ref={shellRef}
            id="verbs-help-shell"
            heightMode={heightMode}
            className={["verbs-help-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="verbs-help"
                className="app-screen__panel widget panel"
                aria-labelledby="verbs-help-title"
            >
                <h2 ref={titleRef} id="verbs-help-title" tabIndex={-1}>
                    Справка: <span lang="lt">yra</span> и <span lang="lt">nėra</span>
                </h2>
                <div ref={scrollBlockRef} className="app-screen__body cases-help-scroll-block">
                    <VerbsHelpTables />
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
