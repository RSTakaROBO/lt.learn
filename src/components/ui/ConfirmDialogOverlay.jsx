import { useEffect } from "react"

import { AppModalOverlay } from "../layout/AppModalOverlay.jsx"
import { Button } from "./Button.jsx"

/**
 * Общий confirm-попап в стиле приложения.
 *
 * @param {{
 *   id: string;
 *   open: boolean;
 *   title: string;
 *   message: string;
 *   cancelLabel: string;
 *   confirmLabel: string;
 *   onCancel: () => void;
 *   onConfirm: () => void;
 * }} props
 */
export function ConfirmDialogOverlay({
    id,
    open,
    title,
    message,
    cancelLabel,
    confirmLabel,
    onCancel,
    onConfirm,
}) {
    const titleId = `${id}-title`
    const cancelId = `${id}-cancel`

    useEffect(() => {
        if (!open) return
        requestAnimationFrame(() => document.getElementById(cancelId)?.focus())
    }, [cancelId, open])

    return (
        <AppModalOverlay
            id={id}
            open={open}
            ariaLabelledBy={titleId}
            shellClassName="confirm-dialog-overlay"
            panelClassName="confirm-dialog-panel"
            onBackdropClick={onCancel}
            title={<h2 id={titleId}>{title}</h2>}
            footer={
                <div className="app-screen__footer actions confirm-dialog-actions">
                    <Button type="button" id={cancelId} onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="primary"
                        type="button"
                        id={`${id}-confirm`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            <div className="app-screen__body confirm-dialog-body">
                <p>{message}</p>
            </div>
        </AppModalOverlay>
    )
}
