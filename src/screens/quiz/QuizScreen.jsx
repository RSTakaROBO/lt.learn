import { useEffect, useRef, useState } from "react"
import { shallowEqual, useSelector } from "react-redux"

import { TRAIN_MODE, VERB_FORM_ORDER, VOCAB_DIRECTION } from "../../../js/config.js"
import { caseRu, fmt } from "../../../js/i18n/core.js"
import { STR } from "../../../js/i18n/strings-ru.js"
import { VOCAB_ROUND_STREAK_TO_REMOVE } from "../../../js/vocab-round.js"
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx"
import { ChartsToolbar } from "../../components/ui/ChartsToolbar.jsx"
import { Button } from "../../components/ui/Button.jsx"
import {
    handleMorphCasesAnswerSubmit,
    handleQuizSkipButtonClick,
    handleVerbFormSubmit,
    handleVocabChoice,
    handleVocabHardcoreFormSubmit,
} from "../../../js/quiz.js"
import { getLithuanianShiftCycleEdit } from "../../../js/InputHelper.js"
import { answersMatch } from "../../../js/text-utils.js"
import { wordLemma } from "../../../js/word-entry.js"
import { vocabRuUserMatches, wordRuPrimary } from "../../../js/wordTranslations.js"

const VOCAB_STREAK_MULT_FROM = 5

function vocabStreakTierClass(n) {
    if (n >= 100) return "vocab-streak-mult--t5"
    if (n >= 70) return "vocab-streak-mult--t4"
    if (n >= 50) return "vocab-streak-mult--t3"
    if (n >= 20) return "vocab-streak-mult--t2"
    if (n >= 10) return "vocab-streak-mult--t1"
    return "vocab-streak-mult--t0"
}

function setCaretOnNextFrame(input, caret) {
    requestAnimationFrame(() => {
        input.focus()
        input.setSelectionRange(caret, caret)
    })
}

function insertTextAtInput(input, value, setValue, text) {
    if (!(input instanceof HTMLInputElement)) return
    const start = input.selectionStart ?? value.length
    const end = input.selectionEnd ?? value.length
    const next = value.slice(0, start) + text + value.slice(end)
    const caret = start + text.length
    setValue(next)
    setCaretOnNextFrame(input, caret)
}

function handleToolbarClick(e, value, setValue, inputRef) {
    const target = e.target
    const btn = target instanceof Element ? target.closest(".lt-char") : null
    const ch = btn?.getAttribute("data-char")
    if (!ch) return
    insertTextAtInput(inputRef.current, value, setValue, ch)
}

function handleLithuanianShiftKey(e, value, setValue, inputRef) {
    if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return
    const input = inputRef.current
    if (!(input instanceof HTMLInputElement)) return
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const edit = getLithuanianShiftCycleEdit(value, start, end, e.key)
    if (!edit) return
    e.preventDefault()
    setValue(edit.value)
    setCaretOnNextFrame(input, edit.caret)
}

function vocabPromptForTask(task) {
    if (!task?.word) return { text: "", lang: undefined }
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        return { text: wordLemma(task.word), lang: "lt" }
    }
    return { text: wordRuPrimary(task.word), lang: "ru" }
}

function casesPromptForTask(task, casesShowTranslation) {
    if (!task?.word || task.mode === TRAIN_MODE.VOCAB || task.mode === TRAIN_MODE.VERBS) {
        return { lemma: "", targetCase: "" }
    }
    const nom = wordLemma(task.word)
    const hint =
        casesShowTranslation === true && wordRuPrimary(task.word)
            ? ` (${wordRuPrimary(task.word)})`
            : ""
    return {
        lemma: `${nom}${hint}`,
        targetCase: task.targetCase ? caseRu(task.targetCase) : "",
    }
}

function vocabChoiceClass(lem, task, answered, choiceState) {
    const classes = ["btn", "vocab-choice"]
    if (!answered) classes.push("ghost")
    if (!answered || !task?.word) return classes.join(" ")

    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    const isCorrect =
        dir === VOCAB_DIRECTION.LT_TO_RU
            ? vocabRuUserMatches(task.word, lem)
            : answersMatch(lem, wordLemma(task.word))
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
                            : answersMatch(lem, wordLemma(task.word))
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

function VerbFormsPrompt({ task }) {
    const hiddenKey = task?.hiddenVerbFormKey
    const word = task?.word

    return (
        <div className="verb-forms-grid" aria-label={STR.quiz.verbFormsAria}>
            {VERB_FORM_ORDER.map((form) => {
                const hidden = form.key === hiddenKey
                const value = word?.[form.key] || word?.forms?.[form.key] || STR.quiz.emDash
                return (
                    <div
                        key={form.key}
                        className={["verb-form-card", hidden && "verb-form-card--hidden"]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        <span className="verb-form-label">{form.label}</span>
                        <span className="verb-form-value" lang="lt">
                            {hidden ? STR.quiz.hiddenVerbForm : value}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function QuizActionButtons({
    answered,
    isHardcore,
    isVerbs,
    isVocab,
    skipDisabled,
    skipLabel,
    submitHidden,
    submitLabel,
}) {
    const submitFormId = isVerbs ? "verb-answer-form" : "answer-form"
    return (
        <>
            <Button
                variant={
                    (isVocab && answered && !isHardcore) || (isVerbs && answered)
                        ? "primary"
                        : "ghost"
                }
                type="button"
                id="btn-skip"
                disabled={skipDisabled}
                onClick={handleQuizSkipButtonClick}
            >
                {skipLabel}
            </Button>
            <Button
                variant="primary"
                type="submit"
                form={isHardcore ? undefined : submitFormId}
                id="btn-quiz-submit-cases"
                className={submitHidden ? "hidden" : ""}
                hidden={submitHidden}
            >
                {submitLabel}
            </Button>
        </>
    )
}

function QuizFeedback({ feedback }) {
    if (!feedback) {
        return <div id="feedback" className="feedback hidden" aria-live="polite" />
    }

    return (
        <div
            id="feedback"
            className={["feedback", feedback.kind === "info" ? "" : feedback.kind]
                .filter(Boolean)
                .join(" ")}
            aria-live="polite"
        >
            <p>{feedback.message}</p>
            {feedback.expected ? (
                <p className="correct-form">
                    {STR.quiz.correctIs} <strong>{feedback.expected}</strong>
                </p>
            ) : null}
            {feedback.exceptionNote ? (
                <p className="exception-hint">
                    <strong>{STR.quiz.exceptionStrong}</strong> {feedback.exceptionNote}
                </p>
            ) : null}
        </div>
    )
}

function VocabRoundDots({ dots }) {
    if (!dots) {
        return (
            <div
                id="vocab-round-lemma-dots"
                className="vocab-round-lemma-dots hidden"
                aria-hidden="true"
                role="img"
            >
                <span className="vocab-round-lemma-dot" aria-hidden="true" />
                <span className="vocab-round-lemma-dot" aria-hidden="true" />
                <span className="vocab-round-lemma-dot" aria-hidden="true" />
            </div>
        )
    }

    return (
        <div
            id="vocab-round-lemma-dots"
            className="vocab-round-lemma-dots"
            aria-hidden="false"
            aria-label={fmt(STR.vocabRound.ariaDots, {
                filled: dots.filled,
                max: VOCAB_ROUND_STREAK_TO_REMOVE,
            })}
            role="img"
        >
            {Array.from({ length: VOCAB_ROUND_STREAK_TO_REMOVE }, (_, i) => (
                <span
                    key={i}
                    className={["vocab-round-lemma-dot", i < dots.filled && "is-filled"]
                        .filter(Boolean)
                        .join(" ")}
                    aria-hidden="true"
                />
            ))}
        </div>
    )
}

function VocabRoundProgress({ progress }) {
    if (!progress || progress.total <= 0) {
        return (
            <div
                id="vocab-round-progress"
                className="vocab-round-progress hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-hidden="true"
            >
                <div className="vocab-round-progress-track" aria-hidden="true">
                    <div id="vocab-round-progress-fill" className="vocab-round-progress-fill" />
                </div>
            </div>
        )
    }

    return (
        <div
            id="vocab-round-progress"
            className="vocab-round-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuenow={progress.done}
            aria-valuemax={progress.total}
            aria-hidden="false"
            aria-label={fmt(STR.vocabRound.ariaProgress, {
                done: progress.done,
                total: progress.total,
            })}
        >
            <div className="vocab-round-progress-track" aria-hidden="true">
                <div
                    id="vocab-round-progress-fill"
                    className="vocab-round-progress-fill"
                    style={{ width: `${progress.pct}%` }}
                />
            </div>
        </div>
    )
}

function VocabStreakMultiplier({ streak, pulseId }) {
    if (streak < VOCAB_STREAK_MULT_FROM) {
        return (
            <div id="vocab-streak-mult" className="vocab-streak-mult hidden" aria-hidden="true">
                <span id="vocab-streak-mult-value" className="vocab-streak-mult-value" />
            </div>
        )
    }

    return (
        <div
            id="vocab-streak-mult"
            className={[
                "vocab-streak-mult",
                vocabStreakTierClass(streak),
                pulseId > 0 && "vocab-streak-mult--pulse",
            ]
                .filter(Boolean)
                .join(" ")}
            aria-hidden="false"
        >
            <span key={pulseId} id="vocab-streak-mult-value" className="vocab-streak-mult-value">
                ×{streak}
            </span>
        </div>
    )
}

/**
 * Экран тренажёра: падежи и словарь.
 * @param {{ heightMode?: "fill"|"scroll"; hidden?: boolean }} [props]
 */
export function QuizScreen({ heightMode = "fill", hidden = false } = {}) {
    const answerInputRef = useRef(null)
    const vocabAnswerInputRef = useRef(null)
    const verbAnswerInputRef = useRef(null)
    const [answerValue, setAnswerValue] = useState("")
    const [vocabAnswerValue, setVocabAnswerValue] = useState("")
    const [verbAnswerValue, setVerbAnswerValue] = useState("")
    const {
        task,
        answered,
        choiceState,
        feedback,
        roundDots,
        roundProgress,
        vocabStreak,
        vocabStreakPulseId,
    } = useSelector(
        (s) => ({
            task: s.trainer.engine.currentTask,
            answered: s.trainer.engine.answered,
            choiceState: s.trainer.engine.vocabChoice,
            feedback: s.trainer.quizFeedback,
            roundDots: s.trainer.engine.vocabRoundDots,
            vocabStreak: s.trainer.engine.vocabCorrectStreak,
            vocabStreakPulseId: s.trainer.engine.vocabStreakPulseId,
            roundProgress: s.trainer.engine.vocabRound
                ? {
                      done:
                          s.trainer.engine.vocabRound.initialSize -
                          s.trainer.engine.vocabRound.pool.size,
                      total: s.trainer.engine.vocabRound.initialSize,
                      pct:
                          s.trainer.engine.vocabRound.initialSize > 0
                              ? Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        (100 *
                                            (s.trainer.engine.vocabRound.initialSize -
                                                s.trainer.engine.vocabRound.pool.size)) /
                                            s.trainer.engine.vocabRound.initialSize
                                    )
                                )
                              : 0,
                  }
                : null,
        }),
        shallowEqual
    )
    const casesShowTranslation = useSelector((s) => s.trainer.persisted.casesShowTranslation)
    const isVocab = task?.mode === TRAIN_MODE.VOCAB
    const isVerbs = task?.mode === TRAIN_MODE.VERBS
    const isHardcore = !!task?.vocabHardcore
    const vocabPrompt = vocabPromptForTask(task)
    const casesPrompt = casesPromptForTask(task, casesShowTranslation)
    const showChoices = isVocab && !isHardcore
    const submitHidden = isVocab && !isHardcore
    const footerSingle = showChoices
    const skipLabel =
        (isVocab && answered && !isHardcore) || (isVerbs && answered)
            ? STR.quiz.next
            : STR.quiz.skip
    const skipDisabled = !task || (answered && !(isVocab && !isHardcore) && !isVerbs)
    const submitLabel = answered ? STR.quiz.next : STR.quiz.check
    const quizModeClass = isVerbs
        ? "quiz--verbs"
        : isVocab
          ? isHardcore
              ? "quiz--vocab quiz--vocab-hardcore"
              : "quiz--vocab"
          : "quiz--cases"

    useEffect(() => {
        if (!task) {
            setAnswerValue("")
            setVocabAnswerValue("")
            setVerbAnswerValue("")
            return
        }
        if (isVerbs) {
            setVerbAnswerValue("")
            requestAnimationFrame(() => verbAnswerInputRef.current?.focus())
            return
        }
        if (isVocab) {
            setVocabAnswerValue("")
            if (isHardcore) {
                requestAnimationFrame(() => vocabAnswerInputRef.current?.focus())
            }
            return
        }
        setAnswerValue("")
        requestAnimationFrame(() => answerInputRef.current?.focus())
    }, [task, isVocab, isVerbs, isHardcore])

    return (
        <AppFlowScreen
            id="quiz-shell"
            heightMode={heightMode}
            className={["quiz-shell", hidden && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="quiz"
                className={["widget panel app-screen__panel", quizModeClass]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className="app-screen__body quiz-screen-body">
                    <div id="quiz-cases-ui" className={isVocab || isVerbs ? "hidden" : ""}>
                        <div className="prompt">
                            <div className="vocab-ru-card">
                                <p className="lemma vocab-ru-display" id="lemma-display">
                                    {casesPrompt.lemma}
                                </p>
                            </div>
                            <p className="target-line">
                                <span className="target-prefix">{STR.quiz.targetCasePrefix}</span>
                                <span id="target-case-display">{casesPrompt.targetCase}</span>
                            </p>
                        </div>
                        <form
                            id="answer-form"
                            autoComplete="off"
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleMorphCasesAnswerSubmit(answerValue)
                            }}
                        >
                            <label className="sr-only" htmlFor="answer-input">
                                {STR.quiz.answerLabel}
                            </label>
                            <input
                                ref={answerInputRef}
                                type="text"
                                id="answer-input"
                                value={answerValue}
                                placeholder={STR.quiz.answerPlaceholder}
                                spellCheck={false}
                                autoCapitalize="off"
                                onChange={(e) => setAnswerValue(e.target.value)}
                                onKeyDown={(e) =>
                                    handleLithuanianShiftKey(
                                        e,
                                        answerValue,
                                        setAnswerValue,
                                        answerInputRef
                                    )
                                }
                            />
                            <ChartsToolbar
                                id="lt-chars"
                                onClick={(e) =>
                                    handleToolbarClick(
                                        e,
                                        answerValue,
                                        setAnswerValue,
                                        answerInputRef
                                    )
                                }
                            />
                        </form>
                    </div>

                    <div id="quiz-vocab-ui" className={isVocab ? "" : "hidden"}>
                        <div className="vocab-ru-card">
                            <div className="vocab-ru-card-body">
                                <p
                                    className="lemma vocab-ru-display"
                                    id="vocab-ru-display"
                                    lang={vocabPrompt.lang}
                                >
                                    {vocabPrompt.text}
                                </p>
                            </div>
                            <VocabStreakMultiplier
                                streak={vocabStreak}
                                pulseId={vocabStreakPulseId}
                            />
                            <VocabRoundDots dots={roundDots} />
                        </div>
                        <VocabRoundProgress progress={roundProgress} />
                        {showChoices && (
                            <VocabChoices
                                task={task}
                                answered={answered}
                                choiceState={choiceState}
                            />
                        )}
                        <form
                            id="vocab-answer-form"
                            className={["vocab-answer-form", !isHardcore && "hidden"]
                                .filter(Boolean)
                                .join(" ")}
                            autoComplete="off"
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleVocabHardcoreFormSubmit(vocabAnswerValue)
                            }}
                        >
                            <label className="sr-only" htmlFor="vocab-answer-input">
                                {STR.quiz.answerLabel}
                            </label>
                            <input
                                ref={vocabAnswerInputRef}
                                type="text"
                                id="vocab-answer-input"
                                value={vocabAnswerValue}
                                placeholder={STR.quiz.answerPlaceholder}
                                spellCheck={false}
                                autoCapitalize="off"
                                onChange={(e) => setVocabAnswerValue(e.target.value)}
                                onKeyDown={(e) =>
                                    handleLithuanianShiftKey(
                                        e,
                                        vocabAnswerValue,
                                        setVocabAnswerValue,
                                        vocabAnswerInputRef
                                    )
                                }
                            />
                            <ChartsToolbar
                                id="vocab-lt-chars"
                                onClick={(e) =>
                                    handleToolbarClick(
                                        e,
                                        vocabAnswerValue,
                                        setVocabAnswerValue,
                                        vocabAnswerInputRef
                                    )
                                }
                            />
                            {isHardcore && (
                                <div className="actions quiz-answer-actions quiz-footer-actions quiz-footer-actions--inline">
                                    <QuizActionButtons
                                        answered={answered}
                                        isHardcore={isHardcore}
                                        isVerbs={isVerbs}
                                        isVocab={isVocab}
                                        skipDisabled={skipDisabled}
                                        skipLabel={skipLabel}
                                        submitHidden={submitHidden}
                                        submitLabel={submitLabel}
                                    />
                                </div>
                            )}
                        </form>
                    </div>

                    <div id="quiz-verbs-ui" className={isVerbs ? "" : "hidden"}>
                        <div className="vocab-ru-card verb-forms-card">
                            <div className="vocab-ru-card-body">
                                <VerbFormsPrompt task={task} />
                            </div>
                            <VocabStreakMultiplier
                                streak={vocabStreak}
                                pulseId={vocabStreakPulseId}
                            />
                            <VocabRoundDots dots={roundDots} />
                        </div>
                        <VocabRoundProgress progress={roundProgress} />
                        <form
                            id="verb-answer-form"
                            className="vocab-answer-form"
                            autoComplete="off"
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleVerbFormSubmit(verbAnswerValue)
                            }}
                        >
                            <label className="sr-only" htmlFor="verb-answer-input">
                                {STR.quiz.answerLabel}
                            </label>
                            <input
                                ref={verbAnswerInputRef}
                                type="text"
                                id="verb-answer-input"
                                value={verbAnswerValue}
                                placeholder={STR.quiz.answerPlaceholder}
                                spellCheck={false}
                                autoCapitalize="off"
                                onChange={(e) => setVerbAnswerValue(e.target.value)}
                                onKeyDown={(e) =>
                                    handleLithuanianShiftKey(
                                        e,
                                        verbAnswerValue,
                                        setVerbAnswerValue,
                                        verbAnswerInputRef
                                    )
                                }
                            />
                            <ChartsToolbar
                                id="verb-lt-chars"
                                onClick={(e) =>
                                    handleToolbarClick(
                                        e,
                                        verbAnswerValue,
                                        setVerbAnswerValue,
                                        verbAnswerInputRef
                                    )
                                }
                            />
                        </form>
                    </div>

                    <QuizFeedback feedback={feedback} />
                </div>

                {!isHardcore && (
                    <div
                        className={[
                            "app-screen__footer actions quiz-answer-actions quiz-footer-actions",
                            footerSingle && "quiz-footer--single",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        id="quiz-footer-actions"
                    >
                        <QuizActionButtons
                            answered={answered}
                            isHardcore={isHardcore}
                            isVerbs={isVerbs}
                            isVocab={isVocab}
                            skipDisabled={skipDisabled}
                            skipLabel={skipLabel}
                            submitHidden={submitHidden}
                            submitLabel={submitLabel}
                        />
                    </div>
                )}
            </section>
        </AppFlowScreen>
    )
}
