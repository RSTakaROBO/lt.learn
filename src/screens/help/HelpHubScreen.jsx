import { useRef } from "react"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"
import { useAutoFocusOnOpen } from "src/hooks/useAutoFocusOnOpen.js"
import { postTrainerUiAction } from "js/trainer-ui-state.js"
import { STR } from "js/i18n/strings-ru.js"

/**
 * Хаб «Справка»: переход к таблицам падежей / глаголам.
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function HelpHubScreen({ heightMode = "fill" } = {}) {
    const [state, dispatch] = useTrainerApp()
    const open = state.overlay.helpHub
    const closeButtonRef = useRef(null)

    useAutoFocusOnOpen(closeButtonRef, open)

    return (
        <AppFlowScreen
            id="help-hub-shell"
            heightMode={heightMode}
            className={["help-hub-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="help-hub"
                className="app-screen__panel widget panel help-hub-panel"
                aria-labelledby="help-hub-title"
            >
                <h2 id="help-hub-title" tabIndex={-1}>
                    {STR.helpHub.title}
                </h2>
                <div className="app-screen__body">
                    <div className="help-hub-actions">
                        <Button
                            type="button"
                            onClick={() =>
                                postTrainerUiAction({ type: "OVERLAY_OPEN", name: "casesHelp" })
                            }
                        >
                            {STR.helpHub.casesBtn}
                        </Button>
                        <Button
                            type="button"
                            onClick={() =>
                                postTrainerUiAction({
                                    type: "OVERLAY_OPEN",
                                    name: "verbFormsHelp",
                                })
                            }
                        >
                            Спряжения настоящего времени
                        </Button>
                        <Button
                            type="button"
                            onClick={() =>
                                postTrainerUiAction({
                                    type: "OVERLAY_OPEN",
                                    name: "verbTensesHelp",
                                })
                            }
                        >
                            Прошедшее и будущее время
                        </Button>
                    </div>
                </div>
                <div className="app-screen__footer actions app-screen__footer--single">
                    <Button
                        ref={closeButtonRef}
                        variant="primary"
                        type="button"
                        className="stats-close-btn"
                        onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "helpHub" })}
                    >
                        {STR.helpHub.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
