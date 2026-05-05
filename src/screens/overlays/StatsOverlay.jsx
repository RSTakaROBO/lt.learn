import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { STR } from "../../../js/i18n/strings-ru.js";
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useTrainerDispatch } from "../../context/TrainerAppContext.jsx";
import {
  aggregateWordStatsTotals,
  buildSortedWordStatRows,
} from "../../utils/wordStatsView.js";

/**
 * Статистика по словам: обычный экран в потоке приложения (как мастер / квиз).
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function StatsOverlay({ heightMode = "fill" } = {}) {
  const dispatch = useTrainerDispatch();
  const open = useSelector((s) => s.trainer.overlay.stats);
  const wordStats = useSelector((s) => s.trainer.engine.wordStats);

  const { correct, wrong, skipped } = useMemo(
    () => aggregateWordStatsTotals(wordStats),
    [open, wordStats],
  );
  const rows = useMemo(() => buildSortedWordStatRows(wordStats), [open, wordStats]);
  const graded = correct + wrong;
  const pctLabel =
    graded > 0 ? `${Math.round((100 * correct) / graded)}%` : STR.quiz.emDash;

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => document.getElementById("btn-stats-close")?.focus());
  }, [open]);

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
            <div className="stats-summary-grid">
              <div className="stats-sum-cell">
                <span className="stats-sum-label">{STR.stats.sumCorrect}</span>
                <span className="stats-sum-val">{correct}</span>
              </div>
              <div className="stats-sum-cell">
                <span className="stats-sum-label">{STR.stats.sumWrong}</span>
                <span className="stats-sum-val">{wrong}</span>
              </div>
              <div className="stats-sum-cell">
                <span className="stats-sum-label">{STR.stats.sumSkipped}</span>
                <span className="stats-sum-val">{skipped}</span>
              </div>
              <div className="stats-sum-cell">
                <span className="stats-sum-label">{STR.stats.sumPercent}</span>
                <span className="stats-sum-val">{pctLabel}</span>
              </div>
            </div>
          </div>
          <div className="stats-table-wrap">
            {rows.length === 0 ? (
              <p className="stats-empty">{STR.stats.empty}</p>
            ) : (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th scope="col">{STR.stats.thWord}</th>
                    <th scope="col">{STR.stats.thCorrect}</th>
                    <th scope="col">{STR.stats.thWrong}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.lemma}>
                      <td lang="lt">{r.lemma}</td>
                      <td>{r.correct}</td>
                      <td>{r.wrong}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="app-screen__footer actions app-screen__footer--single">
          <Button
            variant="primary"
            id="btn-stats-close"
            className="stats-close-btn"
            onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "stats" })}
          >
            {STR.stats.close}
          </Button>
        </div>
      </section>
    </AppFlowScreen>
  );
}
