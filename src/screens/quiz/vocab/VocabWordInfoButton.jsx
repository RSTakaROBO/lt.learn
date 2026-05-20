import { STR } from "js/i18n/strings-ru.js"

export function VocabWordInfoButton({ onClick }) {
    return (
        <button
            type="button"
            className="vocab-word-info-btn"
            aria-label={STR.wordInfo.openAria}
            title={STR.wordInfo.openTitle}
            onClick={(e) => {
                e.stopPropagation()
                onClick?.()
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M2.1 12s3.6-6.2 9.9-6.2S21.9 12 21.9 12s-3.6 6.2-9.9 6.2S2.1 12 2.1 12Z" />
                <circle cx="12" cy="12" r="3.1" />
            </svg>
        </button>
    )
}
