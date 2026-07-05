import { useCallback } from "react"

import { STR } from "js/i18n/strings-ru.js"
import { TRAIN_MODE, VERB_MODE, VOCAB_MODE } from "js/config.js"
import { resetVocabCorrectStreak, showQuiz } from "js/quiz.js"
import { getResolvedVerbMode, getResolvedVocabDirections, loadTrainMode } from "js/storage.js"
import { getCheckedCaseKeys, mutateEngine } from "js/trainer-ui-state.js"
import { clearVocabRound, initVocabRound } from "js/vocab-round.js"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { nextVocabTask } from "src/screens/quiz/vocab/vocabTask.js"
import { nextSentenceTask } from "src/screens/quiz/sentences/sentenceTask.js"
import { nextVerbTask } from "src/screens/quiz/verbs/verbsTask.js"
import { nextCasesTask } from "src/screens/quiz/cases/casesTask.js"

function verbModeNoWordsMessage(verbMode) {
    if (verbMode === VERB_MODE.CARDS) return STR.events.verbCardsAfterPack
    if (verbMode === VERB_MODE.CONJUGATION) return STR.events.verbConjugationAfterPack
    return STR.events.verbsAfterPack
}

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
        const verbMode = trainMode === TRAIN_MODE.VERBS ? getResolvedVerbMode() : VERB_MODE.FORMS
        const fallbackStep = 3
        if (!initVocabRound(trainMode, { verbMode })) {
            const noWordsMessage =
                trainMode === TRAIN_MODE.VERBS
                    ? verbModeNoWordsMessage(verbMode)
                    : trainMode === TRAIN_MODE.SENTENCES
                      ? STR.events.sentencesStartFail
                      : STR.events.roundNoWords
            goToSetup(
                fallbackStep,
                noWordsMessage,
                trainMode === TRAIN_MODE.CASES
                    ? "case"
                    : trainMode === TRAIN_MODE.VERBS
                      ? "verbMode"
                      : trainMode === TRAIN_MODE.SENTENCES
                        ? "pack"
                        : "vocabDirection"
            )
            return
        }

        const task =
            trainMode === TRAIN_MODE.VERBS
                ? nextVerbTask({ verbMode })
                : trainMode === TRAIN_MODE.SENTENCES
                  ? nextSentenceTask()
                  : trainMode === TRAIN_MODE.CASES
                    ? nextCasesTask(getCheckedCaseKeys())
                    : nextVocabTask()
        if (!task) {
            if (trainMode === TRAIN_MODE.VERBS) {
                goToSetup(fallbackStep, STR.events.verbsStartFail, "verbMode")
                return
            }
            if (trainMode === TRAIN_MODE.SENTENCES) {
                goToSetup(2, STR.events.sentencesStartFail, "pack")
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
