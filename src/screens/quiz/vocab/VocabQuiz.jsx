import { useEffect, useRef, useState } from "react"

import { VOCAB_DIRECTION } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import {
    handleQuizSkipButtonClick,
    handleVocabChoice,
    handleVocabHardcoreFormSubmit,
} from "js/quiz.js"
import { answersMatch } from "js/text-utils.js"
import {
    LithuanianInput,
    QuizActionButtons,
    QuizFeedback,
    VocabRoundDots,
    VocabRoundProgress,
    VocabStreakMultiplier,
} from "src/screens/quiz/shared/index.js"
import {
    vocabLemma,
    vocabRuPrimary,
    vocabRuUserMatches,
} from "src/screens/quiz/vocab/vocabWords.js"

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

function VocabChoices({ task, answered, choiceState, showWrongTranslation }) {
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
                const pickedWrong =
                    answered && !correct && choiceState?.pickedLemma === lem && showWrongTranslation
                const reveal = pickedWrong ? task?.choiceReveals?.[lem] || "" : ""
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
                        <span className="vocab-choice-main">{lem}</span>
                        {reveal ? <span className="vocab-choice-reveal">{reveal}</span> : null}
                    </button>
                )
            })}
        </div>
    )
}

export function VocabQuiz({
    answered,
    choiceState,
    feedback,
    finishLabel,
    isActive,
    onFinish,
    pulseId,
    roundDots,
    roundProgress,
    skipDisabled,
    skipLabel,
    streak,
    submitHidden,
    submitLabel,
    showFinish,
    showWrongTranslation,
    task,
}) {
    const inputRef = useRef(null)
    const [answerValue, setAnswerValue] = useState("")
    const isHardcore = !!task?.vocabHardcore
    const prompt = vocabPromptForTask(task)
    const showChoices = isActive && !isHardcore
    const feedbackKind = feedback?.kind === "ok" || feedback?.kind === "bad" ? feedback.kind : ""

    useEffect(() => {
        if (!isActive) return
        setAnswerValue("")
        if (isHardcore) {
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    }, [isActive, isHardcore, task])

    return (
        <div id="quiz-vocab-ui" className={isActive ? "" : "hidden"}>
            <div
                className={["vocab-ru-card", feedbackKind && `vocab-ru-card--${feedbackKind}`]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className="vocab-ru-card-body u-scrollbar-hidden">
                    <p className="lemma vocab-ru-display" id="vocab-ru-display" lang={prompt.lang}>
                        {prompt.text}
                    </p>
                    <QuizFeedback
                        className="vocab-card-feedback"
                        feedback={feedback}
                        id="vocab-card-feedback"
                        reserveSpace={isHardcore}
                    />
                </div>
                <VocabStreakMultiplier streak={streak} pulseId={pulseId} />
                <VocabRoundDots dots={roundDots} />
            </div>
            <VocabRoundProgress progress={roundProgress} />
            {showChoices && (
                <VocabChoices
                    task={task}
                    answered={answered}
                    choiceState={choiceState}
                    showWrongTranslation={showWrongTranslation}
                />
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
                            finishLabel={finishLabel}
                            onFinish={onFinish}
                            onSkip={handleQuizSkipButtonClick}
                            showFinish={showFinish}
                            showSkip={false}
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
