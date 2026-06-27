import { STR } from "js/i18n/strings-ru.js"

export function VocabRoundExcludeButton({ onClick }) {
    return (
        <button
            type="button"
            className="vocab-round-exclude-btn"
            aria-label={STR.vocabRound.excludeWordAria}
            title={STR.vocabRound.excludeWordTitle}
            onClick={(e) => {
                e.stopPropagation()
                onClick?.()
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <circle cx="12" cy="12" r="8.25" />
                <path d="m7.2 16.8 9.6-9.6" />
            </svg>
        </button>
    )
}
