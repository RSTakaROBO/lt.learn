import { useEffect } from "react"

function isEditableTarget(el) {
    return (
        el instanceof Element &&
        !!el.closest('input:not([type="hidden"]), textarea, select, [contenteditable="true"]')
    )
}

function isScrollableAncestor(el) {
    if (!(el instanceof Element)) return false
    let node = el
    while (node && node !== document.documentElement) {
        const { overflowY } = getComputedStyle(node)
        if (
            (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
            node.scrollHeight > node.clientHeight + 1
        ) {
            return true
        }
        node = node.parentElement
    }
    return false
}

/**
 * На iOS документ «резинит» даже при overflow:hidden на body.
 * Блокируем touchmove вне реальных скролл-контейнеров (клавиатура/поля — исключение).
 */
export function useIosDocumentScrollLock() {
    useEffect(() => {
        const coarse = window.matchMedia("(pointer: coarse)")
        if (!coarse.matches) return undefined

        function onTouchMove(e) {
            if (e.touches.length > 1) return
            const target = e.target
            if (isEditableTarget(target)) return
            if (isScrollableAncestor(target)) return
            e.preventDefault()
        }

        document.addEventListener("touchmove", onTouchMove, { passive: false })
        return () => document.removeEventListener("touchmove", onTouchMove)
    }, [])
}
