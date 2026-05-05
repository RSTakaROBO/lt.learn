/** Общие размеры и `viewBox` для иконок нижней панели квиза. */
export function QuizBarSvg({ className = "quiz-bar-icon", children }) {
    return (
        <svg className={className} viewBox="0 0 24 24" width={26} height={26} aria-hidden>
            {children}
        </svg>
    )
}
