import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

import { VERB_FORM_ORDER, VERB_MODE, VOCAB_DIRECTION } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { handleVocabSingleSwipe, requestVocabSingleFutureTask } from "js/quiz.js"
import { AutoFitText } from "src/screens/quiz/shared/AutoFitText.jsx"
import { StressedWord } from "src/screens/quiz/shared/StressedWord.jsx"
import { VerbConjugationMark } from "src/screens/quiz/shared/VerbConjugationMark.jsx"
import { VocabRoundExcludeButton } from "src/screens/quiz/shared/VocabRoundExcludeButton.jsx"
import { VocabRoundDots } from "src/screens/quiz/shared/VocabRoundDots.jsx"
import { vocabLtDisplay, vocabRuPrimary } from "src/screens/quiz/vocab/vocabWords.js"
import { VocabWordInfoButton } from "src/screens/quiz/vocab/VocabWordInfoButton.jsx"
import { VocabWordInfoOverlay } from "src/screens/quiz/vocab/VocabWordInfoOverlay.jsx"

const EXIT_MS = 620
const DECK_LOG_PREFIX = "[lt-card-deck]"

function vocabPromptForTask(task, showVerbForms) {
    if (!task?.word) return { text: "", lang: undefined }
    if (task.verbMode === VERB_MODE.FORM_CARDS) {
        return {
            text: VERB_FORM_ORDER.map((form) =>
                form.key === task.hiddenVerbFormKey
                    ? STR.quiz.hiddenVerbForm
                    : task.word.forms?.[form.key] || STR.quiz.emDash
            ).join("\n"),
            lang: "lt",
        }
    }
    const dir = task.vocabDirection
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        return { text: vocabLtDisplay(task.word, showVerbForms), lang: "lt" }
    }
    return { text: vocabRuPrimary(task.word), lang: "ru" }
}

function vocabExpectedForTask(task, showVerbForms) {
    if (!task?.word) return ""
    if (task.verbMode === VERB_MODE.FORM_CARDS) {
        return task.word.forms?.[task.hiddenVerbFormKey] || ""
    }
    const dir = task.vocabDirection
    return dir === VOCAB_DIRECTION.LT_TO_RU
        ? vocabRuPrimary(task.word)
        : vocabLtDisplay(task.word, showVerbForms)
}

function taskKey(task) {
    return [
        task?.mode || "",
        task?.verbMode || "",
        task?.hiddenVerbFormKey || "",
        task?.word?.id || task?.word?.lemma || "",
        task?.vocabDirection || "",
    ].join(":")
}

function cardDebug(card) {
    if (!card) return null
    return {
        id: card.id,
        type: card.type,
        key: taskKey(card.task),
        lemma: card.task?.word?.lemma || "",
        mode: card.task?.mode || "",
        verbMode: card.task?.verbMode || "",
        dir: card.task?.vocabDirection || "",
    }
}

function deckDebug(cards) {
    return cards.slice(0, 6).map(cardDebug)
}

function logDeck(event, payload = {}) {
    try {
        console.log(DECK_LOG_PREFIX, event, payload)
    } catch {
        /* diagnostics only */
    }
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
    const rows = cardsForTaskPair(task, 0)
    if (nextTask?.word && taskKey(nextTask) !== taskKey(task)) {
        rows.push(...cardsForTaskPair(nextTask, 0))
    }
    logDeck("initialDeck", {
        task: taskKey(task),
        nextTask: nextTask?.word ? taskKey(nextTask) : null,
        rows: deckDebug(rows),
    })
    return rows
}

function queueRequestedCards(queue, rows, requestTask, seq) {
    if (queue.length > 0) {
        logDeck("queue:reuse-existing", { seq, queue: deckDebug(queue) })
        return queue
    }
    const next = requestTask?.()
    if (!next?.word) {
        logDeck("queue:no-next", { seq, rows: deckDebug(rows) })
        return queue
    }
    const alreadyVisible = rows.some((card) => taskKey(card.task) === taskKey(next))
    if (alreadyVisible) {
        logDeck("queue:already-visible", {
            seq,
            next: taskKey(next),
            rows: deckDebug(rows),
        })
        return queue
    }
    const nextRows = cardsForTaskPair(next, seq)
    logDeck("queue:new", { seq, next: taskKey(next), cards: deckDebug(nextRows) })
    return nextRows
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

function expectedTopType(state) {
    return state?.revealed ? "answer" : "prompt"
}

function repairDeckForTask(task, nextTask, state) {
    const expected = expectedTopType(state)
    const rows = task?.word ? [makeCard(expected, task, `repair-${expected}`)] : []
    const otherType = expected === "prompt" ? "answer" : "prompt"
    if (task?.word) rows.push(makeCard(otherType, task, `repair-${otherType}`))
    if (nextTask?.word && taskKey(nextTask) !== taskKey(task)) {
        rows.push(...cardsForTaskPair(nextTask, "repair-next"))
    }
    return rows
}

function PromptCard({ card, dots, onExclude, showExcludeButton, showVerbForms }) {
    const prompt = vocabPromptForTask(card.task, showVerbForms)
    const showStress = prompt.lang === "lt" && card.task?.verbMode !== VERB_MODE.FORM_CARDS
    return (
        <div className="vocab-ru-card vocab-ru-card--single">
            {showExcludeButton ? <VocabRoundExcludeButton onClick={onExclude} /> : null}
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
                    {showStress ? (
                        <StressedWord stress={card.task?.word?.stress} text={prompt.text} />
                    ) : (
                        prompt.text
                    )}
                </AutoFitText>
            </div>
            <VocabRoundDots dots={dots} />
        </div>
    )
}

function AnswerCard({
    card,
    onExclude,
    onOpenWordInfo,
    showExcludeButton,
    showInfoButton,
    showVerbForms,
}) {
    const expected = vocabExpectedForTask(card.task, showVerbForms)
    const direction = card.task?.vocabDirection
    const lang =
        direction === VOCAB_DIRECTION.RU_TO_LT || card.task?.verbMode === VERB_MODE.FORM_CARDS
            ? "lt"
            : "ru"
    const showStress = lang === "lt" && card.task?.verbMode !== VERB_MODE.FORM_CARDS

    return (
        <div className="vocab-ru-card vocab-single-answer" aria-live="polite">
            {showExcludeButton ? <VocabRoundExcludeButton onClick={onExclude} /> : null}
            <VerbConjugationMark word={card.task?.word} />
            <span className="vocab-single-answer__label">{STR.quiz.vocabSingleAnswerLabel}</span>
            <AutoFitText as="span" className="vocab-single-answer__value" lang={lang}>
                {showStress ? (
                    <StressedWord stress={card.task?.word?.stress} text={expected} />
                ) : (
                    expected
                )}
            </AutoFitText>
            {showInfoButton ? (
                <VocabWordInfoButton onClick={() => onOpenWordInfo?.(card.task?.word)} />
            ) : null}
        </div>
    )
}

function DeckCard({
    card,
    dots,
    onExclude,
    onOpenWordInfo,
    showExcludeButton,
    showInfoButton,
    showVerbForms,
}) {
    if (card.type === "answer") {
        return (
            <AnswerCard
                card={card}
                onExclude={onExclude}
                onOpenWordInfo={onOpenWordInfo}
                showExcludeButton={showExcludeButton}
                showInfoButton={showInfoButton}
                showVerbForms={showVerbForms}
            />
        )
    }
    return (
        <PromptCard
            card={card}
            dots={dots}
            onExclude={onExclude}
            showExcludeButton={showExcludeButton}
            showVerbForms={showVerbForms}
        />
    )
}

export function SingleVocabCardDeck({
    nextTask,
    onExcludeCurrentWord,
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
        if (taskIdRef.current === nextId) {
            logDeck("effect:same-task", {
                task: nextId,
                nextTask: nextTask?.word ? taskKey(nextTask) : null,
                cards: deckDebug(cards),
            })
            return
        }
        logDeck("effect:reset-task", {
            from: taskIdRef.current,
            to: nextId,
            nextTask: nextTask?.word ? taskKey(nextTask) : null,
            cardsBefore: deckDebug(cards),
        })
        taskIdRef.current = nextId
        setCards((prev) => {
            if (prev[0]?.task && taskKey(prev[0].task) === nextId) {
                logDeck("effect:keep-current-deck", { task: nextId, cards: deckDebug(prev) })
                return prev
            }
            const rows = initialDeck(task, nextTask)
            logDeck("effect:replace-deck", { task: nextId, rows: deckDebug(rows) })
            return rows
        })
        setDragX(0)
        setEnterFrom({})
        setExit(null)
        pendingCardsRef.current = []
        pointerRef.current = null
        cancelAnimationFrame(enterRafRef.current)
        window.clearTimeout(timerRef.current)
    }, [nextTask, task])

    useEffect(() => {
        const top = cards[0]
        if (!task?.word || !top) return
        const expected = expectedTopType(state)
        const currentKey = taskKey(task)
        const topKey = taskKey(top.task)
        if (top.type === expected && topKey === currentKey) return

        const rows = repairDeckForTask(task, nextTask, state)
        logDeck("invariant:repair", {
            expected,
            task: currentKey,
            top: cardDebug(top),
            before: deckDebug(cards),
            after: deckDebug(rows),
            state,
        })
        setCards(rows)
        setDragX(0)
        setEnterFrom({})
        setExit(null)
        pendingCardsRef.current = []
        pointerRef.current = null
        cancelAnimationFrame(enterRafRef.current)
        window.clearTimeout(timerRef.current)
    }, [cards, nextTask, state, task])

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
        const expected = expectedTopType(state)
        const currentKey = taskKey(task)
        if (top.type !== expected || taskKey(top.task) !== currentKey) {
            const rows = repairDeckForTask(task, nextTask, state)
            logDeck("swipe:block-and-repair", {
                dir,
                expected,
                task: currentKey,
                top: cardDebug(top),
                before: deckDebug(cards),
                after: deckDebug(rows),
                state,
            })
            setCards(rows)
            setDragX(0)
            setEnterFrom({})
            setExit(null)
            pendingCardsRef.current = []
            pointerRef.current = null
            return
        }
        logDeck("swipe:start", {
            dir,
            top: cardDebug(top),
            cards: deckDebug(cards),
            pending: deckDebug(pendingCardsRef.current),
        })
        const x = dir === "right" ? width * 1.28 : -width * 1.28
        setExit({ dir, x })
        setDragX(0)
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            flushSync(() => {
                logDeck("swipe:commit-before-engine", {
                    dir,
                    top: cardDebug(top),
                    cards: deckDebug(cards),
                })
                const swipeResult = handleVocabSingleSwipe(dir, top.task, top.type)
                let nextEnterFrom = {}
                setCards((prev) => {
                    if (top.type === "answer" && swipeResult?.advanced) {
                        const nextRows = initialDeck(swipeResult.currentTask, swipeResult.nextTask)
                        pendingCardsRef.current = []
                        logDeck("cards:advance-replace", {
                            removed: cardDebug(top),
                            before: deckDebug(prev),
                            currentTask: taskKey(swipeResult.currentTask),
                            nextTask: swipeResult.nextTask?.word
                                ? taskKey(swipeResult.nextTask)
                                : null,
                            nextCards: deckDebug(nextRows),
                        })
                        return nextRows
                    }
                    const shifted = prev.slice(1)
                    logDeck("cards:shift", {
                        removed: cardDebug(top),
                        before: deckDebug(prev),
                        shifted: deckDebug(shifted),
                        pendingBefore: deckDebug(pendingCardsRef.current),
                    })
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
                    logDeck("cards:next", {
                        nextCards: deckDebug(nextCards),
                        pendingAfter: deckDebug(pendingCardsRef.current),
                        enterFrom: nextEnterFrom,
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
                                    onExclude={onExcludeCurrentWord}
                                    onOpenWordInfo={setInfoWord}
                                    showExcludeButton={isTop}
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
