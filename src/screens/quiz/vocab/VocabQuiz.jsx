import { useEffect, useRef, useState } from "react"

import { VOCAB_DIRECTION } from "../../../../js/config.js"
import { STR } from "../../../../js/i18n/strings-ru.js"
import {
    handleQuizSkipButtonClick,
    handleVocabChoice,
    handleVocabHardcoreFormSubmit,
} from "../../../../js/quiz.js"
import { answersMatch } from "../../../../js/text-utils.js"
import {
    LithuanianInput,
    QuizActionButtons,
    VocabRoundDots,
    VocabRoundProgress,
    VocabStreakMultiplier,
} from "../shared/index.js"
import { vocabLemma, vocabRuPrimary, vocabRuUserMatches } from "./vocabWords.js"

function vocabPromptForTask(task) {
    if (!task?.word) return { text: "", lang: undefined }
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        return { text: vocabLemma(task.word), lang: "lt" }
    }
    return { text: vocabRuPrimary(task.word), lang: "ru" }
}

function vocabChoiceClass(lem, task, answered, choiceState) {
    const classes = ["btn", "vocab-choice"]
    if (!answered) classes.push("ghost")
    if (!answered || !task?.word) return classes.join(" ")

    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    const isCorrect =
        dir === VOCAB_DIRECTION.LT_TO_RU
            ? vocabRuUserMatches(task.word, lem)
            : answersMatch(lem, vocabLemma(task.word))
    const picked = choiceState?.pickedLemma === lem

    if (isCorrect) classes.push("vocab-choice--correct")
    if (!isCorrect && !picked) classes.push("ghost")
    if (picked) classes.push("vocab-choice--picked")
    if (picked && !isCorrect) classes.push("vocab-choice--wrong")
    return classes.join(" ")
}

function VocabChoices({ task, answered, choiceState }) {
    const choices = Array.isArray(task?.choices) ? task.choices : []
    const dir = task?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    const ariaLabel =
        dir === VOCAB_DIRECTION.LT_TO_RU ? STR.quiz.vocabLtToRuAria : STR.quiz.vocabRuToLtAria

    return (
        <div id="vocab-options" className="vocab-options" role="group" aria-label={ariaLabel}>
            {choices.map((lem) => {
                const correct =
                    answered && task?.word
                        ? dir === VOCAB_DIRECTION.LT_TO_RU
                            ? vocabRuUserMatches(task.word, lem)
                            : answersMatch(lem, vocabLemma(task.word))
                        : false
                return (
                    <button
                        key={lem}
                        type="button"
                        className={vocabChoiceClass(lem, task, answered, choiceState)}
                        data-lemma={lem}
                        disabled={answered && !correct}
                        aria-label={lem}
                        onClick={() => handleVocabChoice(lem)}
                    >
                        {lem}
                    </button>
                )
            })}
        </div>
    )
}

export function VocabQuiz({
    answered,
    choiceState,
    isActive,
    pulseId,
    roundDots,
    roundProgress,
    skipDisabled,
    skipLabel,
    streak,
    submitHidden,
    submitLabel,
    task,
}) {
    const inputRef = useRef(null)
    const [answerValue, setAnswerValue] = useState("")
    const isHardcore = !!task?.vocabHardcore
    const prompt = vocabPromptForTask(task)
    const showChoices = isActive && !isHardcore

    useEffect(() => {
        if (!isActive) return
        setAnswerValue("")
        if (isHardcore) {
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    }, [isActive, isHardcore, task])

    return (
        <div id="quiz-vocab-ui" className={isActive ? "" : "hidden"}>
            <div className="vocab-ru-card">
                <div className="vocab-ru-card-body">
                    <p className="lemma vocab-ru-display" id="vocab-ru-display" lang={prompt.lang}>
                        {prompt.text}
                    </p>
                </div>
                <VocabStreakMultiplier streak={streak} pulseId={pulseId} />
                <VocabRoundDots dots={roundDots} />
            </div>
            <VocabRoundProgress progress={roundProgress} />
            {showChoices && (
                <VocabChoices task={task} answered={answered} choiceState={choiceState} />
            )}
            <form
                id="vocab-answer-form"
                className={["vocab-answer-form", !isHardcore && "hidden"].filter(Boolean).join(" ")}
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    handleVocabHardcoreFormSubmit(answerValue)
                }}
            >
                <LithuanianInput
                    ref={inputRef}
                    inputId="vocab-answer-input"
                    toolbarId="vocab-lt-chars"
                    value={answerValue}
                    onValueChange={setAnswerValue}
                />
                {isHardcore && (
                    <div className="actions quiz-answer-actions quiz-footer-actions quiz-footer-actions--inline">
                        <QuizActionButtons
                            answered={answered}
                            isHardcore={isHardcore}
                            isVerbs={false}
                            isVocab={isActive}
                            onSkip={handleQuizSkipButtonClick}
                            skipDisabled={skipDisabled}
                            skipLabel={skipLabel}
                            submitHidden={submitHidden}
                            submitLabel={submitLabel}
                        />
                    </div>
                )}
            </form>
        </div>
    )
}
