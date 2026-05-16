/**
 * Крупная кнопка-чекбокс (карточка): `.pack-card.pack-card--flat` — без объёмной тени у нижних кнопок.
 * Универсальный вариант для мастера и настроек. Список наборов — {@link WizardPackList} (`components/pack-card`).
 *
 * @param {{
 *   id: string;
 *   title: string;
 *   meta?: import("react").ReactNode;
 *   className?: string;
 *   checked?: boolean;
 *   defaultChecked?: boolean;
 *   type?: "checkbox" | "radio";
 *   name?: string;
 *   value?: string;
 *   onChange?: import("react").ChangeEventHandler<HTMLInputElement>;
 *   inputRef?: import("react").Ref<HTMLInputElement>;
 *   faceBeforeTick?: import("react").ReactNode;
 *   metaClassName?: string;
 *   disabled?: boolean;
 * }} props
 */
export function CheckboxButton({
    id,
    title,
    meta,
    metaClassName,
    className,
    checked,
    defaultChecked,
    type = "checkbox",
    name,
    value,
    onChange,
    inputRef,
    faceBeforeTick,
    disabled = false,
}) {
    const controlled = checked !== undefined
    return (
        <label
            className={[
                "pack-card",
                "pack-card--flat",
                disabled && "pack-card--disabled",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            htmlFor={id}
            aria-disabled={disabled ? "true" : undefined}
        >
            <input
                ref={inputRef}
                type={type}
                id={id}
                name={name}
                className="pack-card-input sr-only"
                value={value}
                disabled={disabled}
                {...(controlled ? { checked, onChange } : { defaultChecked, onChange })}
            />
            <div className="pack-card-face">
                <div className="pack-card-main">
                    <div className="pack-card-title">{title}</div>
                    <div className={["pack-card-meta", metaClassName].filter(Boolean).join(" ")}>
                        {meta ?? null}
                    </div>
                </div>
                {faceBeforeTick}
                <span className="pack-card-tick" aria-hidden="true" />
            </div>
        </label>
    )
}
