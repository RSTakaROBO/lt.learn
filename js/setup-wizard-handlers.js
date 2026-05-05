import { TRAIN_MODE } from "./config.js";
import { parseCustomPackJsonFile } from "./custom-packs.js";
import { fmt } from "./i18n/core.js";
import { STR } from "./i18n/strings-ru.js";
import { byId } from "./dom-ids.js";
import {
  getCheckedPackIds,
  loadWordsFromFiles,
  reloadManifestPacks,
  resolveFilesFromPackIds,
} from "./packs.js";
import { getCheckedCaseKeys, getEngine, mutateEngine, postTrainerUiAction } from "./trainer-ui-state.js";
import {
  appendCustomPackRecord,
  getResolvedVocabDirections,
  loadSelectedPacks,
  loadTrainMode,
  saveSelectedCases,
  saveSelectedPacks,
  saveVocabDirections,
} from "./storage.js";
import { clearVocabRound, initVocabRound } from "./vocab-round.js";
import { hasWordRu } from "./word-ru.js";
import { nextTask, nextVocabTask } from "./word-selection.js";
import { resetVocabCorrectStreak, showQuiz } from "./quiz.js";

export async function handlePackJsonInputChange(/** @type {Event} */ ev) {
  const target = ev.target;
  if (!(target instanceof HTMLInputElement)) return;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;
  const status = byId("pack-step-status");
  if (status) status.textContent = "";
  try {
    const text = await file.text();
    const record = parseCustomPackJsonFile(text);
    appendCustomPackRecord(record);
    const sel = loadSelectedPacks();
    if (sel && sel.length > 0) saveSelectedPacks([...sel, record.id]);
    const ok = await reloadManifestPacks();
    if (ok && status) {
      status.textContent = fmt(STR.events.packAdded, {
        title: record.title,
        count: record.words.length,
      });
    }
  } catch (err) {
    if (status) status.textContent = err instanceof Error ? err.message : String(err);
    console.error(err);
  }
}

export function handleVocabDirectionStartClick() {
  const dirStatus = byId("vocab-direction-step-status");
  if (dirStatus) dirStatus.textContent = "";
  const dirsTry = getResolvedVocabDirections();
  if (!dirsTry.ru_to_lt && !dirsTry.lt_to_ru) {
    if (dirStatus) dirStatus.textContent = STR.events.pickVocabDir;
    return;
  }
  saveVocabDirections(dirsTry);
  const withHint = getEngine().wordBank.filter((w) => hasWordRu(w) && w.nominative);
  const dirsNow = getResolvedVocabDirections();
  const needChoices = !dirsNow.hardcore && withHint.length < 4;
  const needAny = dirsNow.hardcore && withHint.length < 1;
  if (needChoices || needAny) {
    if (dirStatus) {
      dirStatus.textContent = dirsNow.hardcore
        ? STR.events.vocabNeedRuOne
        : STR.events.vocabNeedRuFour;
    }
    return;
  }
  mutateEngine((e) => {
    e.shownLemmaHistory = [];
  });
  resetVocabCorrectStreak();
  if (!initVocabRound()) {
    if (dirStatus) dirStatus.textContent = STR.events.roundNoWords;
    return;
  }
  const task = nextVocabTask();
  if (!task) {
    if (dirStatus) {
      dirStatus.textContent = getResolvedVocabDirections().hardcore
        ? STR.events.vocabStartHardcoreFail
        : STR.events.vocabStartChoicesFail;
    }
    return;
  }
  showQuiz(task);
}

export async function handlePacksNextClick() {
  const packStatus = byId("pack-step-status");
  const caseStatus = byId("case-step-status");
  const ids = getCheckedPackIds();
  if (!ids.length) {
    if (packStatus) packStatus.textContent = STR.events.pickOnePack;
    return;
  }
  const files = resolveFilesFromPackIds(ids);
  if (!files.length) {
    if (packStatus) packStatus.textContent = STR.events.packsNoWordFiles;
    return;
  }
  if (packStatus) packStatus.textContent = STR.events.loadingDictionaries;
  try {
    await loadWordsFromFiles(files);
    saveSelectedPacks(ids);
    if (packStatus) packStatus.textContent = "";
    if (caseStatus) caseStatus.textContent = "";
    if (loadTrainMode() === TRAIN_MODE.VOCAB) {
      const withHint = getEngine().wordBank.filter((w) => hasWordRu(w) && w.nominative);
      const hardcore = getResolvedVocabDirections().hardcore;
      if ((!hardcore && withHint.length < 4) || (hardcore && withHint.length < 1)) {
        if (packStatus) {
          packStatus.textContent = hardcore
            ? STR.events.vocabAfterPackHardcore
            : STR.events.vocabAfterPackFour;
        }
        return;
      }
      postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 });
      return;
    }
    postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 });
  } catch (err) {
    if (packStatus) {
      packStatus.textContent = fmt(STR.events.loadFailed, {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    console.error(err);
  }
}

export function handleStartCasesTrainingClick() {
  const caseStatus = byId("case-step-status");
  if (caseStatus) caseStatus.textContent = "";
  const keys = getCheckedCaseKeys();
  if (!keys.length) {
    if (caseStatus) caseStatus.textContent = STR.events.pickOneCase;
    return;
  }
  if (!getEngine().wordBank.length) {
    if (caseStatus) caseStatus.textContent = STR.events.noWordsLoaded;
    return;
  }
  saveSelectedCases(keys);
  clearVocabRound();
  mutateEngine((e) => {
    e.shownLemmaHistory = [];
  });
  const task = nextTask(keys);
  if (!task) {
    if (caseStatus) caseStatus.textContent = STR.events.noMatchingWords;
    return;
  }
  if (caseStatus) caseStatus.textContent = "";
  resetVocabCorrectStreak();
  showQuiz(task);
}
