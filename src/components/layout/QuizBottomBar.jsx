import { useEffect, useState } from "react"

import {
    QuizBarHelpIcon,
    QuizBarHomeIcon,
    QuizBarSearchIcon,
    QuizBarSettingsIcon,
    QuizBarStatsIcon,
} from "src/components/icons/index.js"
import { ConfirmDialogOverlay } from "src/components/ui/ConfirmDialogOverlay.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"
import { STR } from "js/i18n/strings-ru.js"
import { resetVocabCorrectStreak } from "js/quiz.js"
import { mutateEngine } from "js/trainer-ui-state.js"
import { clearVocabRound } from "js/vocab-round.js"

function barBtnClass(active) {
    return active ? "quiz-bar-btn quiz-bar-btn--active" : "quiz-bar-btn"
}

/** Нижняя панель: статистика, меню, справка, настройки. */
export function QuizBottomBar() {
    const [state, dispatch] = useTrainerApp()
    const { casesHelp, helpHub, settings, stats, verbFormsHelp, verbTensesHelp, wordSearch } =
        state.overlay
    const { screen, engine } = state
    const [menuQuitConfirmOpen, setMenuQuitConfirmOpen] = useState(false)

    const helpActive = helpHub || casesHelp || verbFormsHelp || verbTensesHelp
    const homeActive = !stats && !helpActive && !settings && !wordSearch

    useEffect(() => {
        if (!menuQuitConfirmOpen) return
        function onKeyDown(e) {
            if (e.key !== "Escape") return
            e.preventDefault()
            e.stopPropagation()
            setMenuQuitConfirmOpen(false)
        }
        document.addEventListener("keydown", onKeyDown, true)
        return () => document.removeEventListener("keydown", onKeyDown, true)
    }, [menuQuitConfirmOpen])

    function exitToSetupMenu() {
        dispatch({ type: "OVERLAY_CLOSE", name: "stats" })
        dispatch({ type: "OVERLAY_CLOSE", name: "changelog" })
        dispatch({ type: "OVERLAY_CLOSE", name: "settings" })
        dispatch({ type: "OVERLAY_CLOSE", name: "packPrompt" })
        dispatch({ type: "OVERLAY_CLOSE", name: "helpHub" })
        dispatch({ type: "OVERLAY_CLOSE", name: "wordSearch" })
        dispatch({ type: "OVERLAY_CLOSE", name: "vocabRound" })
        clearVocabRound()

        dispatch({ type: "SCREEN_SET", screen: "setup" })
        dispatch({ type: "WIZARD_SET_STEP", step: 1 })
        dispatch({ type: "WIZARD_CLEAR_STATUS" })
        dispatch({ type: "QUIZ_CLEAR_FEEDBACK" })
        resetVocabCorrectStreak()
        mutateEngine((e) => {
            e.currentTask = null
            e.shownLemmaHistory = []
        })
    }

    const handleHomeClick = () => {
        if (casesHelp) {
            dispatch({ type: "OVERLAY_CLOSE", name: "casesHelp" })
            return
        }

        if (verbFormsHelp) {
            dispatch({ type: "OVERLAY_CLOSE", name: "verbFormsHelp" })
            return
        }

        if (verbTensesHelp) {
            dispatch({ type: "OVERLAY_CLOSE", name: "verbTensesHelp" })
            return
        }

        if (wordSearch) {
            dispatch({ type: "OVERLAY_CLOSE", name: "wordSearch" })
            return
        }

        if (screen === "quiz" && (engine.currentTask != null || engine.vocabRound != null)) {
            setMenuQuitConfirmOpen(true)
            return
        }

        exitToSetupMenu()
    }

    return (
        <>
            <nav
                id="quiz-bottom-bar"
                className="quiz-bottom-bar"
                role="toolbar"
                aria-label={STR.bottomBar.toolbarAria}
            >
                <div className="quiz-bottom-bar-inner">
                    <Button
                        variant="quizBar"
                        type="button"
                        className={barBtnClass(wordSearch)}
                        aria-label={STR.bottomBar.searchAria}
                        aria-current={wordSearch ? "page" : undefined}
                        onClick={() => dispatch({ type: "OVERLAY_OPEN", name: "wordSearch" })}
                    >
                        <QuizBarSearchIcon />
                        <span className="quiz-bar-label">{STR.bottomBar.search}</span>
                    </Button>
                    <Button
                        variant="quizBar"
                        type="button"
                        className={barBtnClass(stats)}
                        aria-label={STR.bottomBar.statsAria}
                        aria-current={stats ? "page" : undefined}
                        onClick={() => dispatch({ type: "OVERLAY_OPEN", name: "stats" })}
                    >
                        <QuizBarStatsIcon />
                        <span className="quiz-bar-label">{STR.bottomBar.stats}</span>
                    </Button>
                    <Button
                        variant="quizBar"
                        type="button"
                        className={barBtnClass(homeActive)}
                        aria-label={STR.bottomBar.menuAria}
                        aria-current={homeActive ? "page" : undefined}
                        onClick={handleHomeClick}
                    >
                        <QuizBarHomeIcon />
                        <span className="quiz-bar-label">{STR.bottomBar.menu}</span>
                    </Button>
                    <Button
                        variant="quizBar"
                        type="button"
                        className={barBtnClass(helpActive)}
                        aria-label={STR.bottomBar.helpAria}
                        aria-current={helpActive ? "page" : undefined}
                        onClick={() => dispatch({ type: "OVERLAY_OPEN", name: "helpHub" })}
                    >
                        <QuizBarHelpIcon />
                        <span className="quiz-bar-label">{STR.bottomBar.help}</span>
                    </Button>
                    <Button
                        variant="quizBar"
                        type="button"
                        className={barBtnClass(settings)}
                        aria-label={STR.bottomBar.settingsAria}
                        aria-current={settings ? "page" : undefined}
                        onClick={() => dispatch({ type: "OVERLAY_OPEN", name: "settings" })}
                    >
                        <QuizBarSettingsIcon />
                        <span className="quiz-bar-label">{STR.bottomBar.settings}</span>
                    </Button>
                </div>
            </nav>
            <ConfirmDialogOverlay
                id="menu-quit-training-confirm"
                open={menuQuitConfirmOpen}
                title={STR.confirm.leaveTrainingTitle}
                message={STR.confirm.leaveTrainingMessage}
                cancelLabel={STR.confirm.cancel}
                confirmLabel={STR.confirm.leaveTrainingConfirm}
                onCancel={() => setMenuQuitConfirmOpen(false)}
                onConfirm={() => {
                    setMenuQuitConfirmOpen(false)
                    exitToSetupMenu()
                }}
            />
        </>
    )
}
