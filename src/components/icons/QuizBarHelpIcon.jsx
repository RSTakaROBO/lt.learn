import { QuizBarSvg } from "./QuizBarSvg.jsx";

export function QuizBarHelpIcon({ className }) {
  return (
    <QuizBarSvg className={className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M9.75 9.75a2.25 2.25 0 1 1 3 2.13c-.56.49-.89 1-.89 1.62V14M12 17h.01"
      />
    </QuizBarSvg>
  );
}
