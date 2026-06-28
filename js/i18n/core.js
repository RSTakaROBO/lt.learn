import { STR } from "./strings-ru.js"

/** Подстановка {name} в шаблоне. */
export function fmt(template, vars) {
    if (template == null) return ""
    let s = String(template)
    if (!vars) return s
    return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

export function caseRu(key) {
    const c = STR.cases?.[key]
    return typeof c === "string" ? c : key
}

export function ruPlural(count, one, few, many) {
    const n = Math.abs(Math.trunc(Number(count) || 0))
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
    return many
}
