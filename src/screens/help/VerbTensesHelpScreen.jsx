import { useRef } from "react"

import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"
import { useHelpScreenOpenEffect } from "src/hooks/useHelpScreenOpenEffect.js"
import { OtherVerbTensesReferenceTables } from "src/screens/help/VerbFormsHelpTables.jsx"

export function VerbTensesHelpScreen({ heightMode = "fill", dockedTenses, onPinTense } = {}) {
    const [uiState, dispatch] = useTrainerApp()
    const open = uiState.overlay.verbTensesHelp
    const shellRef = useRef(null)
    const titleRef = useRef(null)
    const scrollBlockRef = useRef(null)

    useHelpScreenOpenEffect({ open, shellRef, scrollBlockRef, titleRef })

    return (
        <AppFlowScreen
            ref={shellRef}
            id="verb-tenses-help-shell"
            heightMode={heightMode}
            className={["verb-tenses-help-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="verb-tenses-help"
                className="app-screen__panel widget panel"
                aria-labelledby="verb-tenses-help-title"
            >
                <h2 ref={titleRef} id="verb-tenses-help-title" tabIndex={-1}>
                    Прошедшее и будущее время
                </h2>
                <div
                    ref={scrollBlockRef}
                    className="app-screen__body cases-help-scroll-block u-scrollbar-hidden"
                >
                    <OtherVerbTensesReferenceTables
                        renderControls={(tenseId) => {
                            const side = dockedTenses?.left?.includes(tenseId)
                                ? "left"
                                : dockedTenses?.right?.includes(tenseId)
                                  ? "right"
                                  : null
                            return (
                                <div className="cases-help-pin-actions">
                                    <Button
                                        className={side === "left" ? "is-active" : undefined}
                                        onClick={() => onPinTense?.(tenseId, "left")}
                                    >
                                        {side === "left" ? STR.help.unpin : STR.help.pinLeft}
                                    </Button>
                                    <Button
                                        className={side === "right" ? "is-active" : undefined}
                                        onClick={() => onPinTense?.(tenseId, "right")}
                                    >
                                        {side === "right" ? STR.help.unpin : STR.help.pinRight}
                                    </Button>
                                </div>
                            )
                        }}
                    />
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
