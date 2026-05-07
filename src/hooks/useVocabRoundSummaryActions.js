import { useCallback } from "react"

import { STR } from "../../js/i18n/strings-ru.js"
import { TRAIN_MODE } from "../../js/config.js"
import { resetVocabCorrectStreak, showQuiz } from "../../js/quiz.js"
import { getResolvedVocabDirections, loadTrainMode } from "../../js/storage.js"
import { mutateEngine } from "../../js/trainer-ui-state.js"
import { clearVocabRound, initVocabRound } from "../../js/vocab-round.js"
import { useTrainerDispatch } from "../context/TrainerAppContext.jsx"
import { nextVocabTask } from "../screens/quiz/vocab/vocabTask.js"
import { nextVerbTask } from "../screens/quiz/verbs/verbsTask.js"

export function useVocabRoundSummaryActions() {
    const dispatch = useTrainerDispatch()

    const goToSetup = useCallback(
        (step, statusMessage) => {
            clearVocabRound()
            dispatch({ type: "SCREEN_SET", screen: "setup" })
            dispatch({ type: "WIZARD_SET_STEP", step })
            if (statusMessage) {
                dispatch({
                    type: "WIZARD_SET_STATUS",
                    name: "vocabDirection",
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
            goToSetup(fallbackStep, STR.events.roundNoWords)
            return
        }

        const task = trainMode === TRAIN_MODE.VERBS ? nextVerbTask() : nextVocabTask()
        if (!task) {
            if (trainMode === TRAIN_MODE.VERBS) {
                goToSetup(fallbackStep, STR.events.verbsStartFail)
                return
            }
            const directions = getResolvedVocabDirections()
            goToSetup(
                fallbackStep,
                directions.hardcore ? STR.events.roundRepeatFail : STR.events.roundRepeatChoices
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
