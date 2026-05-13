import { useEffect } from "react"
import { useSelector } from "react-redux"

import { TRAIN_MODE } from "js/config.js"
import { caseRu } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"
import { handleMorphCasesAnswerSubmit } from "js/quiz.js"
import {
    LithuanianInput,
    QuizFeedback,
    VocabRoundDots,
    VocabRoundProgress,
    VocabStreakMultiplier,
} from "src/screens/quiz/shared/index.js"
import { casesLemma, casesRuPrimary } from "src/screens/quiz/cases/casesWords.js"

function casesPromptForTask(task, casesShowTranslation) {
    if (!task?.word || task.mode === TRAIN_MODE.VOCAB || task.mode === TRAIN_MODE.VERBS) {
        return { lemma: "", targetCase: "" }
    }
    const nom = casesLemma(task.word)
    const ru = casesRuPrimary(task.word)
    const hint = casesShowTranslation === true && ru ? ` (${ru})` : ""
    return {
        lemma: `${nom}${hint}`,
        targetCase: task.targetCase ? caseRu(task.targetCase) : "",
    }
}

export function CasesQuiz({
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
    const casesShowTranslation = useSelector((s) => s.trainer.persisted.casesShowTranslation)
    const casesPrompt = casesPromptForTask(task, casesShowTranslation)
    const feedbackKind = feedback?.kind === "ok" || feedback?.kind === "bad" ? feedback.kind : ""

    useEffect(() => {
        if (!isActive) return
        /* На coarse + оверлей не автофокус — клавиатура по тапу в поле. Сброс текста — в QuizScreen. */
        if (lithuanianOverlayKeyboard) return
        requestAnimationFrame(() => inputRef.current?.focus())
    }, [lithuanianOverlayKeyboard, inputRef, isActive, task])

    return (
        <div id="quiz-cases-ui" className={isActive ? "" : "hidden"}>
            <div className="prompt">
                <div
                    className={["vocab-ru-card", feedbackKind && `vocab-ru-card--${feedbackKind}`]
                        .filter(Boolean)
                        .join(" ")}
                >
                    <p className="lemma vocab-ru-display" id="lemma-display">
                        {casesPrompt.lemma}
                    </p>
                    <p className="target-line">
                        <span className="target-prefix">{STR.quiz.targetCasePrefix}</span>
                        <span id="target-case-display">{casesPrompt.targetCase}</span>
                    </p>
                    <QuizFeedback
                        className="vocab-card-feedback cases-card-feedback"
                        feedback={feedback}
                        id="cases-card-feedback"
                        reserveSpace
                    />
                    <VocabStreakMultiplier streak={streak} pulseId={pulseId} />
                    <VocabRoundDots dots={roundDots} />
                </div>
            </div>
            <VocabRoundProgress progress={roundProgress} />
            <form
                id="answer-form"
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    handleMorphCasesAnswerSubmit(answerValue)
                }}
            >
                <LithuanianInput
                    ref={isActive ? inputRef : undefined}
                    inputId="answer-input"
                    toolbarId="lt-chars"
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
