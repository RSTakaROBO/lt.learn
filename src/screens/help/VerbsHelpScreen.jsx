import { useEffect } from "react"

import { VerbsHelpTables } from "./VerbsHelpTables.jsx"
import { STR } from "../../../js/i18n/strings-ru.js"
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx"
import { Button } from "../../components/ui/Button.jsx"
import { useTrainerApp } from "../../context/TrainerAppContext.jsx"

/**
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function VerbsHelpScreen({ heightMode = "fill" } = {}) {
    const [uiState, dispatch] = useTrainerApp()
    const open = uiState.overlay.verbsHelp

    useEffect(() => {
        if (!open) return
        const shell = document.getElementById("verbs-help-shell")
        const block = shell?.querySelector(".cases-help-scroll-block")
        if (block instanceof HTMLElement) block.scrollTop = 0
        if (shell) shell.scrollTop = 0
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        requestAnimationFrame(() => {
            document.getElementById("verbs-help-title")?.focus({ preventScroll: true })
        })
    }, [open])

    return (
        <AppFlowScreen
            id="verbs-help-shell"
            heightMode={heightMode}
            className={["verbs-help-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="verbs-help"
                className="app-screen__panel widget panel"
                aria-labelledby="verbs-help-title"
            >
                <h2 id="verbs-help-title" tabIndex={-1}>
                    Справка: <span lang="lt">yra</span> и <span lang="lt">nėra</span>
                </h2>
                <div className="app-screen__body cases-help-scroll-block">
                    <VerbsHelpTables />
                </div>
                <div className="app-screen__footer actions">
                    <Button
                        variant="primary"
                        type="button"
                        id="btn-verbs-help-close"
                        onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "verbsHelp" })}
                    >
                        {STR.help.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
