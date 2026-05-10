import { useMemo, useRef } from "react"
import { useSelector } from "react-redux"

import { STR } from "js/i18n/strings-ru.js"
import { clearWordStats } from "js/storage.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { TrashCanIcon } from "src/components/icons/index.js"
import { Button } from "src/components/ui/Button.jsx"
import { DataTable } from "src/components/ui/DataTable.jsx"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"
import { useAutoFocusOnOpen } from "src/hooks/useAutoFocusOnOpen.js"
import {
    aggregateWordStatsTotals,
    buildSortedWordStatRows,
} from "src/screens/stats/wordStatsView.js"

/**
 * Статистика по словам: обычный экран в потоке приложения (как мастер / квиз).
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function StatsScreen({ heightMode = "fill" } = {}) {
    const dispatch = useTrainerDispatch()
    const open = useSelector((s) => s.trainer.overlay.stats)
    const wordStats = useSelector((s) => s.trainer.engine.wordStats)
    const closeButtonRef = useRef(null)

    const { correct, wrong, skipped } = useMemo(
        () => aggregateWordStatsTotals(wordStats),
        [open, wordStats]
    )
    const rows = useMemo(() => buildSortedWordStatRows(wordStats), [open, wordStats])
    const graded = correct + wrong
    const total = correct + wrong + skipped
    const accuracyPct = graded > 0 ? Math.round((100 * correct) / graded) : null

    useAutoFocusOnOpen(closeButtonRef, open)

    return (
        <AppFlowScreen
            id="stats-overlay"
            heightMode={heightMode}
            className={["stats-shell", !open && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="stats"
                className="app-screen__panel widget panel"
                aria-labelledby="stats-title"
            >
                <h2 id="stats-title" tabIndex={-1}>
                    {STR.stats.title}
                </h2>
                <div className="app-screen__body app-screen__body--stats">
                    <div className="stats-summary">
                        <div
                            className="vocab-round-summary-stats-card stats-summary-card"
                            aria-live="polite"
                        >
                            <div className="vocab-round-summary-hero-stat">
                                <span className="vocab-round-summary-section-title">
                                    {STR.stats.sumPercent}
                                </span>
                                <div className="vocab-round-summary-stat-val vocab-round-summary-stat-val--hero">
                                    <span className="vocab-round-summary-stat-num vocab-round-summary-stat-num--hero vocab-round-summary-stat-num--accent">
                                        {accuracyPct == null ? STR.quiz.emDash : accuracyPct}
                                    </span>
                                    {accuracyPct == null ? null : (
                                        <span
                                            className="vocab-round-summary-stat-unit"
                                            aria-hidden="true"
                                        >
                                            {STR.vocabRound.percentUnit}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="vocab-round-summary-stat-grid">
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {STR.stats.sumCorrect}
                                    </span>
                                    <strong className="vocab-round-summary-stat-ok">
                                        {correct}
                                    </strong>
                                </div>
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {STR.stats.sumWrong}
                                    </span>
                                    <strong className="vocab-round-summary-stat-bad">
                                        {wrong}
                                    </strong>
                                </div>
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {STR.stats.sumSkipped}
                                    </span>
                                    <strong>{skipped}</strong>
                                </div>
                                <div className="vocab-round-summary-stat-tile">
                                    <span className="vocab-round-summary-stat-label">
                                        {STR.stats.sumTotal}
                                    </span>
                                    <strong>{total}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="stats-table-wrap u-scrollbar-hidden">
                        {rows.length === 0 ? (
                            <p className="stats-empty">{STR.stats.empty}</p>
                        ) : (
                            <DataTable
                                variant="plain"
                                caption={STR.stats.tableCaption}
                                columns={[
                                    {
                                        key: "lemma",
                                        header: STR.stats.thWord,
                                        highlight: true,
                                        lang: "lt",
                                    },
                                    { key: "correct", header: STR.stats.thCorrect, narrow: true },
                                    { key: "wrong", header: STR.stats.thWrong, narrow: true },
                                ]}
                                rows={rows}
                                getRowKey={(row) => row.lemma}
                            />
                        )}
                    </div>
                </div>
                <div className="app-screen__footer actions wizard-pack-actions stats-footer-actions">
                    <Button
                        type="button"
                        className="stats-clear-btn"
                        aria-label={STR.stats.clear}
                        title={STR.stats.clear}
                        onClick={() => {
                            if (!window.confirm(STR.stats.clearConfirm)) return
                            clearWordStats()
                        }}
                    >
                        <TrashCanIcon />
                    </Button>
                    <Button
                        ref={closeButtonRef}
                        variant="primary"
                        className="stats-close-btn"
                        onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "stats" })}
                    >
                        {STR.stats.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
