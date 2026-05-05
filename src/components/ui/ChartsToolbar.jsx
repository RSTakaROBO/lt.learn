import { forwardRef } from "react"
import { STR } from "../../../js/i18n/strings-ru.js"
import { Button } from "./Button.jsx"

const CHARS = ["ą", "č", "ę", "ė", "į", "š", "ų", "ū", "ž"]

/** Панель литовских букв над полем ввода (два места: падежи и вокаб-хардкор). */
export const ChartsToolbar = forwardRef(function ChartsToolbar(
    { id, className = "lt-chars", onClick },
    ref
) {
    return (
        <div
            ref={ref}
            id={id}
            className={className}
            role="toolbar"
            aria-label={STR.quiz.ltCharsToolbarAria}
            onClick={onClick}
        >
            {CHARS.map((ch) => (
                <Button variant="charTile" key={ch} type="button" data-char={ch} title={ch}>
                    {ch}
                </Button>
            ))}
        </div>
    )
})
