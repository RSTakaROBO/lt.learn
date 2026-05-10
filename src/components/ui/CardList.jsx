import { forwardRef } from "react"

/**
 * Список карточек выбора: добавляет `pack-card-list`; опционально включает scroll-well.
 *
 * @param {{
 *   id?: string;
 *   className?: string;
 *   scrollWell?: boolean;
 *   children?: import("react").ReactNode;
 * } & import("react").HTMLAttributes<HTMLDivElement>} props
 */
export const CardList = forwardRef(function CardList(
    { id, className, scrollWell = false, children, ...rest },
    ref
) {
    return (
        <div
            ref={ref}
            id={id}
            className={[
                "pack-card-list",
                scrollWell && "wizard-scroll-well",
                scrollWell && "u-scrollbar-hidden",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...rest}
        >
            {children}
        </div>
    )
})
