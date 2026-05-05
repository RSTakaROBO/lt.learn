/**
 * Слот с иконкой «корзина» для удаления пользовательского набора (внутри .pack-card-face).
 * Стили — только в этом файле.
 */
import "./PackCardDeleteButton.css"

/**
 * @param {{
 *   packId: string;
 *   ariaLabel: string;
 *   onClick: import("react").MouseEventHandler<HTMLButtonElement>;
 * }} props
 */
export function PackCardDeleteButton({ packId, ariaLabel, onClick }) {
    return (
        <div className="pack-card-delete-slot">
            <button
                type="button"
                className="pack-card-delete-btn"
                data-delete-pack-id={packId}
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
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
            </button>
        </div>
    )
}
