import { STR } from "./strings-ru.js";

/** Подстановка {name} в шаблоне. */
export function fmt(template, vars) {
  if (template == null) return "";
  let s = String(template);
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Доступ по пути «a.b.c» к вложенному объекту STR. */
export function strPath(path) {
  return path.split(".").reduce((o, k) => (o != null && o[k] !== undefined ? o[k] : undefined), STR);
}

export function caseRu(key) {
  const c = STR.cases?.[key];
  return typeof c === "string" ? c : key;
}
