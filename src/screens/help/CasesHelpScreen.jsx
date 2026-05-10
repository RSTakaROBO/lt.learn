import { useRef } from "react"

import { CasesHelpTables } from "src/screens/help/CasesHelpTables.jsx"
import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"
import { useHelpScreenOpenEffect } from "src/hooks/useHelpScreenOpenEffect.js"

/**
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function CasesHelpScreen({ heightMode = "fill" } = {}) {
    const [uiState, dispatch] = useTrainerApp()
    const open = uiState.overlay.casesHelp
    const shellRef = useRef(null)
    const titleRef = useRef(null)
    const scrollBlockRef = useRef(null)

    useHelpScreenOpenEffect({ open, shellRef, scrollBlockRef, titleRef })

    return (
        <AppFlowScreen
            ref={shellRef}
            id="cases-help-shell"
            heightMode={heightMode}
            className={["cases-help-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="cases-help"
                className="app-screen__panel widget panel"
                aria-labelledby="cases-help-title"
            >
                <h2 ref={titleRef} id="cases-help-title" tabIndex={-1}>
                    {STR.help.casesTitle}
                </h2>
                <div ref={scrollBlockRef} className="app-screen__body cases-help-scroll-block">
                    <CasesHelpTables />
                </div>
                <div className="app-screen__footer actions">
                    <Button
                        variant="primary"
                        type="button"
                        onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "casesHelp" })}
                    >
                        {STR.help.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
