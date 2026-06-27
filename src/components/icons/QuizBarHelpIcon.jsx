import { QuizBarSvg } from "src/components/icons/QuizBarSvg.jsx"

export function QuizBarHelpIcon({ className }) {
    return (
        <QuizBarSvg className={className}>
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 5.5c2.3 0 4.9.45 7.5 2.2v11c-2.6-1.75-5.2-2.2-7.5-2.2V5.5ZM19.5 5.5c-2.3 0-4.9.45-7.5 2.2v11c2.6-1.75 5.2-2.2 7.5-2.2V5.5ZM12 7.7v11"
            />
        </QuizBarSvg>
    )
}
