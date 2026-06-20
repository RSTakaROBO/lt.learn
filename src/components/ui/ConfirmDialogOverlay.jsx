import { useRef } from "react"

import { useAutoFocusOnOpen } from "src/hooks/useAutoFocusOnOpen.js"
import { AppModalOverlay } from "src/components/layout/AppModalOverlay.jsx"
import { Button } from "src/components/ui/Button.jsx"

/**
 * Общий confirm-попап в стиле приложения.
 *
 * @param {{
 *   id: string;
 *   open: boolean;
 *   title: string;
 *   message: string;
 *   details?: import("react").ReactNode;
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
    details,
    cancelLabel,
    confirmLabel,
    onCancel,
    onConfirm,
}) {
    const titleId = `${id}-title`
    const cancelButtonRef = useRef(null)

    useAutoFocusOnOpen(cancelButtonRef, open)

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
                    <Button ref={cancelButtonRef} type="button" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button variant="primary" type="button" onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            <div className="app-screen__body confirm-dialog-body">
                <p>{message}</p>
                {details}
            </div>
        </AppModalOverlay>
    )
}
