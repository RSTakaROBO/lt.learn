import { forwardRef } from "react"

/**
 * Нейтральная группа вариантов без визуальной обвязки списка карточек.
 *
 * @param {{
 *   id?: string;
 *   className?: string;
 *   children?: import("react").ReactNode;
 * } & import("react").HTMLAttributes<HTMLDivElement>} props
 */
export const ChoiceGroup = forwardRef(function ChoiceGroup(
    { id, className, children, role = "group", ...rest },
    ref
) {
    return (
        <div ref={ref} id={id} className={className} role={role} {...rest}>
            {children}
        </div>
    )
})
