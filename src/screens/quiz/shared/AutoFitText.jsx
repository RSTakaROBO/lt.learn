import { useLayoutEffect, useRef } from "react"

const MIN_FONT_PX = 18
const FIT_SAFETY = 0.94

function fitElementText(el, inner, minFontPx) {
    if (!el || !inner) return
    el.style.fontSize = ""

    const availableWidth = el.clientWidth
    if (availableWidth <= 1) return

    const baseFontPx = parseFloat(getComputedStyle(el).fontSize)
    if (!Number.isFinite(baseFontPx) || baseFontPx <= 0) return

    const naturalWidth = inner.scrollWidth
    if (naturalWidth <= availableWidth + 1) return

    const minPx = Math.min(baseFontPx, minFontPx)
    const fittedPx = Math.floor(baseFontPx * (availableWidth / naturalWidth) * FIT_SAFETY)
    el.style.fontSize = `${Math.max(minPx, Math.min(baseFontPx, fittedPx))}px`
}

export function AutoFitText({
    as: Component = "span",
    children,
    className,
    id,
    lang,
    minFontPx = MIN_FONT_PX,
}) {
    const ref = useRef(null)
    const innerRef = useRef(null)

    useLayoutEffect(() => {
        const el = ref.current
        const inner = innerRef.current
        if (!el) return undefined

        let raf = 0
        let retry = 0
        const run = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                fitElementText(el, inner, minFontPx)
                retry += 1
                if (retry < 4) run()
            })
        }

        run()
        const resizeObserver = new ResizeObserver(run)
        resizeObserver.observe(el)
        if (el.parentElement) {
            resizeObserver.observe(el.parentElement)
        }
        window.addEventListener("resize", run)

        document.fonts?.ready?.then(run).catch(() => {})

        return () => {
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            window.removeEventListener("resize", run)
        }
    }, [children, minFontPx])

    return (
        <Component ref={ref} className={className} id={id} lang={lang}>
            <span ref={innerRef} className="auto-fit-text__inner">
                {children}
            </span>
        </Component>
    )
}
