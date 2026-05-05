import { useEffect, useRef } from "react";

import { LLM_CUSTOM_PACK_PROMPT as CUSTOM_PACK_LLM_PROMPT } from "../../../js/i18n/llm-prompt-ru.js";

import { STR } from "../../../js/i18n/strings-ru.js";

import { AppModalOverlay } from "../../components/layout/AppModalOverlay.jsx";

import { Button } from "../../components/ui/Button.jsx";

import { useTrainerApp } from "../../context/TrainerAppContext.jsx";

/**
 * Окно с текстом промпта для LLM.
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function PackPromptOverlay({ heightMode = "fill" } = {}) {
  const [state, dispatch] = useTrainerApp();
  const open = state.overlay.packPrompt;
  const closePackPrompt = () => dispatch({ type: "OVERLAY_CLOSE", name: "packPrompt" });
  const copyBtnRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  useEffect(() => {
    if (!open) return;
    const ta = document.getElementById("pack-prompt-text");
    if (ta instanceof HTMLTextAreaElement) ta.value = CUSTOM_PACK_LLM_PROMPT;
    requestAnimationFrame(() => document.getElementById("pack-prompt-title")?.focus({ preventScroll: true }));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const btn = copyBtnRef.current;
    if (btn) btn.textContent = STR.packPrompt.copy;
  }, [open]);

  async function handleCopy() {
    const ta = document.getElementById("pack-prompt-text");
    const btn = copyBtnRef.current;
    if (!(ta instanceof HTMLTextAreaElement) || !(btn instanceof HTMLButtonElement)) return;
    const label = STR.clipboard.copyLabel;
    const fail = () => {
      ta.focus();
      ta.select();
      btn.textContent = STR.clipboard.selectManually;
      window.setTimeout(() => {
        btn.textContent = label;
      }, 2000);
    };
    try {
      await navigator.clipboard.writeText(ta.value);
      btn.textContent = STR.clipboard.copied;
      window.setTimeout(() => {
        btn.textContent = label;
      }, 1600);
    } catch {
      try {
        ta.select();
        document.execCommand("copy");
        btn.textContent = STR.clipboard.copied;
        window.setTimeout(() => {
          btn.textContent = label;
        }, 1600);
      } catch {
        fail();
      }
    }
  }

  return (
    <AppModalOverlay
      id="pack-prompt-overlay"
      open={open}
      ariaLabelledBy="pack-prompt-title"
      heightMode={heightMode}
      shellClassName="pack-prompt-overlay"
      panelClassName="pack-prompt-panel"
      onBackdropClick={closePackPrompt}
      title={<h2 id="pack-prompt-title" tabIndex={-1} />}
      footer={
        <div className="app-screen__footer actions wizard-pack-actions pack-prompt-actions">
          <Button type="button" id="btn-pack-prompt-copy" ref={copyBtnRef} onClick={handleCopy} />
          <Button variant="primary" type="button" id="btn-pack-prompt-close" onClick={closePackPrompt} />
        </div>
      }
    >
      <div className="app-screen__body">
        <p className="sub pack-prompt-lead" />
        <label className="sr-only" htmlFor="pack-prompt-text" />
        <textarea
          id="pack-prompt-text"
          className="pack-prompt-textarea"
          readOnly
          spellCheck={false}
          rows={14}
          aria-readonly="true"
        />
      </div>
    </AppModalOverlay>
  );
}
