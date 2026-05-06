import { STORAGE_KEYS, THEME_IDS } from "./config.js"

function isValidThemeId(raw) {
    return typeof raw === "string" && THEME_IDS.includes(raw)
}

export function loadTheme() {
    try {
        const t = localStorage.getItem(STORAGE_KEYS.theme)
        return isValidThemeId(t) ? t : null
    } catch {
        return null
    }
}

export function applyTheme(themeId) {
    if (!isValidThemeId(themeId)) return
    document.documentElement.setAttribute("data-theme", themeId)
    try {
        localStorage.setItem(STORAGE_KEYS.theme, themeId)
    } catch {
        /* ignore */
    }
    updateThemeColorMeta()
}

export function updateThemeColorMeta() {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()
    if (bg) meta.setAttribute("content", bg)
}
