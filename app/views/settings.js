// views/settings.js — household name, currency, and data housekeeping:
// export a backup, import one back, or start again from the sample figures.

import { loadState, resetState, saveState } from "../store.js";
import { escapeHtml } from "../format.js";

const CURRENCIES = ["$", "£", "€", "₹", "¥", "Rp"];

export function renderSettings(state) {
  return `
  <h2 class="section-title">Settings</h2>
  <p class="section-lead">Make HearthLedger yours: name the household, pick a currency, and keep a backup of your figures.</p>

  <section class="card" aria-label="Household">
    <h3>Household</h3>
    <form id="settings-form">
      <div class="form-grid">
        <label class="field">Household name
          <input name="household" type="text" maxlength="60" value="${escapeHtml(state.household)}" required>
        </label>
        <label class="field">Currency symbol
          <select name="currency">
            ${CURRENCIES.map((c) => `<option value="${c}" ${state.currency === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="form-actions"><button class="button button-primary" type="submit">Save settings</button></div>
    </form>
  </section>

  <section class="card" style="margin-top:18px" aria-label="Your data">
    <h3>Your data</h3>
    <p class="hint">Everything lives in this browser's local storage (${state.transactions.length} transactions, ${state.goals.length} goals). Export a backup before switching devices.</p>
    <div class="form-actions">
      <button class="button button-plain" type="button" id="export-btn">⬇ Export backup (JSON)</button>
      <label class="button button-plain" for="import-file">⬆ Import backup</label>
      <input id="import-file" type="file" accept="application/json" hidden>
      <button class="button button-danger" type="button" id="reset-btn">Reset to sample figures</button>
    </div>
    <p class="form-error" id="settings-error" role="alert"></p>
  </section>

  <section class="card" style="margin-top:18px" aria-label="About">
    <h3>About HearthLedger</h3>
    <p class="hint">A calm, offline budget planner for households: money in, money out, category budgets, savings goals and a six-month view — no account and no network needed. Built as a single static site; open it on a desktop or a phone and it just works.</p>
  </section>`;
}

export function wireSettings(state, rerender, toast, replaceState) {
  document.getElementById("settings-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const name = String(data.get("household") || "").trim();
    if (!name) { toast("Give the household a name."); return; }
    state.household = name;
    state.currency = String(data.get("currency") || "$");
    saveState(state);
    toast("Settings saved.");
    rerender();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hearthledger-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded.");
  });

  document.getElementById("import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    const error = document.getElementById("settings-error");
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.transactions) || !parsed.budgets || !Array.isArray(parsed.goals)) {
        throw new Error("shape");
      }
      saveState(parsed);
      replaceState(loadState());
      toast("Backup imported.");
    } catch {
      error.textContent = "That file does not look like a HearthLedger backup. Nothing was changed.";
    }
    event.target.value = "";
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Replace everything with the sample figures? Export a backup first if you want to keep your data.")) {
      replaceState(resetState());
      toast("Sample figures restored.");
    }
  });
}
