import { CASE_ORDER } from "./config.js";

export function isWordEntryComplete(w) {
  if (!w || typeof w.nominative !== "string") return false;
  for (const { key } of CASE_ORDER) {
    if (typeof w[key] !== "string" || !w[key]) return false;
  }
  return true;
}

export function countValidWordsInData(data) {
  const words = data.words;
  if (!Array.isArray(words)) return 0;
  let n = 0;
  for (const w of words) {
    if (isWordEntryComplete(w)) n++;
  }
  return n;
}
