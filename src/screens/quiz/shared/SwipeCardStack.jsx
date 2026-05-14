import { cloneElement, isValidElement, useEffect, useRef, useState } from "react"

export function SwipeCardStack({ cardKey, children }) {
    const prevKeyRef = useRef(cardKey)
    const [swiping, setSwiping] = useState(false)

    useEffect(() => {
        if (prevKeyRef.current === cardKey) return undefined

        prevKeyRef.current = cardKey
        setSwiping(false)
        const raf = requestAnimationFrame(() => setSwiping(true))
        const timer = window.setTimeout(() => setSwiping(false), 260)
        return () => {
            cancelAnimationFrame(raf)
            window.clearTimeout(timer)
        }
    }, [cardKey])

    const card =
        isValidElement(children) && swiping
            ? cloneElement(children, {
                  className: [children.props.className, "vocab-ru-card--deal-in"]
                      .filter(Boolean)
                      .join(" "),
              })
            : children

    return (
        <div className="vocab-card-stack">
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            <span className="vocab-card-stack__bg" aria-hidden="true" />
            {card}
        </div>
    )
}
