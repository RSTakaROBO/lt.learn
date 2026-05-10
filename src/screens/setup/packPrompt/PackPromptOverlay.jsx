import { useEffect, useMemo, useRef, useState } from "react"

import { STR } from "js/i18n/strings-ru.js"
import { AppModalOverlay } from "src/components/layout/AppModalOverlay.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"
import { useAutoFocusOnOpen } from "src/hooks/useAutoFocusOnOpen.js"

/**
 * Окно с текстом промпта для LLM.
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function PackPromptOverlay({ heightMode = "fill" } = {}) {
    const [state, dispatch] = useTrainerApp()
    const open = state.overlay.packPrompt
    const closePackPrompt = () => dispatch({ type: "OVERLAY_CLOSE", name: "packPrompt" })
    const [copyLabel, setCopyLabel] = useState(STR.packPrompt.copy)
    const titleRef = useRef(null)
    const textareaRef = useRef(null)
    const titleFocusOptions = useMemo(() => ({ preventScroll: true }), [])

    useAutoFocusOnOpen(titleRef, open, titleFocusOptions)

    useEffect(() => {
        if (!open) return
        setCopyLabel(STR.packPrompt.copy)
    }, [open])

    async function handleCopy() {
        const ta = textareaRef.current
        if (!(ta instanceof HTMLTextAreaElement)) return
        const label = STR.packPrompt.copy
        const fail = () => {
            ta.focus()
            ta.select()
            setCopyLabel(STR.clipboard.selectManually)
            window.setTimeout(() => {
                setCopyLabel(label)
            }, 2000)
        }
        try {
            await navigator.clipboard.writeText(ta.value)
            setCopyLabel(STR.clipboard.copied)
            window.setTimeout(() => {
                setCopyLabel(label)
            }, 1600)
        } catch {
            try {
                ta.select()
                document.execCommand("copy")
                setCopyLabel(STR.clipboard.copied)
                window.setTimeout(() => {
                    setCopyLabel(label)
                }, 1600)
            } catch {
                fail()
            }
        }
    }

    return (
        <AppModalOverlay
            id="pack-prompt-overlay"
            open={open}
            ariaLabelledBy="pack-prompt-title"
            heightMode={heightMode}
            shellClassName="pack-prompt-overlay"
            panelClassName="pack-prompt-panel"
            onBackdropClick={closePackPrompt}
            title={
                <h2 ref={titleRef} id="pack-prompt-title" tabIndex={-1}>
                    {STR.packPrompt.title}
                </h2>
            }
            footer={
                <div className="app-screen__footer actions wizard-pack-actions pack-prompt-actions">
                    <Button type="button" onClick={handleCopy}>
                        {copyLabel}
                    </Button>
                    <Button variant="primary" type="button" onClick={closePackPrompt}>
                        {STR.packPrompt.close}
                    </Button>
                </div>
            }
        >
            <div className="app-screen__body">
                <p className="sub pack-prompt-lead">{STR.packPrompt.lead}</p>
                <label className="sr-only" htmlFor="pack-prompt-text">
                    {STR.packPrompt.textareaLabel}
                </label>
                <textarea
                    ref={textareaRef}
                    id="pack-prompt-text"
                    className="pack-prompt-textarea"
                    value={STR.packPrompt.llmPrompt}
                    readOnly
                    spellCheck={false}
                    rows={14}
                    aria-readonly="true"
                />
            </div>
        </AppModalOverlay>
    )
}
