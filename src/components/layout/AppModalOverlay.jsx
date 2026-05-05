import { forwardRef } from "react"

/**
 * Модалка: полупрозрачный фон, карточка по центру экрана (см. css/app-screen.css).
 *
 * @param {{
 *   id: string;
 *   open: boolean;
 *   ariaLabelledBy: string;
 *   heightMode?: "fill"|"scroll";
 *   shellClassName?: string;
 *   panelClassName?: string;
 *   title: import("react").ReactNode;
 *   footer: import("react").ReactNode;
 *   children: import("react").ReactNode;
 *   onBackdropClick?: () => void;
 * }} props
 */
export const AppModalOverlay = forwardRef(function AppModalOverlay(
    {
        id,
        open,
        ariaLabelledBy,
        heightMode = "fill",
        shellClassName,
        panelClassName,
        title,
        footer,
        children,
        onBackdropClick,
    },
    ref
) {
    return (
        <div
            ref={ref}
            id={id}
            className={[
                "app-screen app-screen--modal",
                !open && "hidden",
                shellClassName,
                heightMode === "scroll" && "app-screen--height-scroll",
            ]
                .filter(Boolean)
                .join(" ")}
            onClick={
                onBackdropClick
                    ? (e) => {
                          if (e.target === e.currentTarget) onBackdropClick()
                      }
                    : undefined
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
        >
            <div
                className={["app-screen__panel widget panel", panelClassName]
                    .filter(Boolean)
                    .join(" ")}
            >
                {title}
                {children}
                {footer}
            </div>
        </div>
    )
})
