import { forwardRef } from "react";

/**
 * Универсальный контейнер для списков карточек: класс `pack-card-list` из CSS; опционально `.wizard-scroll-well`.
 *
 * @param {{
 *   id?: string;
 *   className?: string;
 *   scrollWell?: boolean;
 *   children?: import("react").ReactNode;
 * } & import("react").HTMLAttributes<HTMLDivElement>} props
 */
export const ListHolder = forwardRef(function ListHolder(
  { id, className, scrollWell = false, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      id={id}
      className={["pack-card-list", scrollWell && "wizard-scroll-well", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
});
