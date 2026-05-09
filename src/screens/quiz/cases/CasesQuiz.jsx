import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"

import { TRAIN_MODE } from "../../../../js/config.js"
import { caseRu } from "../../../../js/i18n/core.js"
import { STR } from "../../../../js/i18n/strings-ru.js"
import { handleMorphCasesAnswerSubmit } from "../../../../js/quiz.js"
import { LithuanianInput, QuizFeedback } from "../shared/index.js"
import { casesLemma, casesRuPrimary } from "./casesWords.js"

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

export function CasesQuiz({ feedback, isActive, task }) {
    const inputRef = useRef(null)
    const [answerValue, setAnswerValue] = useState("")
    const casesShowTranslation = useSelector((s) => s.trainer.persisted.casesShowTranslation)
    const casesPrompt = casesPromptForTask(task, casesShowTranslation)
    const feedbackKind = feedback?.kind === "ok" || feedback?.kind === "bad" ? feedback.kind : ""

    useEffect(() => {
        if (!isActive) return
        setAnswerValue("")
        requestAnimationFrame(() => inputRef.current?.focus())
    }, [isActive, task])

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
                </div>
            </div>
            <form
                id="answer-form"
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    handleMorphCasesAnswerSubmit(answerValue)
                }}
            >
                <LithuanianInput
                    ref={inputRef}
                    inputId="answer-input"
                    toolbarId="lt-chars"
                    value={answerValue}
                    onValueChange={setAnswerValue}
                />
            </form>
        </div>
    )
}
