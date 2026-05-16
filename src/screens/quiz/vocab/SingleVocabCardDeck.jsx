import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

import { VOCAB_DIRECTION } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { handleVocabSingleSwipe } from "js/quiz.js"
import { vocabLemma, vocabRuPrimary } from "src/screens/quiz/vocab/vocabWords.js"

const EXIT_MS = 620

function vocabPromptForTask(task) {
    if (!task?.word) return { text: "", lang: undefined }
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        return { text: vocabLemma(task.word), lang: "lt" }
    }
    return { text: vocabRuPrimary(task.word), lang: "ru" }
}

function vocabExpectedForTask(task) {
    if (!task?.word) return ""
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    return dir === VOCAB_DIRECTION.LT_TO_RU ? vocabRuPrimary(task.word) : vocabLemma(task.word)
}

function taskKey(task) {
    return [
        task?.word?.id || task?.word?.lemma || task?.word?.nominative || "",
        task?.vocabDirection || "",
    ].join(":")
}

function makeCard(type, sourceTask, suffix) {
    return {
        id: `${taskKey(sourceTask)}:${type}:${suffix}`,
        isFresh: suffix > 0,
        task: sourceTask,
        type,
    }
}

function cardsForTaskPair(sourceTask, suffix) {
    if (!sourceTask?.word) return []
    return [makeCard("prompt", sourceTask, suffix), makeCard("answer", sourceTask, suffix)]
}

function initialDeck(task, nextTask) {
    if (!task?.word) return []
    return [...cardsForTaskPair(task, 0), ...cardsForTaskPair(nextTask, 0)]
}

function appendRequestedCards(rows, requestTask, seq) {
    if (rows.length >= 4) return rows
    const next = requestTask?.()
    if (!next?.word) return rows
    const alreadyQueued = rows.some((card) => taskKey(card.task) === taskKey(next))
    if (alreadyQueued) return rows
    return [...rows, ...cardsForTaskPair(next, seq)].slice(0, 4)
}

function PromptCard({ card }) {
    const prompt = vocabPromptForTask(card.task)
    return (
        <div className="vocab-ru-card vocab-ru-card--single">
            <div className="vocab-ru-card-body u-scrollbar-hidden">
                <p className="lemma vocab-ru-display" lang={prompt.lang}>
                    {prompt.text}
                </p>
            </div>
        </div>
    )
}

function AnswerCard({ card }) {
    return (
        <div className="vocab-ru-card vocab-single-answer" aria-live="polite">
            <span className="vocab-single-answer__label">{STR.quiz.vocabSingleAnswerLabel}</span>
            <span className="vocab-single-answer__value">{vocabExpectedForTask(card.task)}</span>
        </div>
    )
}

function DeckCard({ card }) {
    if (card.type === "answer") return <AnswerCard card={card} />
    return <PromptCard card={card} />
}

export function SingleVocabCardDeck({ nextTask, onRequestNextTask, state, task }) {
    const [dragX, setDragX] = useState(0)
    const [cards, setCards] = useState(() => initialDeck(task, nextTask))
    const [exit, setExit] = useState(null)
    const pointerRef = useRef(null)
    const seqRef = useRef(1)
    const timerRef = useRef(0)
    const taskIdRef = useRef(taskKey(task))

    useEffect(() => {
        const nextId = taskKey(task)
        if (taskIdRef.current === nextId) return
        taskIdRef.current = nextId
        setCards((prev) => {
            if (prev[0]?.task && taskKey(prev[0].task) === nextId) return prev
            return initialDeck(task, nextTask)
        })
        setDragX(0)
        setExit(null)
        pointerRef.current = null
        window.clearTimeout(timerRef.current)
    }, [nextTask, task])

    useEffect(
        () => () => {
            window.clearTimeout(timerRef.current)
        },
        []
    )

    const top = cards[0]
    const motionX = exit?.x || dragX
    const motionDir = motionX > 0 ? "right" : motionX < 0 ? "left" : ""
    const thresholdActive = Math.abs(motionX) >= 72

    function finishSwipe(dir, width) {
        if (!top || exit) return
        const x = dir === "right" ? width * 1.28 : -width * 1.28
        setExit({ dir, x })
        setDragX(0)
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            flushSync(() => {
                handleVocabSingleSwipe(dir)
                setCards((prev) => {
                    const shifted = prev.slice(1)
                    if (top.type !== "answer") return shifted
                    return appendRequestedCards(shifted, onRequestNextTask, seqRef.current++)
                })
                setExit(null)
                setDragX(0)
                pointerRef.current = null
            })
        }, EXIT_MS)
    }

    function handlePointerDown(e) {
        if (!top || exit || e.button !== 0) return
        pointerRef.current = {
            id: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            active: false,
        }
        e.currentTarget.setPointerCapture?.(e.pointerId)
    }

    function handlePointerMove(e) {
        const p = pointerRef.current
        if (!p || p.id !== e.pointerId || exit) return
        const dx = e.clientX - p.startX
        const dy = e.clientY - p.startY
        if (!p.active && Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (!p.active && Math.abs(dy) > Math.abs(dx) * 1.1) return
        p.active = true
        e.preventDefault()
        const width = e.currentTarget.getBoundingClientRect().width || window.innerWidth || 320
        const limit = Math.max(width * 1.15, window.innerWidth * 0.92)
        setDragX(Math.max(-limit, Math.min(limit, dx)))
    }

    function handlePointerUp(e) {
        const p = pointerRef.current
        if (!p || p.id !== e.pointerId) return
        const width = e.currentTarget.getBoundingClientRect().width || 1
        const dx = e.clientX - p.startX
        const threshold = Math.min(112, Math.max(64, width * 0.22))
        pointerRef.current = null
        setDragX(0)
        if (dx >= threshold) finishSwipe("right", Math.max(width, window.innerWidth || width))
        if (dx <= -threshold) finishSwipe("left", Math.max(width, window.innerWidth || width))
    }

    function handlePointerCancel(e) {
        const p = pointerRef.current
        if (!p || p.id !== e.pointerId) return
        pointerRef.current = null
        setDragX(0)
    }

    function handleKeyDown(e) {
        if (!top || exit) return
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            finishSwipe("left", window.innerWidth || 360)
        }
        if (e.key === "ArrowRight") {
            e.preventDefault()
            finishSwipe("right", window.innerWidth || 360)
        }
    }

    return (
        <div
            className="vocab-single-deck"
            role="group"
            aria-label={STR.quiz.vocabSingleCardAria}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onPointerCancel={handlePointerCancel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {cards
                .slice(0, 4)
                .slice(0)
                .reverse()
                .map((card) => {
                    const index = cards.findIndex((row) => row.id === card.id)
                    const isTop = index === 0
                    const style = isTop
                        ? {
                              transform: motionX
                                  ? `translate3d(${motionX}px, 0, 0) rotate(${Math.max(-12, Math.min(12, motionX / 18))}deg)`
                                  : undefined,
                          }
                        : undefined
                    return (
                        <div
                            key={card.id}
                            className={[
                                "vocab-single-deck-card",
                                `vocab-single-deck-card--${Math.min(index, 3)}`,
                                isTop && "vocab-single-deck-card--top",
                                card.isFresh && index > 0 && "vocab-single-deck-card--fresh",
                                isTop && dragX && "vocab-single-deck-card--dragging",
                                isTop && exit && "vocab-single-deck-card--exiting",
                                isTop &&
                                    thresholdActive &&
                                    `vocab-single-deck-card--swipe-${motionDir}`,
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            style={style}
                        >
                            <DeckCard card={card} />
                        </div>
                    )
                })}
        </div>
    )
}
