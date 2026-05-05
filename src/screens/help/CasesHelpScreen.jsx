import { useEffect } from "react"

import { CasesHelpTables } from "./CasesHelpTables.jsx"
import { STR } from "../../../js/i18n/strings-ru.js"
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx"
import { Button } from "../../components/ui/Button.jsx"
import { useTrainerApp } from "../../context/TrainerAppContext.jsx"

/**
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function CasesHelpScreen({ heightMode = "fill" } = {}) {
    const [uiState, dispatch] = useTrainerApp()
    const open = uiState.overlay.casesHelp

    useEffect(() => {
        if (!open) return
        const shell = document.getElementById("cases-help-shell")
        const block = shell?.querySelector(".cases-help-scroll-block")
        if (block instanceof HTMLElement) block.scrollTop = 0
        if (shell) shell.scrollTop = 0
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        requestAnimationFrame(() => {
            document.getElementById("cases-help-title")?.focus({ preventScroll: true })
        })
    }, [open])

    return (
        <AppFlowScreen
            id="cases-help-shell"
            heightMode={heightMode}
            className={["cases-help-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="cases-help"
                className="app-screen__panel widget panel"
                aria-labelledby="cases-help-title"
            >
                <h2 id="cases-help-title" tabIndex={-1}>
                    {STR.help.casesTitle}
                </h2>
                <div className="app-screen__body cases-help-scroll-block">
                    <CasesHelpTables />
                </div>
                <div className="app-screen__footer actions">
                    <Button
                        variant="primary"
                        type="button"
                        id="btn-cases-help-close"
                        onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "casesHelp" })}
                    >
                        {STR.help.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
