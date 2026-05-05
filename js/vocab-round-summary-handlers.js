/**
 * Действия после раунда «Слова»: согласованы с {@link VocabRoundSummaryOverlay}.
 */
import { STR } from "./i18n/strings-ru.js"
import {
    postTrainerUiAction,
    closeVocabRoundSummaryOverlay,
    mutateEngine,
    clearWizardStatus,
    setWizardStatus,
} from "./trainer-ui-state.js"
import { getResolvedVocabDirections } from "./storage.js"
import { resetVocabCorrectStreak, showQuiz } from "./quiz.js"
import { clearVocabRound, initVocabRound } from "./vocab-round.js"
import { nextVocabTask } from "./word-selection.js"

function clearSetupStatusLines() {
    clearWizardStatus()
}

/** «Ок» / закрытие итога: мастер, сброс раунда. */
export function runVocabRoundSummaryOkFlow() {
    closeVocabRoundSummaryOverlay()
    clearVocabRound()
    postTrainerUiAction({ type: "SCREEN_SET", screen: "setup" })
    resetVocabCorrectStreak()
    postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 1 })
    clearSetupStatusLines()
    mutateEngine((e) => {
        e.currentTask = null
        e.shownLemmaHistory = []
    })
}

/** То же, что «Ок», для Escape и клика по подложке. */
export function dismissVocabRoundSummaryToSetup() {
    runVocabRoundSummaryOkFlow()
}

/** «Повторить» — новый раунд либо сообщение об ошибке. */
export function runVocabRoundSummaryRepeatFlow() {
    closeVocabRoundSummaryOverlay()
    mutateEngine((e) => {
        e.shownLemmaHistory = []
    })
    resetVocabCorrectStreak()
    if (!initVocabRound()) {
        clearVocabRound()
        postTrainerUiAction({ type: "SCREEN_SET", screen: "setup" })
        postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 })
        setWizardStatus("vocabDirection", STR.events.roundNoWords)
        return
    }
    const task = nextVocabTask()
    if (!task) {
        clearVocabRound()
        postTrainerUiAction({ type: "SCREEN_SET", screen: "setup" })
        postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 })
        setWizardStatus(
            "vocabDirection",
            getResolvedVocabDirections().hardcore
                ? STR.events.roundRepeatFail
                : STR.events.roundRepeatChoices
        )
        return
    }
    showQuiz(task)
}
