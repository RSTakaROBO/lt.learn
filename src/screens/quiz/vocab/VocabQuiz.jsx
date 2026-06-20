import { useEffect } from "react"

import { VOCAB_DIRECTION, VOCAB_MODE } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import {
    handleQuizSkipButtonClick,
    handleVocabChoice,
    handleVocabHardcoreFormSubmit,
    requestVocabSingleNextTask,
} from "js/quiz.js"
import { answersMatch } from "js/text-utils.js"
import {
    LithuanianInput,
    AutoFitText,
    QuizActionButtons,
    QuizFeedback,
    SwipeCardStack,
    VocabRoundDots,
    VocabRoundProgress,
    VocabStreakMultiplier,
    VerbConjugationMark,
    StressedWord,
} from "src/screens/quiz/shared/index.js"
import {
    vocabLtDisplay,
    vocabLemma,
    vocabRuPrimary,
    vocabRuUserMatches,
} from "src/screens/quiz/vocab/vocabWords.js"
import { SingleVocabCardDeck } from "src/screens/quiz/vocab/SingleVocabCardDeck.jsx"

function vocabPromptForTask(task, showVerbForms) {
    if (!task?.word) return { text: "", lang: undefined }
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        return { text: vocabLtDisplay(task.word, showVerbForms), lang: "lt" }
    }
    return { text: vocabRuPrimary(task.word), lang: "ru" }
}

function hardcoreAnswerForTask(task, feedback, typedAnswer) {
    if (feedback?.kind !== "ok" && feedback?.kind !== "bad") return ""
    if (feedback.expected) return feedback.expected

    const dir = task?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    return dir === VOCAB_DIRECTION.LT_TO_RU
        ? String(typedAnswer || "").trim()
        : vocabLemma(task?.word)
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

function VocabChoices({ task, answered, choiceState, showVerbForms, showWrongTranslation }) {
    const choices = Array.isArray(task?.choices) ? task.choices : []
    const dir = task?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    const ariaLabel =
        dir === VOCAB_DIRECTION.LT_TO_RU ? STR.quiz.vocabLtToRuAria : STR.quiz.vocabRuToLtAria

    useEffect(() => {
        function handleChoiceShortcut(e) {
            if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return
            const choiceIndex = /^[1-4]$/.test(e.key) ? Number(e.key) - 1 : null
            const continueAfterCorrect = e.key === " " || e.key === "Spacebar"
            if (choiceIndex === null && !continueAfterCorrect) return

            const target = e.target
            if (
                target instanceof Element &&
                (target.matches("input, textarea, select") || target.closest("[contenteditable]"))
            ) {
                return
            }

            const options = document.getElementById("vocab-options")
            if (!options || options.closest(".hidden")) return

            const button = continueAfterCorrect
                ? options.querySelector(".vocab-choice--correct.vocab-choice--picked")
                : options.querySelectorAll(".vocab-choice")[choiceIndex]
            if (!(button instanceof HTMLButtonElement) || button.disabled) return

            e.preventDefault()
            button.click()
        }

        document.addEventListener("keydown", handleChoiceShortcut)
        return () => document.removeEventListener("keydown", handleChoiceShortcut)
    }, [])

    return (
        <div id="vocab-options" className="vocab-options" role="group" aria-label={ariaLabel}>
            {choices.map((lem, index) => {
                const correct =
                    answered && task?.word
                        ? dir === VOCAB_DIRECTION.LT_TO_RU
                            ? vocabRuUserMatches(task.word, lem)
                            : answersMatch(lem, vocabLemma(task.word))
                        : false
                const pickedWrong =
                    answered && !correct && choiceState?.pickedLemma === lem && showWrongTranslation
                const reveal =
                    pickedWrong && dir === VOCAB_DIRECTION.LT_TO_RU
                        ? vocabLtDisplay(task?.choiceWords?.[lem], showVerbForms) ||
                          task?.choiceReveals?.[lem] ||
                          ""
                        : pickedWrong
                          ? task?.choiceReveals?.[lem] || ""
                          : ""
                const choiceLabel =
                    dir === VOCAB_DIRECTION.RU_TO_LT
                        ? vocabLtDisplay(task?.choiceWords?.[lem], showVerbForms) || lem
                        : lem
                return (
                    <button
                        key={lem}
                        type="button"
                        className={vocabChoiceClass(lem, task, answered, choiceState)}
                        data-lemma={lem}
                        disabled={answered && !correct}
                        aria-label={choiceLabel}
                        aria-keyshortcuts={String(index + 1)}
                        onClick={() => handleVocabChoice(lem)}
                    >
                        <span className="vocab-choice-number" aria-hidden="true">
                            {index + 1}
                        </span>
                        <span className="vocab-choice-main">{choiceLabel}</span>
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
    lithuanianOverlayKeyboard = false,
    onRevealLithuanianKeyboard,
    onFinish,
    pulseId,
    roundDots,
    roundProgress,
    quizTypingAnswer,
    quizTypingInputRef,
    setQuizTypingAnswer,
    skipDisabled,
    skipLabel,
    streak,
    submitHidden,
    submitLabel,
    showFinish,
    showVerbForms,
    showWrongTranslation,
    task,
    vocabSingleNextTask,
    vocabSingleState,
}) {
    const isHardcore = !!task?.vocabHardcore
    const isSingle = task?.vocabMode === VOCAB_MODE.SINGLE
    const prompt = vocabPromptForTask(task, showVerbForms)
    const showChoices = isActive && !isHardcore && !isSingle
    const feedbackKind = feedback?.kind === "ok" || feedback?.kind === "bad" ? feedback.kind : ""
    const hardcoreAnswer = isHardcore ? hardcoreAnswerForTask(task, feedback, quizTypingAnswer) : ""
    const cardKey = [
        task?.word?.id || task?.word?.lemma || task?.word?.nominative || prompt.text,
        task?.vocabDirection || "",
        task?.vocabMode || (isHardcore ? "hardcore" : "choices"),
    ].join(":")

    useEffect(() => {
        if (!isActive || !isHardcore) return
        if (lithuanianOverlayKeyboard) return
        requestAnimationFrame(() => quizTypingInputRef?.current?.focus())
    }, [isActive, isHardcore, lithuanianOverlayKeyboard, quizTypingInputRef, task])

    return (
        <div id="quiz-vocab-ui" className={isActive ? "" : "hidden"}>
            <VocabRoundProgress progress={roundProgress} />
            {isSingle ? (
                <SingleVocabCardDeck
                    nextTask={vocabSingleNextTask}
                    onRequestNextTask={requestVocabSingleNextTask}
                    roundDots={roundDots}
                    showVerbForms={showVerbForms}
                    state={vocabSingleState}
                    task={task}
                />
            ) : (
                <SwipeCardStack cardKey={cardKey}>
                    <div
                        className={[
                            "vocab-ru-card",
                            feedbackKind && `vocab-ru-card--${feedbackKind}`,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        <VerbConjugationMark word={task?.word} />
                        <div className="vocab-ru-card-body u-scrollbar-hidden">
                            <AutoFitText
                                as="p"
                                className={[
                                    "lemma vocab-ru-display",
                                    prompt.text.includes("\n") && "vocab-ru-display--stacked",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                id="vocab-ru-display"
                                lang={prompt.lang}
                            >
                                {prompt.lang === "lt" ? (
                                    <StressedWord stress={task?.word?.stress} text={prompt.text} />
                                ) : (
                                    prompt.text
                                )}
                            </AutoFitText>
                            <QuizFeedback
                                className="vocab-card-feedback"
                                feedback={isSingle ? null : feedback}
                                id="vocab-card-feedback"
                                reserveSpace={isHardcore}
                            />
                            {isHardcore ? (
                                <p
                                    className={[
                                        "vocab-hardcore-answer",
                                        !hardcoreAnswer && "vocab-hardcore-answer--placeholder",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    aria-hidden="true"
                                >
                                    <span>{STR.quiz.correctIs}</span>
                                    <strong>{hardcoreAnswer || "\u00a0"}</strong>
                                </p>
                            ) : null}
                        </div>
                        <VocabStreakMultiplier streak={streak} pulseId={pulseId} />
                        <VocabRoundDots dots={roundDots} />
                    </div>
                </SwipeCardStack>
            )}
            {showChoices && (
                <VocabChoices
                    task={task}
                    answered={answered}
                    choiceState={choiceState}
                    showVerbForms={showVerbForms}
                    showWrongTranslation={showWrongTranslation}
                />
            )}
            <form
                id="vocab-answer-form"
                className={["vocab-answer-form", !isHardcore && "hidden"].filter(Boolean).join(" ")}
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    handleVocabHardcoreFormSubmit(quizTypingAnswer)
                }}
            >
                <LithuanianInput
                    ref={isActive && isHardcore ? quizTypingInputRef : undefined}
                    inputId="vocab-answer-input"
                    toolbarId="vocab-lt-chars"
                    value={quizTypingAnswer}
                    onValueChange={setQuizTypingAnswer}
                    useCustomKeyboard={lithuanianOverlayKeyboard}
                    onRevealCustomKeyboard={
                        lithuanianOverlayKeyboard ? onRevealLithuanianKeyboard : undefined
                    }
                />
                {isHardcore && (
                    <div
                        className="actions quiz-answer-actions quiz-footer-actions quiz-footer-actions--inline"
                        id="quiz-footer-actions"
                    >
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
