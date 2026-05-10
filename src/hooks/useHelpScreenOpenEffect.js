import { useEffect } from "react"

/**
 * При открытии длинной справки сбрасывает прокрутку и фокусирует заголовок.
 *
 * @param {{
 *   open: boolean;
 *   shellRef: import("react").RefObject<HTMLElement | null>;
 *   scrollBlockRef: import("react").RefObject<HTMLElement | null>;
 *   titleRef: import("react").RefObject<HTMLElement | null>;
 * }} params
 */
export function useHelpScreenOpenEffect({ open, shellRef, scrollBlockRef, titleRef }) {
    useEffect(() => {
        if (!open) return
        if (scrollBlockRef.current) scrollBlockRef.current.scrollTop = 0
        if (shellRef.current) shellRef.current.scrollTop = 0
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        requestAnimationFrame(() => {
            titleRef.current?.focus({ preventScroll: true })
        })
    }, [open, scrollBlockRef, shellRef, titleRef])
}
