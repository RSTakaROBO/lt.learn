import { cloneElement, isValidElement, useEffect, useRef, useState } from "react"

export function SwipeCardStack({
    cardKey,
    children,
    onSwipe,
    swipeAriaLabel,
    underlay,
    underlays,
}) {
    const prevKeyRef = useRef(cardKey)
    const [swiping, setSwiping] = useState(false)
    const [dragX, setDragX] = useState(0)
    const [exitX, setExitX] = useState(0)
    const pointerRef = useRef(null)
    const exitTimerRef = useRef(0)
    const exitingRef = useRef(false)

    useEffect(() => {
        if (prevKeyRef.current === cardKey) return undefined

        prevKeyRef.current = cardKey
        setSwiping(false)
        setDragX(0)
        setExitX(0)
        exitingRef.current = false
        if (typeof onSwipe === "function") return undefined
        const raf = requestAnimationFrame(() => setSwiping(true))
        const timer = window.setTimeout(() => setSwiping(false), 260)
        return () => {
            cancelAnimationFrame(raf)
            window.clearTimeout(timer)
        }
    }, [cardKey])

    useEffect(() => {
        return () => window.clearTimeout(exitTimerRef.current)
    }, [])

    const swipeEnabled = typeof onSwipe === "function"
    const stackUnderlays = Array.isArray(underlays)
        ? underlays.filter(Boolean)
        : underlay
          ? [underlay]
          : []
    const motionX = exitX || dragX
    const dragAbs = Math.abs(motionX)
    const dragDir = motionX > 0 ? "right" : motionX < 0 ? "left" : ""
    const dragStyle = swipeEnabled
        ? {
              transform: motionX
                  ? `translate3d(${motionX}px, 0, 0) rotate(${Math.max(-12, Math.min(12, motionX / 18))}deg)`
                  : undefined,
          }
        : undefined
    const card =
        isValidElement(children) && (swiping || motionX)
            ? cloneElement(children, {
                  className: [
                      children.props.className,
                      swiping && "vocab-ru-card--deal-in",
                      dragX && "vocab-ru-card--dragging",
                      exitX && "vocab-ru-card--exiting",
                      dragAbs >= 72 && `vocab-ru-card--swipe-${dragDir}`,
                  ]
                      .filter(Boolean)
                      .join(" "),
                  style: {
                      ...(children.props.style || {}),
                      ...dragStyle,
                  },
              })
            : children

    function resetPointer(target, pointerId) {
        target?.releasePointerCapture?.(pointerId)
        pointerRef.current = null
        setDragX(0)
    }

    function finishSwipe(dir, width) {
        if (!swipeEnabled || exitX || exitingRef.current) return
        exitingRef.current = true
        const target = dir === "right" ? width * 1.28 : -width * 1.28
        window.clearTimeout(exitTimerRef.current)
        setExitX(target)
        setDragX(0)
        exitTimerRef.current = window.setTimeout(() => {
            onSwipe(dir)
            setExitX(0)
            exitingRef.current = false
        }, 620)
    }

    function handlePointerDown(e) {
        if (!swipeEnabled || exitX || exitingRef.current || e.button !== 0) return
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
        if (!p || p.id !== e.pointerId) return
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
        const threshold = Math.min(112, Math.max(64, width * 0.22))
        const dx = e.clientX - p.startX
        const dir = dx >= threshold ? "right" : dx <= -threshold ? "left" : ""
        resetPointer(e.currentTarget, e.pointerId)
        if (dir) finishSwipe(dir, Math.max(width, window.innerWidth || width))
    }

    function handlePointerCancel(e) {
        const p = pointerRef.current
        if (!p || p.id !== e.pointerId) return
        resetPointer(e.currentTarget, e.pointerId)
    }

    function handleKeyDown(e) {
        if (!swipeEnabled || exitX || exitingRef.current) return
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
        <div
            className={["vocab-card-stack", swipeEnabled && "vocab-card-stack--swipeable"]
                .filter(Boolean)
                .join(" ")}
            role={swipeEnabled ? "group" : undefined}
            aria-label={swipeEnabled ? swipeAriaLabel : undefined}
            tabIndex={swipeEnabled ? 0 : undefined}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
        >
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            {stackUnderlays.map((item, index) => (
                <div
                    key={item?.key || index}
                    className={[
                        "vocab-card-stack__underlay",
                        `vocab-card-stack__underlay--${index + 1}`,
                        exitX && "vocab-card-stack__underlay--promoting",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    {item}
                </div>
            ))}
            {card}
        </div>
    )
}
