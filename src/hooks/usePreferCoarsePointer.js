import { useEffect, useState } from "react"

/** true — коarse input (сенсор, стилус без hover): наш полноэкранный литовский ввод вместо ОС-клавы. */
function detectPreferCoarse() {
    if (typeof window === "undefined") return false
    return navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)").matches === true
}

export function usePreferCoarsePointer() {
    const [prefer, setPrefer] = useState(detectPreferCoarse)

    useEffect(() => {
        const mq = window.matchMedia("(pointer: coarse)")
        function sync() {
            setPrefer(mq.matches || navigator.maxTouchPoints > 0)
        }
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    return prefer
}
