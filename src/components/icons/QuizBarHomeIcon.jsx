import { QuizBarSvg } from "src/components/icons/QuizBarSvg.jsx"

export function QuizBarHomeIcon({ className }) {
    return (
        <QuizBarSvg className={className}>
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1 -1.5 1.5h-4v-6h-5v6H5.5A1.5 1.5 0 0 1 4 19v-8.5z"
            />
        </QuizBarSvg>
    )
}
