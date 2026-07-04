import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { shallowEqual, useSelector } from "react-redux"

import { fmt } from "js/i18n/core.js"
import { loadWordsFromFiles, reloadManifestPacks, resolveAllWordFiles } from "js/packs.js"
import { STR } from "js/i18n/strings-ru.js"
import { excludeCurrentRoundWord, handleSentenceBuilderSubmit } from "js/quiz.js"
import {
    AutoFitText,
    VocabRoundExcludeButton,
    VocabRoundProgress,
} from "src/screens/quiz/shared/index.js"
import {
    collectSentenceLookupWords,
    sentenceTokenInfo,
} from "src/screens/quiz/sentences/sentenceTokenInfo.js"

function tokenById(task, id) {
    return Array.isArray(task?.tokens) ? task.tokens.find((token) => token.id === id) || null : null
}

function SentenceTokenButton({
    activeInfoId,
    answered,
    className,
    isDragging,
    info,
    onClick,
    onInfoToggle,
    onPointerDown,
    text,
    tokenId,
    wordAriaLabel,
}) {
    const infoOpen = activeInfoId === tokenId && !!info
    const infoId = `sentence-token-info-${tokenId}`
    function handleInfoClick(e) {
        e.preventDefault()
        e.stopPropagation()
        if (!info) return
        onInfoToggle(tokenId, info)
    }

    function handleTokenKeyDown(e) {
        if (answered || (e.key !== "Enter" && e.key !== " ")) return
        e.preventDefault()
        onClick()
    }

    return (
        <span className="sentence-token-item" data-token-id={tokenId} role="listitem">
            <span
                className={[
                    "sentence-token-wrap",
                    className,
                    isDragging && "sentence-token-wrap--dragging",
                ]
                    .filter(Boolean)
                    .join(" ")}
                data-token-id={tokenId}
                role="button"
                tabIndex={answered ? -1 : 0}
                aria-label={wordAriaLabel}
                aria-disabled={answered}
                onClick={() => {
                    if (!answered) onClick()
                }}
                onKeyDown={handleTokenKeyDown}
                onPointerDown={onPointerDown}
            >
                {info ? (
                    <button
                        type="button"
                        className="sentence-token-help"
                        aria-label={fmt(STR.quiz.sentenceWordInfoAria, { word: text })}
                        aria-describedby={infoOpen ? infoId : undefined}
                        aria-expanded={infoOpen}
                        onClick={handleInfoClick}
                        tabIndex={answered ? -1 : 0}
                    >
                        ?
                    </button>
                ) : null}
                <span className="sentence-token__text">{text}</span>
            </span>
            {infoOpen ? (
                <span id={infoId} className="sentence-token-popover" role="status">
                    {info.translations.length ? (
                        <span className="sentence-token-popover__translation">
                            {info.translations.slice(0, 3).join(", ")}
                        </span>
                    ) : null}
                    {info.caseLabel ? (
                        <span className="sentence-token-popover__case">
                            {STR.quiz.sentenceWordInfoCase}:{" "}
                            {STR.cases[info.caseKey] || info.caseLabel}
                        </span>
                    ) : null}
                    {info.verbForms?.length ? (
                        <span className="sentence-token-popover__forms">
                            {info.verbForms.map((form) => (
                                <span key={form.key} className="sentence-token-popover__form-row">
                                    <span className="sentence-token-popover__form-label">
                                        {form.label}
                                    </span>
                                    <span className="sentence-token-popover__form-value" lang="lt">
                                        {form.value}
                                    </span>
                                </span>
                            ))}
                        </span>
                    ) : null}
                </span>
            ) : null}
        </span>
    )
}

export function SentenceQuiz({
    answered,
    feedback,
    finishLabel,
    isActive,
    onFinish,
    roundProgress,
    showFinish,
    submitLabel,
    task,
}) {
    const [selectedIds, setSelectedIds] = useState([])
    const [activeInfo, setActiveInfo] = useState(null)
    const [lookupLoadRequested, setLookupLoadRequested] = useState(false)
    const [dragPreview, setDragPreview] = useState(null)
    const pointerDragRef = useRef(null)
    const suppressClickRef = useRef(null)
    const suppressNativeClickRef = useRef(false)
    const { packRows, wordBank } = useSelector(
        (s) => ({
            packRows: s.trainer.manifestUi.packRows,
            wordBank: s.trainer.engine.wordBank,
        }),
        shallowEqual
    )
    const expectedWords = Array.isArray(task?.expectedWords) ? task.expectedWords : []
    const feedbackKind = feedback?.kind === "ok" || feedback?.kind === "bad" ? feedback.kind : ""

    useEffect(() => {
        setSelectedIds([])
        setActiveInfo(null)
        setLookupLoadRequested(false)
    }, [task])

    const lookupWords = useMemo(
        () => collectSentenceLookupWords({ wordBank, packRows }),
        [wordBank, packRows]
    )

    useEffect(() => {
        if (!isActive || lookupLoadRequested || lookupWords.length) return
        if (!Array.isArray(task?.tokens) || !task.tokens.length) return
        setLookupLoadRequested(true)
        void (async () => {
            try {
                await reloadManifestPacks()
                const files = resolveAllWordFiles()
                if (files.length) {
                    await loadWordsFromFiles(files, { filterLearned: false })
                }
            } catch (err) {
                console.error(err)
            }
        })()
    }, [isActive, lookupLoadRequested, lookupWords.length, task])

    const selectedTokens = useMemo(
        () => selectedIds.map((id) => tokenById(task, id)).filter(Boolean),
        [selectedIds, task]
    )
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
    const availableTokens = useMemo(
        () =>
            Array.isArray(task?.tokens)
                ? task.tokens.filter((token) => !selectedSet.has(token.id))
                : [],
        [selectedSet, task]
    )

    useEffect(() => {
        if (!activeInfo) return undefined
        function closeInfo(e) {
            const help = e.target?.closest?.(".sentence-token-help")
            if (help?.getAttribute("aria-disabled") === "false") return
            if (e.target?.closest?.(".sentence-token-popover")) return
            setActiveInfo(null)
        }
        document.addEventListener("pointerdown", closeInfo, true)
        return () => document.removeEventListener("pointerdown", closeInfo, true)
    }, [activeInfo])

    useEffect(() => {
        function blockHandledPointerClick(e) {
            if (!suppressNativeClickRef.current) return
            suppressNativeClickRef.current = false
            e.preventDefault()
            e.stopPropagation()
        }

        document.addEventListener("click", blockHandledPointerClick, true)
        return () => document.removeEventListener("click", blockHandledPointerClick, true)
    }, [])

    function moveTokenToAnswer(id, index = selectedIds.length) {
        if (answered || !tokenById(task, id)) return
        setActiveInfo(null)
        setSelectedIds((current) => {
            const without = current.filter((tokenId) => tokenId !== id)
            const boundedIndex = Math.max(0, Math.min(index, without.length))
            return [...without.slice(0, boundedIndex), id, ...without.slice(boundedIndex)]
        })
    }

    function removeTokenFromAnswer(id) {
        if (answered) return
        setActiveInfo(null)
        setSelectedIds((current) => current.filter((tokenId) => tokenId !== id))
    }

    function finishPointerDrop(e, drag) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        const answerItem = elements
            .map((el) => el.closest?.(".sentence-answer__tokens .sentence-token-item"))
            .find(Boolean)
        const answerArea = elements.some((el) => el.closest?.(".sentence-answer"))
        const bankArea = elements.some((el) => el.closest?.(".sentence-bank"))

        if (answerItem) {
            const index = selectedIds.indexOf(answerItem.dataset.tokenId)
            moveTokenToAnswer(drag.id, index < 0 ? selectedIds.length : index)
            return
        }
        if (answerArea) {
            moveTokenToAnswer(drag.id)
            return
        }
        if (bankArea) {
            removeTokenFromAnswer(drag.id)
        }
    }

    function startTokenPointerDrag(e, token, info, tapAction) {
        if (answered || (e.pointerType === "mouse" && e.button !== 0)) return
        e.preventDefault()
        setActiveInfo(null)
        const rect = e.currentTarget.getBoundingClientRect()
        pointerDragRef.current = {
            id: token.id,
            hasInfo: !!info,
            height: rect.height,
            info,
            moved: false,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startedOnHelp: !!e.target?.closest?.(".sentence-token-help"),
            tapAction,
            target: e.currentTarget,
            text: token.text,
            width: rect.width,
        }
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
            // Pointer capture is a nice-to-have; window listeners still keep the drag alive.
        }
    }

    useEffect(() => {
        function handlePointerMove(e) {
            const drag = pointerDragRef.current
            if (!drag || drag.pointerId !== e.pointerId) return

            if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 7) {
                drag.moved = true
                setActiveInfo(null)
            }
            if (drag.moved) {
                setDragPreview({
                    hasInfo: drag.hasInfo,
                    height: drag.height,
                    left: e.clientX - drag.offsetX,
                    text: drag.text,
                    tokenId: drag.id,
                    top: e.clientY - drag.offsetY,
                    width: drag.width,
                })
                e.preventDefault()
            }
        }

        function handlePointerUp(e) {
            const drag = pointerDragRef.current
            if (!drag || drag.pointerId !== e.pointerId) return

            pointerDragRef.current = null
            setDragPreview(null)
            try {
                drag.target?.releasePointerCapture?.(e.pointerId)
            } catch {
                // Ignore browsers that do not keep capture by this point.
            }

            e.preventDefault()

            if (!drag.moved) {
                if (drag.startedOnHelp && drag.info) {
                    toggleInfo(drag.id, drag.info)
                } else {
                    drag.tapAction?.()
                }
                suppressNativeClickRef.current = true
                suppressClickRef.current = drag.id
                window.setTimeout(() => {
                    if (suppressClickRef.current === drag.id) suppressClickRef.current = null
                }, 0)
                return
            }

            suppressNativeClickRef.current = true
            suppressClickRef.current = drag.id
            window.setTimeout(() => {
                if (suppressClickRef.current === drag.id) suppressClickRef.current = null
            }, 0)
            finishPointerDrop(e, drag)
        }

        document.addEventListener("pointermove", handlePointerMove, { passive: false })
        document.addEventListener("pointerup", handlePointerUp)
        document.addEventListener("pointercancel", handlePointerUp)
        return () => {
            document.removeEventListener("pointermove", handlePointerMove)
            document.removeEventListener("pointerup", handlePointerUp)
            document.removeEventListener("pointercancel", handlePointerUp)
        }
    })

    function tokenInfo(token) {
        return sentenceTokenInfo(token?.text, lookupWords)
    }

    function handleTokenClick(tokenId, action) {
        if (suppressClickRef.current === tokenId) {
            suppressClickRef.current = null
            return
        }
        action()
    }

    function toggleInfo(tokenId, info) {
        if (!info) return
        if (suppressClickRef.current === tokenId) {
            suppressClickRef.current = null
            return
        }
        setActiveInfo((current) =>
            current?.tokenId === tokenId
                ? null
                : {
                      tokenId,
                      info,
                  }
        )
    }

    return (
        <form
            id="answer-form"
            className={["sentence-builder", isActive ? "" : "hidden"].filter(Boolean).join(" ")}
            autoComplete="off"
            aria-label={STR.quiz.sentenceBuilderAria}
            onSubmit={(e) => {
                e.preventDefault()
                handleSentenceBuilderSubmit(selectedTokens.map((token) => token.text))
            }}
        >
            <VocabRoundProgress progress={roundProgress} />
            <section className="sentence-card">
                <VocabRoundExcludeButton onClick={excludeCurrentRoundWord} />
                <div className="sentence-card__body">
                    <AutoFitText as="p" className="sentence-card__prompt" lang="ru">
                        {task?.sentence?.ru || ""}
                    </AutoFitText>
                </div>
            </section>
            <div
                className={["sentence-answer", feedbackKind && `sentence-answer--${feedbackKind}`]
                    .filter(Boolean)
                    .join(" ")}
                aria-label={STR.quiz.sentenceAnswerAria}
            >
                <div className="sentence-answer__tokens" role="list">
                    {selectedTokens.length ? (
                        selectedTokens.map((token, index) => {
                            const info = tokenInfo(token)
                            const positionOk = answered && token.text === expectedWords[index]
                            return (
                                <SentenceTokenButton
                                    key={token.id}
                                    activeInfoId={activeInfo?.tokenId || ""}
                                    answered={answered}
                                    className={[
                                        "sentence-token",
                                        "sentence-token--answer",
                                        answered &&
                                            (positionOk
                                                ? "sentence-token--position-ok"
                                                : "sentence-token--position-bad"),
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    info={info}
                                    isDragging={dragPreview?.tokenId === token.id}
                                    text={token.text}
                                    tokenId={token.id}
                                    wordAriaLabel={fmt(STR.quiz.sentenceRemoveWord, {
                                        word: token.text,
                                    })}
                                    onClick={() =>
                                        handleTokenClick(token.id, () =>
                                            removeTokenFromAnswer(token.id)
                                        )
                                    }
                                    onInfoToggle={toggleInfo}
                                    onPointerDown={(e) =>
                                        startTokenPointerDrag(e, token, info, () =>
                                            removeTokenFromAnswer(token.id)
                                        )
                                    }
                                />
                            )
                        })
                    ) : (
                        <span className="sentence-answer__placeholder">
                            {STR.quiz.sentenceEmptyAnswer}
                        </span>
                    )}
                </div>
                {feedback?.expected ? (
                    <p className="sentence-answer__expected" aria-live="polite">
                        <span>{STR.quiz.correctIs}</span>
                        <strong>{feedback.expected}</strong>
                    </p>
                ) : null}
            </div>
            <div className="sentence-bank" role="list" aria-label={STR.quiz.sentenceWordBankAria}>
                {availableTokens.map((token) => {
                    const info = tokenInfo(token)
                    return (
                        <SentenceTokenButton
                            key={token.id}
                            activeInfoId={activeInfo?.tokenId || ""}
                            answered={answered}
                            className="sentence-token"
                            info={info}
                            isDragging={dragPreview?.tokenId === token.id}
                            text={token.text}
                            tokenId={token.id}
                            wordAriaLabel={fmt(STR.quiz.sentenceAddWord, { word: token.text })}
                            onClick={() =>
                                handleTokenClick(token.id, () => moveTokenToAnswer(token.id))
                            }
                            onInfoToggle={toggleInfo}
                            onPointerDown={(e) =>
                                startTokenPointerDrag(e, token, info, () =>
                                    moveTokenToAnswer(token.id)
                                )
                            }
                        />
                    )
                })}
            </div>
            {dragPreview
                ? createPortal(
                      <span
                          className="sentence-token-drag-preview"
                          style={{
                              height: dragPreview.height,
                              left: dragPreview.left,
                              top: dragPreview.top,
                              width: dragPreview.width,
                          }}
                          aria-hidden="true"
                      >
                          <span className="sentence-token-wrap sentence-token sentence-token--drag-copy">
                              {dragPreview.hasInfo ? (
                                  <span className="sentence-token-help sentence-token-help--preview">
                                      ?
                                  </span>
                              ) : null}
                              <span className="sentence-token__text">{dragPreview.text}</span>
                          </span>
                      </span>,
                      document.body
                  )
                : null}
            <div className="actions sentence-actions">
                {showFinish ? (
                    <button type="button" className="btn ghost" onClick={onFinish}>
                        {finishLabel}
                    </button>
                ) : null}
                <button type="submit" className="btn primary">
                    {submitLabel}
                </button>
            </div>
        </form>
    )
}
