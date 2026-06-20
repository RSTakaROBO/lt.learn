import { useRef } from "react"
import { useSelector } from "react-redux"

import { STR } from "js/i18n/strings-ru.js"
import { getVocabRoundSummarySnapshot } from "js/vocab-round.js"
import { AppModalOverlay } from "src/components/layout/AppModalOverlay.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { DataTable } from "src/components/ui/DataTable.jsx"
import { useAutoFocusOnOpen } from "src/hooks/useAutoFocusOnOpen.js"
import { useVocabRoundSummaryActions } from "src/hooks/useVocabRoundSummaryActions.js"

/**
 * Итог раунда «Слова».
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function VocabRoundSummaryOverlay({ heightMode = "fill" } = {}) {
    const open = useSelector((s) => s.trainer.overlay.vocabRound)
    const snap = useSelector((s) => s.trainer.vocabRoundSummary)
    const { closeToSetup, repeatRound } = useVocabRoundSummaryActions()
    const displaySnap = snap ?? (open ? getVocabRoundSummarySnapshot() : null)
    const repeatButtonRef = useRef(null)

    const VR = STR.vocabRound

    useAutoFocusOnOpen(repeatButtonRef, open)

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
                        ref={repeatButtonRef}
                        type="button"
                        className="stats-close-btn"
                        onClick={repeatRound}
                    >
                        {VR.repeat}
                    </Button>
                    <Button
                        variant="primary"
                        type="button"
                        className="stats-close-btn"
                        onClick={closeToSetup}
                    >
                        {VR.ok}
                    </Button>
                </div>
            }
        >
            <div className="app-screen__body app-screen__body--nested">
                {displaySnap ? (
                    <div className="vocab-round-summary-body u-scrollbar-hidden">
                        <div className="vocab-round-summary-stats-card" aria-live="polite">
                            <div className="vocab-round-summary-hero-stat">
                                <span className="vocab-round-summary-section-title">
                                    {VR.statAccuracy}
                                </span>
                                <div className="vocab-round-summary-stat-val vocab-round-summary-stat-val--hero">
                                    <span className="vocab-round-summary-stat-num vocab-round-summary-stat-num--hero vocab-round-summary-stat-num--accent">
                                        {displaySnap.accuracyPct == null
                                            ? STR.quiz.emDash
                                            : displaySnap.accuracyPct}
                                    </span>
                                    {displaySnap.accuracyPct == null ? null : (
                                        <span
                                            className="vocab-round-summary-stat-unit"
                                            aria-hidden="true"
                                        >
                                            {VR.percentUnit}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="vocab-round-summary-stat-grid">
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {VR.statAnswered}
                                    </span>
                                    <strong>{displaySnap.stages}</strong>
                                </div>
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {VR.statMaxStreak}
                                    </span>
                                    <strong>×{displaySnap.maxStreak}</strong>
                                </div>
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {VR.statCorrect}
                                    </span>
                                    <strong className="vocab-round-summary-stat-ok">
                                        {displaySnap.correct}
                                    </strong>
                                </div>
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {VR.statWrong}
                                    </span>
                                    <strong className="vocab-round-summary-stat-bad">
                                        {displaySnap.wrong}
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div className="vocab-round-summary-section vocab-round-summary-section--hard">
                            <p className="vocab-round-summary-section-title">{VR.sectionHard}</p>
                            {displaySnap.topHard.length === 0 ? (
                                <p className="vocab-round-summary-empty sub">{VR.noWrongWords}</p>
                            ) : (
                                <DataTable
                                    caption={VR.tableCaption}
                                    columns={[
                                        {
                                            key: "lemma",
                                            header: VR.thWord,
                                            highlight: true,
                                            lang: "lt",
                                        },
                                        { key: "wrong", header: VR.thErr, narrow: true },
                                    ]}
                                    rows={displaySnap.topHard}
                                    getRowKey={(row) => row.lemma}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="vocab-round-summary-body u-scrollbar-hidden">
                        <p className="vocab-round-summary-empty sub">{VR.noSummaryData}</p>
                    </div>
                )}
            </div>
        </AppModalOverlay>
    )
}
