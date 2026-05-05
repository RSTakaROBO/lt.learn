import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import { shallowEqual, useSelector } from "react-redux"

import { STR } from "../js/i18n/strings-ru.js"
import { initTrainerStorage, loadPersistedWordStats } from "../js/storage.js"
import { mutateEngine, postTrainerUiAction } from "../js/trainer-ui-state.js"

import { QuizBottomBar } from "./components/layout/QuizBottomBar.jsx"
import { ManifestPacksProvider } from "./context/ManifestPacksContext.jsx"
import { TrainerAppProvider } from "./context/TrainerAppContext.jsx"
import { useTrainerKeyboardShortcuts } from "./hooks/useTrainerKeyboardShortcuts.js"
import { CasesHelpScreen } from "./screens/help/CasesHelpScreen.jsx"
import { HelpHubScreen } from "./screens/help/HelpHubScreen.jsx"
import { VerbsHelpScreen } from "./screens/help/VerbsHelpScreen.jsx"
import { PackPromptOverlay } from "./screens/overlays/PackPromptOverlay.jsx"
import { StatsOverlay } from "./screens/overlays/StatsOverlay.jsx"
import { VocabRoundSummaryOverlay } from "./screens/overlays/VocabRoundSummaryOverlay.jsx"
import { QuizScreen } from "./screens/quiz/QuizScreen.jsx"
import { SettingsScreen } from "./screens/settings/SettingsScreen.jsx"
import { SetupScreen } from "./screens/setup/SetupScreen.jsx"

import "./styles.css"

let serviceWorkerLoadHookRegistered = false

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return
    const hostOk =
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1" ||
        location.hostname === "[::1]"
    if (!hostOk) return
    if (serviceWorkerLoadHookRegistered) return
    serviceWorkerLoadHookRegistered = true

    window.addEventListener("load", () => {
        const url = new URL("sw.js", location.href).href
        navigator.serviceWorker
            .register(url)
            .then((reg) => {
                reg.update().catch(() => {})
            })
            .catch((err) => {
                console.warn("Service worker:", err)
            })
    })
}

function AppScreens() {
    const { overlay, screen } = useSelector(
        (s) => ({
            overlay: s.trainer.overlay,
            screen: s.trainer.screen,
        }),
        shallowEqual
    )
    const mainScreenCovered = !!(
        overlay.casesHelp ||
        overlay.verbsHelp ||
        overlay.helpHub ||
        overlay.stats ||
        overlay.settings
    )

    return (
        <div className="app">
            <SetupScreen hidden={mainScreenCovered || screen !== "setup"} />
            <QuizScreen hidden={mainScreenCovered || screen !== "quiz"} />
            {overlay.packPrompt && <PackPromptOverlay heightMode="scroll" />}
            {overlay.casesHelp && <CasesHelpScreen />}
            {overlay.verbsHelp && <VerbsHelpScreen />}
            {overlay.helpHub && <HelpHubScreen />}
            {overlay.vocabRound && <VocabRoundSummaryOverlay />}
            {overlay.stats && <StatsOverlay />}
            {overlay.settings && <SettingsScreen />}
            <QuizBottomBar />
        </div>
    )
}

function AppRuntime() {
    useTrainerKeyboardShortcuts()

    return (
        <ManifestPacksProvider>
            <AppScreens />
        </ManifestPacksProvider>
    )
}

export default function App() {
    useEffect(() => {
        document.title = STR.app.pageTitle
        document
            .querySelector('meta[name="apple-mobile-web-app-title"]')
            ?.setAttribute("content", STR.app.appleWebAppTitle)
        registerServiceWorker()
        initTrainerStorage()
        mutateEngine((e) => {
            e.wordStats = loadPersistedWordStats()
        })
        postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 1 })
    }, [])

    return (
        <TrainerAppProvider>
            <AppRuntime />
        </TrainerAppProvider>
    )
}

const rootEl = document.getElementById("root")
if (rootEl) {
    createRoot(rootEl).render(<App />)
}
