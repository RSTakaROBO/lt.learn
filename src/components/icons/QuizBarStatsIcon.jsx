import { QuizBarSvg } from "./QuizBarSvg.jsx";

export function QuizBarStatsIcon({ className }) {
  return (
    <QuizBarSvg className={className}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M6 20V14M12 20V8M18 20v-9"
      />
    </QuizBarSvg>
  );
}
