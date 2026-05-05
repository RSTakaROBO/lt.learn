import { forwardRef } from "react";

/**
 * Кнопка в стилях приложения: `btn` + `primary` | `ghost`, либо спец-раскладки (нижняя панель, мастер, lt-char).
 *
 * @param {object} props
 * @param {"ghost"|"primary"|"quizBar"|"modeChoice"|"charTile"} [props.variant]
 * @param {string} [props.className]
 * @param {import("react").ButtonHTMLAttributes<HTMLButtonElement>["type"]} [props.type]
 */
export const Button = forwardRef(function Button(
  { variant = "ghost", className, type = "button", children, ...rest },
  ref,
) {
  const composed =
    variant === "quizBar"
      ? className ?? ""
      : variant === "modeChoice"
        ? ["mode-choice-btn", className].filter(Boolean).join(" ")
        : variant === "charTile"
          ? ["lt-char", className].filter(Boolean).join(" ")
          : ["btn", variant === "primary" ? "primary" : "ghost", className].filter(Boolean).join(" ");

  return (
    <button ref={ref} type={type} className={composed} {...rest}>
      {children}
    </button>
  );
});
