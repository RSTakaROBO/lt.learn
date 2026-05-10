import { forwardRef } from "react"

/**
 * Оболочка полноэкранного потока внутри `.app`: `app-screen app-screen--flow` + опционально scroll-режим.
 * Корневой `id` (…-shell) — для легаси и привязки обработчиков по `id`.
 *
 * @param {{
 *   id: string;
 *   heightMode?: "fill"|"scroll";
 *   className?: string;
 *   children: import("react").ReactNode;
 * }} props
 */
export const AppFlowScreen = forwardRef(function AppFlowScreen(
    { id, heightMode = "fill", className = "", children },
    ref
) {
    return (
        <div
            ref={ref}
            id={id}
            className={[
                "app-screen app-screen--flow",
                className,
                heightMode === "scroll" && "app-screen--height-scroll",
                heightMode === "scroll" && "u-scrollbar-hidden",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    )
})
