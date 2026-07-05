import { useRef } from "react"
import { useSelector } from "react-redux"

import { APP_VERSION } from "js/app-version.js"
import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { useAutoFocusOnOpen } from "src/hooks/useAutoFocusOnOpen.js"

export function ChangelogScreen({ heightMode = "fill" } = {}) {
    const dispatch = useTrainerDispatch()
    const open = useSelector((s) => s.trainer.overlay.changelog)
    const closeButtonRef = useRef(null)

    useAutoFocusOnOpen(closeButtonRef, open)

    return (
        <AppFlowScreen
            id="changelog-shell"
            heightMode={heightMode}
            className={["changelog-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="changelog"
                className="app-screen__panel widget panel"
                aria-labelledby="changelog-title"
            >
                <h2 id="changelog-title" tabIndex={-1}>
                    {STR.changelog.title}
                </h2>
                <div className="app-screen__body changelog-body">
                    <header className="changelog-version">
                        <span className="changelog-version__label">{STR.changelog.version}</span>
                        <strong>{APP_VERSION}</strong>
                    </header>
                    <div className="changelog-list">
                        {STR.changelog.current.map((item) => (
                            <article className="changelog-item" key={item.title}>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                    <header className="changelog-version changelog-version--previous">
                        <span className="changelog-version__label">{STR.changelog.version}</span>
                        <strong>{STR.changelog.previousVersion}</strong>
                    </header>
                    <div className="changelog-list">
                        {STR.changelog.previous.map((item) => (
                            <article className="changelog-item" key={item.title}>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <div className="app-screen__footer actions app-screen__footer--single">
                    <Button
                        ref={closeButtonRef}
                        variant="primary"
                        className="stats-close-btn"
                        onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "changelog" })}
                    >
                        {STR.changelog.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
