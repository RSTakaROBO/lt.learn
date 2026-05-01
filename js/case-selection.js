import { els } from "./dom.js";

export function getCheckedCaseKeys() {
  return Array.from(els.caseCheckboxes.querySelectorAll('input[type="checkbox"]:checked')).map(
    (input) => input.value,
  );
}
