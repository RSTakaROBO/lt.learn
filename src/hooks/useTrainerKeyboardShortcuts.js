import { useEffect } from "react"

import { skipCurrentWord } from "js/quiz.js"
import {
    closePackPromptOverlay,
    getActiveTrainerScreen,
    getEngine,
    isCasesHelpOpen,
    isHelpHubOpen,
    isPackPromptOverlayOpen,
    isSettingsOverlayOpen,
    isStatsOverlayOpen,
    isVerbFormsHelpOpen,
    isVerbTensesHelpOpen,
    isVocabRoundSummaryOpen,
    isWordSearchOpen,
    postTrainerUiAction,
} from "js/trainer-ui-state.js"
import { useVocabRoundSummaryActions } from "src/hooks/useVocabRoundSummaryActions.js"

export function useTrainerKeyboardShortcuts() {
    const { dismissToSetup } = useVocabRoundSummaryActions()

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key !== "Escape") return
            if (isPackPromptOverlayOpen()) {
                e.preventDefault()
                closePackPromptOverlay()
                return
            }
            if (isVocabRoundSummaryOpen()) {
                e.preventDefault()
                dismissToSetup()
                return
            }
            if (isHelpHubOpen()) {
                e.preventDefault()
                postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "helpHub" })
                return
            }
            if (isSettingsOverlayOpen()) {
                e.preventDefault()
                postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "settings" })
                return
            }
            if (isStatsOverlayOpen()) {
                e.preventDefault()
                postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "stats" })
                return
            }
            if (isCasesHelpOpen() || isVerbFormsHelpOpen() || isVerbTensesHelpOpen()) {
                e.preventDefault()
                postTrainerUiAction({ type: "OVERLAY_OPEN", name: "helpHub" })
                return
            }
            if (isWordSearchOpen()) {
                e.preventDefault()
                postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "wordSearch" })
                return
            }
            if (!getEngine().currentTask || getActiveTrainerScreen() !== "quiz") {
                return
            }
            e.preventDefault()
            skipCurrentWord()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [dismissToSetup])
}
