import { QuizBarSvg } from "src/components/icons/QuizBarSvg.jsx"

export function QuizBarSearchIcon({ className }) {
    return (
        <QuizBarSvg className={className}>
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L20 20"
            />
        </QuizBarSvg>
    )
}
