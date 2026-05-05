import {
    closeCasesHelpOverlay,
    closePackPromptOverlay,
    closeVerbsHelpOverlay,
    closeVocabRoundSummaryOverlay,
    isCasesHelpOpen,
    isVerbsHelpOpen,
    postTrainerUiAction,
    mutateEngine,
    clearWizardStatus,
} from "./trainer-ui-state.js"
import { clearVocabRound } from "./vocab-round.js"
import { resetVocabCorrectStreak } from "./quiz.js"

/** Кнопка «домой» в нижней панели: закрыть оверлеи и при необходимости выйти из квиза в мастер. */
export function handleQuizBarHomeClick() {
    postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "stats" })
    postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "settings" })
    closePackPromptOverlay()
    postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "helpHub" })
    closeVocabRoundSummaryOverlay()
    clearVocabRound()
    if (isCasesHelpOpen()) {
        closeCasesHelpOverlay()
        return
    }
    if (isVerbsHelpOpen()) {
        closeVerbsHelpOverlay()
        return
    }
    postTrainerUiAction({ type: "SCREEN_SET", screen: "setup" })
    resetVocabCorrectStreak()
    postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 1 })
    clearWizardStatus()
    mutateEngine((e) => {
        e.currentTask = null
        e.shownLemmaHistory = []
    })
}
