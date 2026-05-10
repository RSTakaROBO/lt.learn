import { useEffect } from "react"

/**
 * Фокусирует элемент после открытия экрана/модалки.
 *
 * @param {import("react").RefObject<HTMLElement | null>} ref
 * @param {boolean} open
 * @param {FocusOptions} [options]
 */
export function useAutoFocusOnOpen(ref, open, options) {
    useEffect(() => {
        if (!open) return
        requestAnimationFrame(() => ref.current?.focus(options))
    }, [open, options, ref])
}
