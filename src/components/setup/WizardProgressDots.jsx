import { forwardRef } from "react";

/**
 * Индикатор шага мастера (кружки). Состояние шага — из глобального стейта (`TrainerAppContext`).
 *
 * @param {{ step: number; total?: number }} props
 */
export const WizardProgressDots = forwardRef(function WizardProgressDots(
  { step, total = 3 },
  ref,
) {
  const n = Math.min(total, Math.max(1, step));
  return (
    <div
      ref={ref}
      id="wizard-progress"
      className="wizard-progress"
      role="progressbar"
      aria-valuenow={n}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={["wizard-dot", i + 1 === n ? "is-active" : ""].filter(Boolean).join(" ")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
});
