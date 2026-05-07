import { useEffect } from "react"
import { useSelector } from "react-redux"

import { STR } from "../../../../js/i18n/strings-ru.js"
import { AppModalOverlay } from "../../../components/layout/AppModalOverlay.jsx"
import { Button } from "../../../components/ui/Button.jsx"
import { useVocabRoundSummaryActions } from "../../../hooks/useVocabRoundSummaryActions.js"

/**
 * Итог раунда «Слова».
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function VocabRoundSummaryOverlay({ heightMode = "fill" } = {}) {
    const open = useSelector((s) => s.trainer.overlay.vocabRound)
    const snap = useSelector((s) => s.trainer.vocabRoundSummary)
    const { closeToSetup, repeatRound } = useVocabRoundSummaryActions()

    const VR = STR.vocabRound

    useEffect(() => {
        if (!open) return
        requestAnimationFrame(() =>
            document.getElementById("btn-vocab-round-summary-repeat")?.focus()
        )
    }, [open])

    return (
        <AppModalOverlay
            id="vocab-round-summary-overlay"
            open={open}
            ariaLabelledBy="vocab-round-summary-title"
            heightMode={heightMode}
            shellClassName="vocab-round-summary-overlay"
            panelClassName="vocab-round-summary-panel"
            onBackdropClick={closeToSetup}
            title={<h2 id="vocab-round-summary-title">{VR.summaryTitle}</h2>}
            footer={
                <div className="app-screen__footer actions vocab-round-summary-actions">
                    <Button
                        type="button"
                        id="btn-vocab-round-summary-repeat"
                        className="stats-close-btn"
                        onClick={repeatRound}
                    >
                        {VR.repeat}
                    </Button>
                    <Button
                        variant="primary"
                        type="button"
                        id="btn-vocab-round-summary-ok"
                        className="stats-close-btn"
                        onClick={closeToSetup}
                    >
                        {VR.ok}
                    </Button>
                </div>
            }
        >
            <div className="app-screen__body app-screen__body--nested">
                {snap ? (
                    <div className="vocab-round-summary-body">
                        <div className="vocab-round-summary-stats-card" aria-live="polite">
                            <div className="vocab-round-summary-stat-row">
                                <span className="vocab-round-summary-stat-label">
                                    {VR.statAccuracy}
                                </span>
                                <div className="vocab-round-summary-stat-val">
                                    {snap.accuracyPct == null ? (
                                        <span className="vocab-round-summary-stat-num">
                                            {STR.quiz.emDash}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="vocab-round-summary-stat-num vocab-round-summary-stat-num--accent">
                                                {snap.accuracyPct}
                                            </span>
                                            <span
                                                className="vocab-round-summary-stat-unit"
                                                aria-hidden="true"
                                            >
                                                {VR.percentUnit}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="vocab-round-summary-stat-row">
                                <span className="vocab-round-summary-stat-label">
                                    {VR.statMaxStreak}
                                </span>
                                <div className="vocab-round-summary-stat-val">
                                    <span className="vocab-round-summary-stat-num vocab-round-summary-stat-num--accent">
                                        {snap.maxStreak}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="vocab-round-summary-section">
                            <p className="vocab-round-summary-section-title">{VR.sectionHard}</p>
                            {snap.topHard.length === 0 ? (
                                <p className="vocab-round-summary-empty sub">{VR.noWrongWords}</p>
                            ) : (
                                <div className="vocab-round-summary-table-scroll">
                                    <table className="vocab-round-summary-table">
                                        <caption className="sr-only">{VR.tableCaption}</caption>
                                        <thead>
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="vocab-round-summary-th vocab-round-summary-th--num"
                                                >
                                                    {VR.thNum}
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="vocab-round-summary-th vocab-round-summary-th--word"
                                                >
                                                    {VR.thWord}
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="vocab-round-summary-th vocab-round-summary-th--err"
                                                >
                                                    {VR.thErr}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {snap.topHard.map((x, i) => (
                                                <tr key={x.lemma}>
                                                    <td className="vocab-round-summary-td vocab-round-summary-td--num">
                                                        {i + 1}
                                                    </td>
                                                    <td
                                                        className="vocab-round-summary-td vocab-round-summary-td--word"
                                                        lang="lt"
                                                    >
                                                        {x.lemma}
                                                    </td>
                                                    <td className="vocab-round-summary-td vocab-round-summary-td--err">
                                                        {x.wrong}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </AppModalOverlay>
    )
}
