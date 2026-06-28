import { fmt } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"

export function VocabRoundProgress({ progress }) {
    if (!progress || progress.total <= 0) {
        return (
            <div
                id="vocab-round-progress"
                className="vocab-round-progress hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-hidden="true"
            >
                <div className="vocab-round-progress-track" aria-hidden="true">
                    <div id="vocab-round-progress-fill" className="vocab-round-progress-fill" />
                </div>
                <span className="vocab-round-progress-count" aria-hidden="true">
                    0 {STR.confirm.finishRoundOf} 0
                </span>
            </div>
        )
    }

    return (
        <div
            id="vocab-round-progress"
            className="vocab-round-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuenow={progress.done}
            aria-valuemax={progress.total}
            aria-hidden="false"
            aria-label={fmt(STR.vocabRound.ariaProgress, {
                done: progress.done,
                total: progress.total,
            })}
        >
            <div className="vocab-round-progress-track" aria-hidden="true">
                <div
                    id="vocab-round-progress-fill"
                    className="vocab-round-progress-fill"
                    style={{ width: `${progress.pct}%` }}
                />
            </div>
            <span className="vocab-round-progress-count" aria-hidden="true">
                {progress.done} {STR.confirm.finishRoundOf} {progress.total}
            </span>
        </div>
    )
}
