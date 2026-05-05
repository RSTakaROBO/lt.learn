import {
    QuizBarHelpIcon,
    QuizBarHomeIcon,
    QuizBarSettingsIcon,
    QuizBarStatsIcon,
} from "../icons/index.js"
import { Button } from "../ui/Button.jsx"
import { useTrainerApp } from "../../context/TrainerAppContext.jsx"
import { handleQuizBarHomeClick } from "../../../js/trainer-quiz-bar.js"
import { STR } from "../../../js/i18n/strings-ru.js"

function barBtnClass(active) {
    return active ? "quiz-bar-btn quiz-bar-btn--active" : "quiz-bar-btn"
}

/** Нижняя панель: статистика, меню, справка, настройки. */
export function QuizBottomBar() {
    const [state, dispatch] = useTrainerApp()
    const { stats, helpHub, settings } = state.overlay
    const homeActive = !stats && !helpHub && !settings

    return (
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
                    id="btn-stats"
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
                    id="btn-back-setup"
                    className={barBtnClass(homeActive)}
                    aria-label={STR.bottomBar.menuAria}
                    aria-current={homeActive ? "page" : undefined}
                    onClick={handleQuizBarHomeClick}
                >
                    <QuizBarHomeIcon />
                    <span className="quiz-bar-label">{STR.bottomBar.menu}</span>
                </Button>
                <Button
                    variant="quizBar"
                    type="button"
                    id="btn-help-hub"
                    className={barBtnClass(helpHub)}
                    aria-label={STR.bottomBar.helpAria}
                    aria-current={helpHub ? "page" : undefined}
                    onClick={() => dispatch({ type: "OVERLAY_OPEN", name: "helpHub" })}
                >
                    <QuizBarHelpIcon />
                    <span className="quiz-bar-label">{STR.bottomBar.help}</span>
                </Button>
                <Button
                    variant="quizBar"
                    type="button"
                    id="btn-settings"
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
    )
}
