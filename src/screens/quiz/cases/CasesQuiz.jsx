import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { TRAIN_MODE } from "js/config.js"
import { caseRu } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"
import { handleMorphCasesAnswerSubmit } from "js/quiz.js"
import {
    LithuanianInput,
    AutoFitText,
    QuizFeedback,
    SwipeCardStack,
    VocabRoundDots,
    VocabRoundProgress,
    VocabStreakMultiplier,
} from "src/screens/quiz/shared/index.js"
import { casesLemma, casesRuPrimary } from "src/screens/quiz/cases/casesWords.js"
import { VocabWordInfoButton } from "src/screens/quiz/vocab/VocabWordInfoButton.jsx"
import { VocabWordInfoOverlay } from "src/screens/quiz/vocab/VocabWordInfoOverlay.jsx"

function casesPromptForTask(task, casesShowTranslation) {
    if (!task?.word || task.mode === TRAIN_MODE.VOCAB || task.mode === TRAIN_MODE.VERBS) {
        return { lemma: "", translation: "", targetCase: "" }
    }
    const nom = casesLemma(task.word)
    const ru = casesRuPrimary(task.word)
    return {
        lemma: nom,
        translation: casesShowTranslation === true ? ru : "",
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
    const [infoWord, setInfoWord] = useState(null)
    const casesShowTranslation = useSelector((s) => s.trainer.persisted.casesShowTranslation)
    const casesPrompt = casesPromptForTask(task, casesShowTranslation)
    const feedbackKind = feedback?.kind === "ok" || feedback?.kind === "bad" ? feedback.kind : ""
    const cardKey = [
        task?.word?.id || task?.word?.lemma || casesPrompt.lemma,
        task?.targetCase || "",
    ].join(":")

    useEffect(() => {
        if (!isActive) return
        /* На coarse + оверлей не автофокус — клавиатура по тапу в поле. Сброс текста — в QuizScreen. */
        if (lithuanianOverlayKeyboard) return
        requestAnimationFrame(() => inputRef.current?.focus())
    }, [lithuanianOverlayKeyboard, inputRef, isActive, task])

    return (
        <div id="quiz-cases-ui" className={isActive ? "" : "hidden"}>
            <VocabRoundProgress progress={roundProgress} />
            <div className="prompt">
                <SwipeCardStack cardKey={cardKey}>
                    <div
                        className={[
                            "vocab-ru-card",
                            feedbackKind && `vocab-ru-card--${feedbackKind}`,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        <div className="cases-lemma-block">
                            <AutoFitText
                                as="p"
                                className="lemma vocab-ru-display"
                                id="lemma-display"
                            >
                                {casesPrompt.lemma}
                            </AutoFitText>
                            {casesPrompt.translation ? (
                                <p className="cases-translation-line">{casesPrompt.translation}</p>
                            ) : null}
                        </div>
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
                        <VocabWordInfoButton onClick={() => setInfoWord(task?.word)} />
                    </div>
                </SwipeCardStack>
            </div>
            <VocabWordInfoOverlay
                open={!!infoWord}
                word={infoWord}
                onClose={() => setInfoWord(null)}
            />
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
