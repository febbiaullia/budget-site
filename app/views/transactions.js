// views/transactions.js — add, edit, delete, search and filter every
// transaction. The form at the top doubles as the editor.

import { CATEGORIES, INCOME_SOURCES, categoryById, monthTransactions, newId, saveState } from "../store.js";
import { escapeHtml, money, prettyDate, signedMoney, todayIso } from "../format.js";

export function transactionRow(t, state, { readonly = false } = {}) {
  const isIn = t.kind === "in";
  const cat = isIn ? null : categoryById(t.category);
  const dotBg = isIn ? "#e7f2e9" : `${cat.color}22`;
  const dotIcon = isIn ? "↓" : cat.icon;
  const meta = isIn ? `Income · ${escapeHtml(t.category)}` : cat.name;
  const amount = isIn ? t.amount : -t.amount;
  const actions = readonly ? "" : `
    <span class="tx-actions">
      <button class="icon-button" type="button" data-edit="${t.id}" aria-label="Edit ${escapeHtml(t.note)}">✎</button>
      <button class="icon-button" type="button" data-delete="${t.id}" aria-label="Delete ${escapeHtml(t.note)}">🗑</button>
    </span>`;
  return `<li class="tx">
    <span class="tx-dot" style="background:${dotBg}" aria-hidden="true">${dotIcon}</span>
    <span class="tx-main">
      <span class="tx-note">${escapeHtml(t.note)}</span><br>
      <span class="tx-meta">${meta} · ${prettyDate(t.date)}</span>
    </span>
    <span class="tx-amount ${isIn ? "in" : "out"}">${signedMoney(amount, state.currency)}</span>
    ${actions}
  </li>`;
}

function groupByDay(transactions) {
  const groups = new Map();
  for (const t of transactions) {
    if (!groups.has(t.date)) groups.set(t.date, []);
    groups.get(t.date).push(t);
  }
  return [...groups.entries()];
}

export function renderTransactions(state, year, month, ui) {
  const all = monthTransactions(state, year, month);
  const query = (ui.query || "").toLowerCase();
  const filtered = all.filter((t) => {
    if (ui.filterKind && ui.filterKind !== "all" && t.kind !== ui.filterKind) return false;
    if (ui.filterCategory && ui.filterCategory !== "all") {
      if (t.kind === "out" && t.category !== ui.filterCategory) return false;
      if (t.kind === "in" && t.category !== ui.filterCategory) return false;
    }
    if (query && !`${t.note} ${t.category}`.toLowerCase().includes(query)) return false;
    return true;
  });

  const editing = ui.editingId ? state.transactions.find((t) => t.id === ui.editingId) : null;
  const kindOptions = ["out", "in"].map((k) =>
    `<option value="${k}" ${editing && editing.kind === k ? "selected" : ""}>${k === "out" ? "Money out (spending)" : "Money in (income)"}</option>`).join("");
  const categoryOptions = (editing && editing.kind === "in" ? INCOME_SOURCES : CATEGORIES.map((c) => c.id))
    .map((id) => {
      const label = editing && editing.kind === "in" ? id : categoryById(id).name;
      return `<option value="${escapeHtml(id)}" ${editing && editing.category === id ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");

  const listHtml = filtered.length
    ? groupByDay(filtered).map(([date, rows]) => `
        <h3 class="tx-group-title">${prettyDate(date)}</h3>
        <ul class="tx-list">${rows.map((t) => transactionRow(t, state)).join("")}</ul>`).join("")
    : `<div class="empty"><strong>No transactions match</strong>Try a different search, or add one with the form above.</div>`;

  return `
  <h2 class="section-title">Transactions</h2>
  <p class="section-lead">Every bit of money in and out, in one place. Add a transaction, fix a mistake, or search for that one receipt.</p>

  <section class="card" aria-label="${editing ? "Edit transaction" : "Add transaction"}">
    <h3>${editing ? "Edit transaction" : "Add a transaction"}</h3>
    <form id="tx-form" novalidate>
      <div class="form-grid">
        <label class="field">Kind
          <select name="kind" id="tx-kind">${kindOptions}</select>
        </label>
        <label class="field">Category / source
          <select name="category" id="tx-category">${categoryOptions}</select>
        </label>
        <label class="field">What was it?
          <input name="note" id="tx-note" type="text" maxlength="80" placeholder="e.g. Weekly shop" value="${editing ? escapeHtml(editing.note) : ""}" required>
        </label>
        <label class="field">Amount
          <input name="amount" id="tx-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value="${editing ? editing.amount : ""}" required>
        </label>
        <label class="field">Date
          <input name="date" id="tx-date" type="date" value="${editing ? editing.date : todayIso()}" required>
        </label>
      </div>
      <p class="form-error" id="tx-error" role="alert"></p>
      <div class="form-actions">
        <button class="button button-primary" type="submit">${editing ? "Save changes" : "Add transaction"}</button>
        ${editing ? `<button class="button button-plain" type="button" id="tx-cancel">Cancel editing</button>` : ""}
      </div>
    </form>
  </section>

  <section class="card" style="margin-top:18px" aria-label="Transaction list">
    <div class="toolbar">
      <label class="field grow">Search
        <input id="tx-search" type="search" placeholder="Search notes…" value="${escapeHtml(ui.query || "")}">
      </label>
      <label class="field">Show
        <select id="tx-filter-kind">
          <option value="all" ${!ui.filterKind || ui.filterKind === "all" ? "selected" : ""}>Everything</option>
          <option value="in" ${ui.filterKind === "in" ? "selected" : ""}>Money in</option>
          <option value="out" ${ui.filterKind === "out" ? "selected" : ""}>Money out</option>
        </select>
      </label>
      <label class="field">Category
        <select id="tx-filter-category">
          <option value="all">All categories</option>
          ${CATEGORIES.map((c) => `<option value="${c.id}" ${ui.filterCategory === c.id ? "selected" : ""}>${c.name}</option>`).join("")}
          ${INCOME_SOURCES.map((s) => `<option value="${escapeHtml(s)}" ${ui.filterCategory === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
        </select>
      </label>
    </div>
    <p class="hint">${filtered.length} of ${all.length} transactions this month · in ${money(all.filter(t => t.kind === "in").reduce((s, t) => s + t.amount, 0), state.currency)} · out ${money(all.filter(t => t.kind === "out").reduce((s, t) => s + t.amount, 0), state.currency)}</p>
    ${listHtml}
  </section>`;
}

export function wireTransactions(state, ui, rerender, toast) {
  const form = document.getElementById("tx-form");
  const kindSel = document.getElementById("tx-kind");
  const catSel = document.getElementById("tx-category");

  function refreshCategoryOptions() {
    const isIn = kindSel.value === "in";
    const options = isIn ? INCOME_SOURCES : CATEGORIES.map((c) => c.id);
    catSel.innerHTML = options.map((id) =>
      `<option value="${escapeHtml(id)}">${escapeHtml(isIn ? id : categoryById(id).name)}</option>`).join("");
  }
  kindSel.addEventListener("change", refreshCategoryOptions);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = document.getElementById("tx-error");
    const note = document.getElementById("tx-note").value.trim();
    const amount = Number(document.getElementById("tx-amount").value);
    const date = document.getElementById("tx-date").value;
    if (!note) { error.textContent = "Give it a short name so future-you knows what it was."; return; }
    if (!Number.isFinite(amount) || amount <= 0) { error.textContent = "Enter an amount above zero."; return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { error.textContent = "Pick a date."; return; }
    const record = { kind: kindSel.value, category: catSel.value, note, amount: Math.round(amount * 100) / 100, date };
    if (ui.editingId) {
      const target = state.transactions.find((t) => t.id === ui.editingId);
      if (target) Object.assign(target, record);
      ui.editingId = null;
      toast("Transaction updated.");
    } else {
      state.transactions.push({ id: newId(), ...record });
      toast("Transaction added.");
    }
    saveState(state);
    rerender();
  });

  const cancel = document.getElementById("tx-cancel");
  if (cancel) cancel.addEventListener("click", () => { ui.editingId = null; rerender(); });

  document.getElementById("tx-search").addEventListener("input", (e) => { ui.query = e.target.value; rerender({ keepFocus: "tx-search" }); });
  document.getElementById("tx-filter-kind").addEventListener("change", (e) => { ui.filterKind = e.target.value; rerender(); });
  document.getElementById("tx-filter-category").addEventListener("change", (e) => { ui.filterCategory = e.target.value; rerender(); });

  document.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => {
    ui.editingId = btn.getAttribute("data-edit");
    rerender();
    document.getElementById("tx-note").focus();
  }));
  document.querySelectorAll("[data-delete]").forEach((btn) => btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-delete");
    const target = state.transactions.find((t) => t.id === id);
    if (target && confirm(`Delete "${target.note}" (${money(target.amount, state.currency)})?`)) {
      state.transactions = state.transactions.filter((t) => t.id !== id);
      if (ui.editingId === id) ui.editingId = null;
      saveState(state);
      toast("Transaction deleted.");
      rerender();
    }
  }));
}
