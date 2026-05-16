import { useCallback } from "react"

import { STR } from "js/i18n/strings-ru.js"
import { TRAIN_MODE, VOCAB_MODE } from "js/config.js"
import { resetVocabCorrectStreak, showQuiz } from "js/quiz.js"
import { getResolvedVocabDirections, loadTrainMode } from "js/storage.js"
import { getCheckedCaseKeys, mutateEngine } from "js/trainer-ui-state.js"
import { clearVocabRound, initVocabRound } from "js/vocab-round.js"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { nextVocabTask } from "src/screens/quiz/vocab/vocabTask.js"
import { nextVerbTask } from "src/screens/quiz/verbs/verbsTask.js"
import { nextCasesTask } from "src/screens/quiz/cases/casesTask.js"

export function useVocabRoundSummaryActions() {
    const dispatch = useTrainerDispatch()

    const goToSetup = useCallback(
        (step, statusMessage, statusName = "vocabDirection") => {
            clearVocabRound()
            dispatch({ type: "SCREEN_SET", screen: "setup" })
            dispatch({ type: "WIZARD_SET_STEP", step })
            if (statusMessage) {
                dispatch({
                    type: "WIZARD_SET_STATUS",
                    name: statusName,
                    message: statusMessage,
                })
            } else {
                dispatch({ type: "WIZARD_CLEAR_STATUS" })
            }
        },
        [dispatch]
    )

    const closeToSetup = useCallback(() => {
        dispatch({ type: "OVERLAY_CLOSE", name: "vocabRound" })
        resetVocabCorrectStreak()
        goToSetup(1)
        mutateEngine((engine) => {
            engine.currentTask = null
            engine.shownLemmaHistory = []
        })
    }, [dispatch, goToSetup])

    const repeatRound = useCallback(() => {
        dispatch({ type: "OVERLAY_CLOSE", name: "vocabRound" })
        mutateEngine((engine) => {
            engine.shownLemmaHistory = []
        })
        resetVocabCorrectStreak()

        const trainMode = loadTrainMode() || TRAIN_MODE.VOCAB
        const fallbackStep = trainMode === TRAIN_MODE.VERBS ? 2 : 3
        if (!initVocabRound(trainMode)) {
            goToSetup(
                fallbackStep,
                STR.events.roundNoWords,
                trainMode === TRAIN_MODE.CASES ? "case" : "vocabDirection"
            )
            return
        }

        const task =
            trainMode === TRAIN_MODE.VERBS
                ? nextVerbTask()
                : trainMode === TRAIN_MODE.CASES
                  ? nextCasesTask(getCheckedCaseKeys())
                  : nextVocabTask()
        if (!task) {
            if (trainMode === TRAIN_MODE.VERBS) {
                goToSetup(fallbackStep, STR.events.verbsStartFail)
                return
            }
            if (trainMode === TRAIN_MODE.CASES) {
                goToSetup(fallbackStep, STR.events.noMatchingWords, "case")
                return
            }
            const directions = getResolvedVocabDirections()
            goToSetup(
                fallbackStep,
                directions.vocabMode === VOCAB_MODE.CHOICES
                    ? STR.events.roundRepeatChoices
                    : STR.events.roundRepeatFail
            )
            return
        }

        showQuiz(task)
    }, [dispatch, goToSetup])

    return {
        closeToSetup,
        dismissToSetup: closeToSetup,
        repeatRound,
    }
}
