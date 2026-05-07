import "./PackCardPreviewButton.css"

/**
 * @param {{
 *   packId: string;
 *   ariaLabel: string;
 *   onClick: import("react").MouseEventHandler<HTMLButtonElement>;
 * }} props
 */
export function PackCardPreviewButton({ packId, ariaLabel, onClick }) {
    return (
        <div className="pack-card-preview-slot">
            <button
                type="button"
                className="pack-card-preview-btn"
                data-preview-pack-id={packId}
                aria-label={ariaLabel}
                onClick={onClick}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>
        </div>
    )
}
