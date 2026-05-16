import { useLayoutEffect } from "react"

/** PWA на iOS: 100dvh / innerHeight при старте занижены; 100vh = полный экран (см. WebKit standalone). */
export function isStandaloneWebApp() {
    return (
        window.navigator.standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches
    )
}

export function useStandaloneAppHeight() {
    useLayoutEffect(() => {
        if (!isStandaloneWebApp()) return undefined

        const root = document.documentElement
        root.classList.add("ios-standalone")
        root.style.setProperty("--app-height", "100vh")

        return () => {
            root.classList.remove("ios-standalone")
            root.style.removeProperty("--app-height")
        }
    }, [])
}
