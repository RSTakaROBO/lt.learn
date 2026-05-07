import { useEffect, useRef, useState } from "react"

import { VERB_FORM_ORDER } from "../../../../js/config.js"
import { STR } from "../../../../js/i18n/strings-ru.js"
import { handleVerbFormSubmit } from "../../../../js/quiz.js"
import {
    LithuanianInput,
    VocabRoundDots,
    VocabRoundProgress,
    VocabStreakMultiplier,
} from "../shared/index.js"

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

export function VerbsQuiz({ isActive, pulseId, roundDots, roundProgress, streak, task }) {
    const inputRef = useRef(null)
    const [answerValue, setAnswerValue] = useState("")

    useEffect(() => {
        if (!isActive) return
        setAnswerValue("")
        requestAnimationFrame(() => inputRef.current?.focus())
    }, [isActive, task])

    return (
        <div id="quiz-verbs-ui" className={isActive ? "" : "hidden"}>
            <div className="vocab-ru-card verb-forms-card">
                <div className="vocab-ru-card-body">
                    <VerbFormsPrompt task={task} />
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
                    ref={inputRef}
                    inputId="verb-answer-input"
                    toolbarId="verb-lt-chars"
                    value={answerValue}
                    onValueChange={setAnswerValue}
                />
            </form>
        </div>
    )
}
