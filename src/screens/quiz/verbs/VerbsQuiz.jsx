import { useEffect } from "react"
import { useSelector } from "react-redux"

import { VERB_FORM_ORDER, VERB_MODE } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { excludeCurrentRoundWord, handleVerbFormSubmit } from "js/quiz.js"
import {
    LithuanianInput,
    VocabRoundDots,
    VocabRoundExcludeButton,
    VocabRoundProgress,
    VocabStreakMultiplier,
} from "src/screens/quiz/shared/index.js"
import { vocabRuAcceptedList } from "src/screens/quiz/vocab/vocabWords.js"

function VerbFormsPrompt({ answered, feedbackKind, onExclude, pulseId, roundDots, streak, task }) {
    const hiddenKey = task?.hiddenVerbFormKey
    const word = task?.word

    return (
        <div className="verb-forms-card" aria-label={STR.quiz.verbFormsAria}>
            <VocabRoundExcludeButton onClick={onExclude} />
            {VERB_FORM_ORDER.map((form) => {
                const hidden = form.key === hiddenKey
                const value = word?.forms?.[form.key] || STR.quiz.emDash
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
                            "verb-form-row",
                            hidden && "verb-form-row--hidden",
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
            <VocabStreakMultiplier streak={streak} pulseId={pulseId} />
            <VocabRoundDots dots={roundDots} />
        </div>
    )
}

function VerbConjugationPrompt({
    answered,
    feedbackKind,
    onExclude,
    pulseId,
    roundDots,
    streak,
    task,
}) {
    const expected = task?.expected || ""
    const verdictClass =
        answered && (feedbackKind === "ok" || feedbackKind === "bad")
            ? feedbackKind === "ok"
                ? "verb-conjugation-card--feedback-ok"
                : "verb-conjugation-card--feedback-bad"
            : ""
    const answerText =
        answered && expected
            ? expected
            : task?.word?.forms?.infinitive || task?.word?.lemma || STR.quiz.emDash
    const verdictEmoji =
        answered && (feedbackKind === "ok" || feedbackKind === "bad")
            ? feedbackKind === "ok"
                ? STR.quiz.correct
                : STR.quiz.wrong
            : ""
    return (
        <div
            className={["verb-forms-card", "verb-conjugation-card", verdictClass]
                .filter(Boolean)
                .join(" ")}
            aria-label={STR.quiz.verbConjugationAria}
        >
            <VocabRoundExcludeButton onClick={onExclude} />
            <div className="verb-conjugation-cue">
                <span className="verb-conjugation-cue__time" lang="lt">
                    {task?.timeCueLt || STR.quiz.emDash}
                </span>
                <span className="verb-conjugation-cue__pronoun" lang="lt">
                    {task?.pronounLt || STR.quiz.emDash}
                </span>
                <span className="verb-conjugation-cue__lemma" lang="lt">
                    {answerText}
                </span>
            </div>
            {verdictEmoji ? (
                <div className="verb-conjugation-verdict" aria-hidden="true">
                    {verdictEmoji}
                </div>
            ) : null}
            <VocabStreakMultiplier streak={streak} pulseId={pulseId} />
            <VocabRoundDots dots={roundDots} />
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
    const showTranslation = useSelector((s) => s.trainer.persisted.casesShowTranslation)
    const translation = showTranslation ? (vocabRuAcceptedList(task?.word)[0] ?? "") : ""
    const isConjugation = task?.verbMode === VERB_MODE.CONJUGATION

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
            <VocabRoundProgress progress={roundProgress} />
            <div className="verb-forms-block">
                <div className="verb-forms-block__main">
                    {isConjugation ? (
                        <VerbConjugationPrompt
                            answered={answered}
                            feedbackKind={feedbackKind}
                            onExclude={excludeCurrentRoundWord}
                            pulseId={pulseId}
                            roundDots={roundDots}
                            streak={streak}
                            task={task}
                        />
                    ) : (
                        <VerbFormsPrompt
                            answered={answered}
                            feedbackKind={feedbackKind}
                            onExclude={excludeCurrentRoundWord}
                            pulseId={pulseId}
                            roundDots={roundDots}
                            streak={streak}
                            task={task}
                        />
                    )}
                    {translation ? <p className="verb-translation-line">{translation}</p> : null}
                    {verdictAnnouncement ? (
                        <p className="sr-only" aria-live="polite">
                            {verdictAnnouncement}
                        </p>
                    ) : null}
                </div>
            </div>
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
