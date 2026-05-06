import { useCallback } from "react"

import { STR } from "../../js/i18n/strings-ru.js"
import { resetVocabCorrectStreak, showQuiz } from "../../js/quiz.js"
import { getResolvedVocabDirections } from "../../js/storage.js"
import { mutateEngine } from "../../js/trainer-ui-state.js"
import { clearVocabRound, initVocabRound } from "../../js/vocab-round.js"
import { nextVocabTask } from "../../js/word-selection.js"
import { useTrainerDispatch } from "../context/TrainerAppContext.jsx"

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

        if (!initVocabRound()) {
            goToSetup(3, STR.events.roundNoWords)
            return
        }

        const task = nextVocabTask()
        if (!task) {
            const directions = getResolvedVocabDirections()
            goToSetup(
                3,
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
