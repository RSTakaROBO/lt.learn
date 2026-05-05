import { fmt } from "../../../js/i18n/core.js";
import { STR } from "../../../js/i18n/strings-ru.js";
import { byId } from "../../../js/dom-ids.js";
import {
  loadSelectedPacks,
  removeCustomPackById,
  saveSelectedPacks,
} from "../../../js/storage.js";
import { useManifestPacks } from "../../context/ManifestPacksContext.jsx";
import { CheckboxButton } from "../ui/CheckboxButton.jsx";
import { ListHolder } from "../ui/ListHolder.jsx";
import { PackCardDeleteButton } from "./PackCardDeleteButton.jsx";

/**
 * @param {{ scrollWell?: boolean }} props
 */
export function WizardPackList({ scrollWell = true }) {
  const { packRows, selectedIds, togglePack, reloadManifestPacks } = useManifestPacks();

  async function onDeleteCustomPack(e, packId) {
    e.preventDefault();
    e.stopPropagation();
    removeCustomPackById(packId);
    const sel = loadSelectedPacks();
    if (sel && sel.length) saveSelectedPacks(sel.filter((x) => x !== packId));
    const st = byId("pack-step-status");
    if (st) st.textContent = "";
    const ok = await reloadManifestPacks();
    if (ok && st) st.textContent = STR.events.customPackRemoved;
  }

  return (
    <ListHolder id="pack-list" scrollWell={scrollWell}>
      {packRows.map((row) => (
        <CheckboxButton
          key={row.pack.id}
          id={row.safeInputId}
          value={row.pack.id}
          title={row.title}
          meta={row.wordCountLabel}
          metaClassName="pack-word-count"
          className={row.pack.custom ? "pack-card--custom-user" : undefined}
          checked={selectedIds.includes(row.pack.id)}
          onChange={(e) => togglePack(row.pack.id, e.target.checked)}
          faceBeforeTick={
            row.pack.custom ? (
              <PackCardDeleteButton
                packId={row.pack.id}
                ariaLabel={fmt(STR.errors.deletePackAria, { title: row.title })}
                onClick={(e) => onDeleteCustomPack(e, row.pack.id)}
              />
            ) : undefined
          }
        />
      ))}
    </ListHolder>
  );
}
