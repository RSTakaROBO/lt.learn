import { forwardRef } from "react"
import { LT_DIACRITIC_TOOLBAR_CHARS } from "js/lt-diacritic-toolbar-chars.js"
import { STR } from "js/i18n/strings-ru.js"
import { Button } from "src/components/ui/Button.jsx"

/** Панель литовских букв над полем ввода (два места: падежи и вокаб-хардкор). */
export const ChartsToolbar = forwardRef(function ChartsToolbar(
    { id, className = "lt-chars", onClick, onPointerDown },
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
            onPointerDown={onPointerDown}
        >
            {LT_DIACRITIC_TOOLBAR_CHARS.map((ch) => (
                <Button variant="charTile" key={ch} type="button" data-char={ch} title={ch}>
                    {ch}
                </Button>
            ))}
        </div>
    )
})
