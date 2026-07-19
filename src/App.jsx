import { useCallback, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { shallowEqual, useSelector } from "react-redux"

import { STR } from "js/i18n/strings-ru.js"
import { loadPersistedWordStats, recordAppVisit } from "js/storage.js"
import { mutateEngine, postTrainerUiAction } from "js/trainer-ui-state.js"

import { QuizBottomBar } from "src/components/layout/QuizBottomBar.jsx"
import { ReferenceDockConfigurator } from "src/components/layout/ReferenceDockConfigurator.jsx"
import { ChangelogScreen } from "src/screens/changelog/ChangelogScreen.jsx"
import { ManifestPacksProvider, useManifestPacks } from "src/context/ManifestPacksContext.jsx"
import { TrainerAppProvider } from "src/context/TrainerAppContext.jsx"
import { useIosDocumentScrollLock } from "src/hooks/useIosDocumentScrollLock.js"
import { useStandaloneAppHeight } from "src/hooks/useStandaloneAppHeight.js"
import { useTrainerKeyboardShortcuts } from "src/hooks/useTrainerKeyboardShortcuts.js"
import { CasesHelpScreen } from "src/screens/help/CasesHelpScreen.jsx"
import { CaseReferenceDock } from "src/screens/help/CaseReferenceDock.jsx"
import { HelpHubScreen } from "src/screens/help/HelpHubScreen.jsx"
import { VerbFormsHelpScreen } from "src/screens/help/VerbFormsHelpScreen.jsx"
import { VerbTensesHelpScreen } from "src/screens/help/VerbTensesHelpScreen.jsx"
import { VerbTensesReferenceDock } from "src/screens/help/VerbTensesReferenceDock.jsx"
import { QuizScreen } from "src/screens/quiz/QuizScreen.jsx"
import { VocabRoundSummaryOverlay } from "src/screens/quiz/vocab/VocabRoundSummaryOverlay.jsx"
import { WordSearchScreen } from "src/screens/search/WordSearchScreen.jsx"
import { SettingsScreen } from "src/screens/settings/SettingsScreen.jsx"
import { PackPreviewScreen } from "src/screens/setup/packPreview/PackPreviewScreen.jsx"
import { SetupScreen } from "src/screens/setup/SetupScreen.jsx"
import { PackPromptOverlay } from "src/screens/setup/packPrompt/PackPromptOverlay.jsx"
import { StatsScreen } from "src/screens/stats/StatsScreen.jsx"

import "../css/styles.css"

let serviceWorkerLoadHookRegistered = false

const CASE_REFERENCE_DOCK_STORAGE_KEY = "lt-trainer-case-reference-dock-v1"
const VERB_TENSES_REFERENCE_DOCK_STORAGE_KEY = "lt-trainer-verb-tenses-reference-dock-v1"

function readDockedItems(storageKey) {
    try {
        const value = JSON.parse(localStorage.getItem(storageKey) || "")
        if (!value || typeof value !== "object") throw new Error("Invalid dock state")
        return {
            left: Array.isArray(value.left) ? value.left : [],
            right: Array.isArray(value.right) ? value.right : [],
        }
    } catch {
        return { left: [], right: [] }
    }
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return
    if (import.meta.env.DEV) {
        navigator.serviceWorker.getRegistrations?.().then((regs) => {
            regs.forEach((reg) => reg.unregister().catch(() => {}))
        })
        return
    }
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
    const { previewPackRow } = useManifestPacks()
    const { overlay, screen } = useSelector(
        (s) => ({
            overlay: s.trainer.overlay,
            screen: s.trainer.screen,
        }),
        shallowEqual
    )
    const [dockedCases, setDockedCases] = useState(() =>
        readDockedItems(CASE_REFERENCE_DOCK_STORAGE_KEY)
    )
    const [dockedTenses, setDockedTenses] = useState(() =>
        readDockedItems(VERB_TENSES_REFERENCE_DOCK_STORAGE_KEY)
    )
    const createDockUpdater = useCallback(
        (setDockedItems, storageKey) => (updater) => {
            setDockedItems((current) => {
                const next = updater(current)
                try {
                    localStorage.setItem(storageKey, JSON.stringify(next))
                } catch {}
                return next
            })
        },
        []
    )
    const updateDockedCases = useCallback(
        createDockUpdater(setDockedCases, CASE_REFERENCE_DOCK_STORAGE_KEY),
        [createDockUpdater]
    )
    const updateDockedTenses = useCallback(
        createDockUpdater(setDockedTenses, VERB_TENSES_REFERENCE_DOCK_STORAGE_KEY),
        [createDockUpdater]
    )
    const pinCase = useCallback(
        (caseKey, side) => {
            updateDockedCases((current) => {
                const alreadyOnSide = current[side].includes(caseKey)
                return {
                    left: current.left.filter((key) => key !== caseKey),
                    right: current.right.filter((key) => key !== caseKey),
                    [side]: alreadyOnSide
                        ? current[side].filter((key) => key !== caseKey)
                        : [...current[side], caseKey],
                }
            })
        },
        [updateDockedCases]
    )
    const unpinCase = useCallback(
        (caseKey) =>
            updateDockedCases((current) => ({
                left: current.left.filter((key) => key !== caseKey),
                right: current.right.filter((key) => key !== caseKey),
            })),
        [updateDockedCases]
    )
    const pinTense = useCallback(
        (tenseId, side) => {
            updateDockedTenses((current) => {
                const alreadyOnSide = current[side].includes(tenseId)
                return {
                    left: current.left.filter((id) => id !== tenseId),
                    right: current.right.filter((id) => id !== tenseId),
                    [side]: alreadyOnSide
                        ? current[side].filter((id) => id !== tenseId)
                        : [...current[side], tenseId],
                }
            })
        },
        [updateDockedTenses]
    )
    const unpinTense = useCallback(
        (tenseId) =>
            updateDockedTenses((current) => ({
                left: current.left.filter((id) => id !== tenseId),
                right: current.right.filter((id) => id !== tenseId),
            })),
        [updateDockedTenses]
    )
    const mainScreenCovered = !!(
        overlay.casesHelp ||
        overlay.verbFormsHelp ||
        overlay.verbTensesHelp ||
        overlay.wordSearch ||
        overlay.helpHub ||
        overlay.stats ||
        overlay.changelog ||
        overlay.settings ||
        previewPackRow
    )

    return (
        <div className="app">
            <SetupScreen hidden={mainScreenCovered || screen !== "setup"} />
            <QuizScreen hidden={mainScreenCovered || screen !== "quiz"} />
            {previewPackRow && <PackPreviewScreen />}
            {overlay.packPrompt && <PackPromptOverlay heightMode="scroll" />}
            {overlay.casesHelp && <CasesHelpScreen dockedCases={dockedCases} onPinCase={pinCase} />}
            {overlay.verbFormsHelp && <VerbFormsHelpScreen />}
            {overlay.verbTensesHelp && (
                <VerbTensesHelpScreen dockedTenses={dockedTenses} onPinTense={pinTense} />
            )}
            {overlay.wordSearch && <WordSearchScreen />}
            {overlay.helpHub && <HelpHubScreen />}
            {overlay.vocabRound && <VocabRoundSummaryOverlay />}
            {overlay.stats && <StatsScreen />}
            {overlay.changelog && <ChangelogScreen />}
            {overlay.settings && <SettingsScreen />}
            <div className="reference-docks">
                <CaseReferenceDock dockedCases={dockedCases} onUnpin={unpinCase} />
                <VerbTensesReferenceDock dockedTenses={dockedTenses} onUnpin={unpinTense} />
            </div>
            <ReferenceDockConfigurator
                dockedCases={dockedCases}
                dockedTenses={dockedTenses}
                onPinCase={pinCase}
                onPinTense={pinTense}
                onUnpinCase={unpinCase}
                onUnpinTense={unpinTense}
            />
            <QuizBottomBar />
        </div>
    )
}

function AppRuntime() {
    useTrainerKeyboardShortcuts()
    useIosDocumentScrollLock()
    useStandaloneAppHeight()

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
    }, [])

    return (
        <TrainerAppProvider>
            <AppRuntime />
        </TrainerAppProvider>
    )
}

mutateEngine((e) => {
    e.wordStats = loadPersistedWordStats()
})
recordAppVisit()
postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 1 })

const rootEl = document.getElementById("root")
if (rootEl) {
    createRoot(rootEl).render(<App />)
}
