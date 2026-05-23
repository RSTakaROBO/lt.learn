import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

import { VOCAB_DIRECTION } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { handleVocabSingleSwipe, requestVocabSingleFutureTask } from "js/quiz.js"
import { AutoFitText } from "src/screens/quiz/shared/AutoFitText.jsx"
import { VerbConjugationMark } from "src/screens/quiz/shared/VerbConjugationMark.jsx"
import { VocabRoundDots } from "src/screens/quiz/shared/VocabRoundDots.jsx"
import { vocabLtDisplay, vocabRuPrimary } from "src/screens/quiz/vocab/vocabWords.js"
import { VocabWordInfoButton } from "src/screens/quiz/vocab/VocabWordInfoButton.jsx"
import { VocabWordInfoOverlay } from "src/screens/quiz/vocab/VocabWordInfoOverlay.jsx"

const EXIT_MS = 620

function vocabPromptForTask(task, showVerbForms) {
    if (!task?.word) return { text: "", lang: undefined }
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        return { text: vocabLtDisplay(task.word, showVerbForms), lang: "lt" }
    }
    return { text: vocabRuPrimary(task.word), lang: "ru" }
}

function vocabExpectedForTask(task, showVerbForms) {
    if (!task?.word) return ""
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    return dir === VOCAB_DIRECTION.LT_TO_RU
        ? vocabRuPrimary(task.word)
        : vocabLtDisplay(task.word, showVerbForms)
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

function queueRequestedCards(queue, rows, requestTask, seq) {
    if (queue.length > 0) return queue
    const next = requestTask?.()
    if (!next?.word) return queue
    const alreadyVisible = rows.some((card) => taskKey(card.task) === taskKey(next))
    if (alreadyVisible) return queue
    return cardsForTaskPair(next, seq)
}

function appendQueuedCard(rows, queue) {
    if (rows.length >= 4 || queue.length === 0) {
        return { nextCards: rows, nextQueue: queue }
    }
    const [nextCard, ...nextQueue] = queue
    return {
        nextCards: [...rows, nextCard],
        nextQueue,
    }
}

function PromptCard({ card, dots, showVerbForms }) {
    const prompt = vocabPromptForTask(card.task, showVerbForms)
    return (
        <div className="vocab-ru-card vocab-ru-card--single">
            <VerbConjugationMark word={card.task?.word} />
            <div className="vocab-ru-card-body u-scrollbar-hidden">
                <AutoFitText
                    as="p"
                    className={[
                        "lemma vocab-ru-display",
                        prompt.text.includes("\n") && "vocab-ru-display--stacked",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    lang={prompt.lang}
                >
                    {prompt.text}
                </AutoFitText>
            </div>
            <VocabRoundDots dots={dots} />
        </div>
    )
}

function AnswerCard({ card, onOpenWordInfo, showInfoButton, showVerbForms }) {
    return (
        <div className="vocab-ru-card vocab-single-answer" aria-live="polite">
            <VerbConjugationMark word={card.task?.word} />
            <span className="vocab-single-answer__label">{STR.quiz.vocabSingleAnswerLabel}</span>
            <AutoFitText as="span" className="vocab-single-answer__value">
                {vocabExpectedForTask(card.task, showVerbForms)}
            </AutoFitText>
            {showInfoButton ? (
                <VocabWordInfoButton onClick={() => onOpenWordInfo?.(card.task?.word)} />
            ) : null}
        </div>
    )
}

function DeckCard({ card, dots, onOpenWordInfo, showInfoButton, showVerbForms }) {
    if (card.type === "answer") {
        return (
            <AnswerCard
                card={card}
                onOpenWordInfo={onOpenWordInfo}
                showInfoButton={showInfoButton}
                showVerbForms={showVerbForms}
            />
        )
    }
    return <PromptCard card={card} dots={dots} showVerbForms={showVerbForms} />
}

export function SingleVocabCardDeck({
    nextTask,
    onRequestNextTask,
    roundDots,
    showVerbForms = false,
    state,
    task,
}) {
    const [dragX, setDragX] = useState(0)
    const [cards, setCards] = useState(() => initialDeck(task, nextTask))
    const [enterFrom, setEnterFrom] = useState({})
    const [exit, setExit] = useState(null)
    const [infoWord, setInfoWord] = useState(null)
    const enterRafRef = useRef(0)
    const pendingCardsRef = useRef([])
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
        setEnterFrom({})
        setExit(null)
        pendingCardsRef.current = []
        pointerRef.current = null
        cancelAnimationFrame(enterRafRef.current)
        window.clearTimeout(timerRef.current)
    }, [nextTask, task])

    useEffect(
        () => () => {
            cancelAnimationFrame(enterRafRef.current)
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
                let nextEnterFrom = {}
                setCards((prev) => {
                    const shifted = prev.slice(1)
                    if (top.type !== "answer") {
                        const blockedTasks = [...shifted, ...pendingCardsRef.current].map(
                            (card) => card.task
                        )
                        const nextQueue = queueRequestedCards(
                            pendingCardsRef.current,
                            shifted,
                            () => requestVocabSingleFutureTask(blockedTasks),
                            seqRef.current
                        )
                        if (nextQueue !== pendingCardsRef.current) {
                            seqRef.current += 1
                            pendingCardsRef.current = nextQueue
                        }
                    }
                    if (pendingCardsRef.current.length === 0 && shifted.length < 4) {
                        const nextQueue = queueRequestedCards(
                            pendingCardsRef.current,
                            shifted,
                            onRequestNextTask,
                            seqRef.current
                        )
                        if (nextQueue !== pendingCardsRef.current) {
                            seqRef.current += 1
                            pendingCardsRef.current = nextQueue
                        }
                    }
                    const { nextCards, nextQueue } = appendQueuedCard(
                        shifted,
                        pendingCardsRef.current
                    )
                    pendingCardsRef.current = nextQueue
                    const shiftedIds = new Set(shifted.map((card) => card.id))
                    nextEnterFrom = {}
                    nextCards.forEach((card, index) => {
                        if (index > 0 && !shiftedIds.has(card.id)) {
                            nextEnterFrom[card.id] = Math.max(0, index - 1)
                        }
                    })
                    return nextCards
                })
                setEnterFrom(nextEnterFrom)
                cancelAnimationFrame(enterRafRef.current)
                enterRafRef.current = requestAnimationFrame(() => {
                    enterRafRef.current = requestAnimationFrame(() => setEnterFrom({}))
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
        <>
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
                        const enteringFromIndex = enterFrom[card.id]
                        const style = isTop
                            ? {
                                  transform: motionX
                                      ? `translate3d(${motionX}px, 0, 0) rotate(${Math.max(-12, Math.min(12, motionX / 18))}deg)`
                                      : undefined,
                              }
                            : enteringFromIndex != null
                              ? {
                                    "--vocab-single-enter-y": `var(--vocab-single-card-y-${Math.min(enteringFromIndex, 3)})`,
                                    "--vocab-single-enter-scale": `var(--vocab-single-card-scale-${Math.min(enteringFromIndex, 3)})`,
                                }
                              : undefined
                        return (
                            <div
                                key={card.id}
                                className={[
                                    "vocab-single-deck-card",
                                    `vocab-single-deck-card--${Math.min(index, 3)}`,
                                    isTop && "vocab-single-deck-card--top",
                                    enteringFromIndex != null && "vocab-single-deck-card--entering",
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
                                <DeckCard
                                    card={card}
                                    dots={isTop ? roundDots : null}
                                    onOpenWordInfo={setInfoWord}
                                    showInfoButton={isTop}
                                    showVerbForms={showVerbForms}
                                />
                            </div>
                        )
                    })}
            </div>
            <VocabWordInfoOverlay
                open={!!infoWord}
                word={infoWord}
                onClose={() => setInfoWord(null)}
            />
        </>
    )
}
