import { useEffect } from "react"

import { VERB_FORM_ORDER } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { handleVerbFormSubmit } from "js/quiz.js"
import {
    LithuanianInput,
    VocabRoundDots,
    VocabRoundProgress,
    VocabStreakMultiplier,
} from "src/screens/quiz/shared/index.js"

function VerbFormsPrompt({ answered, feedbackKind, task }) {
    const hiddenKey = task?.hiddenVerbFormKey
    const word = task?.word

    return (
        <div className="verb-forms-grid" aria-label={STR.quiz.verbFormsAria}>
            {VERB_FORM_ORDER.map((form) => {
                const hidden = form.key === hiddenKey
                const value = word?.[form.key] || word?.forms?.[form.key] || STR.quiz.emDash
                const showPrompt = hidden && !answered
                const verdictClass =
                    answered && hidden && (feedbackKind === "ok" || feedbackKind === "bad")
                        ? feedbackKind === "ok"
                            ? "verb-form-card--feedback-ok"
                            : "verb-form-card--feedback-bad"
                        : ""
                const showVerdictEmoji =
                    answered && hidden && (feedbackKind === "ok" || feedbackKind === "bad")
                return (
                    <div
                        key={form.key}
                        className={[
                            "verb-form-card",
                            hidden && "verb-form-card--hidden",
                            verdictClass,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        <span className="verb-form-label">{form.label}</span>
                        <span className="verb-form-value" lang={showPrompt ? undefined : "lt"}>
                            {showPrompt ? (
                                STR.quiz.hiddenVerbForm
                            ) : (
                                <>
                                    <span className="verb-form-value-text">{value}</span>
                                    {showVerdictEmoji ? (
                                        <span
                                            className="verb-form-verdict-emoji"
                                            aria-hidden="true"
                                        >
                                            {feedbackKind === "ok"
                                                ? STR.quiz.correct
                                                : STR.quiz.wrong}
                                        </span>
                                    ) : null}
                                </>
                            )}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

export function VerbsQuiz({
    answered,
    answerValue,
    feedback,
    inputRef,
    isActive,
    lithuanianOverlayKeyboard = false,
    onAnswerValueChange,
    onRevealLithuanianKeyboard,
    pulseId,
    roundDots,
    roundProgress,
    streak,
    task,
}) {
    const feedbackKind = feedback?.kind === "ok" || feedback?.kind === "bad" ? feedback.kind : ""

    let verdictAnnouncement = ""
    if (answered && feedbackKind === "ok") verdictAnnouncement = STR.vocabRound.statCorrect
    if (
        answered &&
        feedbackKind === "bad" &&
        feedback?.expected != null &&
        feedback.expected !== ""
    )
        verdictAnnouncement = `${STR.vocabRound.statWrong}. ${STR.quiz.correctIs} ${feedback.expected}`

    useEffect(() => {
        if (!isActive) return
        if (lithuanianOverlayKeyboard) return
        requestAnimationFrame(() => inputRef?.current?.focus())
    }, [isActive, lithuanianOverlayKeyboard, inputRef, task])

    return (
        <div id="quiz-verbs-ui" className={isActive ? "" : "hidden"}>
            <div className="verb-forms-block">
                <div className="verb-forms-block__main">
                    <VerbFormsPrompt answered={answered} feedbackKind={feedbackKind} task={task} />
                    {verdictAnnouncement ? (
                        <p className="sr-only" aria-live="polite">
                            {verdictAnnouncement}
                        </p>
                    ) : null}
                </div>
                <VocabStreakMultiplier streak={streak} pulseId={pulseId} />
                <VocabRoundDots dots={roundDots} />
            </div>
            <VocabRoundProgress progress={roundProgress} />
            <form
                id="verb-answer-form"
                className="vocab-answer-form"
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    handleVerbFormSubmit(answerValue)
                }}
            >
                <LithuanianInput
                    ref={isActive ? inputRef : undefined}
                    inputId="verb-answer-input"
                    toolbarId="verb-lt-chars"
                    value={answerValue}
                    onValueChange={onAnswerValueChange}
                    useCustomKeyboard={lithuanianOverlayKeyboard}
                    onRevealCustomKeyboard={
                        lithuanianOverlayKeyboard ? onRevealLithuanianKeyboard : undefined
                    }
                />
            </form>
        </div>
    )
}
