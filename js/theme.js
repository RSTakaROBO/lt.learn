import { STORAGE_KEYS, THEME_IDS } from "./config.js";
import { els } from "./dom.js";

export function loadTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr && THEME_IDS.includes(attr)) return attr;
  try {
    const t = localStorage.getItem(STORAGE_KEYS.theme);
    if (t && THEME_IDS.includes(t)) return t;
  } catch {
    /* ignore */
  }
  return "default";
}

export function applyTheme(themeId) {
  const id = THEME_IDS.includes(themeId) ? themeId : "default";
  if (id === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", id);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.theme, id);
  } catch {
    /* ignore */
  }
  updateThemeColorMeta();
}

export function updateThemeColorMeta() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (bg) meta.setAttribute("content", bg);
}

export function syncThemeRadiosFromDom() {
  if (!els.themePicker) return;
  const id = loadTheme();
  const input = els.themePicker.querySelector(`input[name="app-theme"][value="${id}"]`);
  if (input) input.checked = true;
}
