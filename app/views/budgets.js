// views/budgets.js — monthly spending limits per category, editable inline,
// with plain-language warnings when a budget is nearly or fully used up.

import { CATEGORIES, categorySpending, saveState } from "../store.js";
import { escapeHtml, money, percent } from "../format.js";

function budgetNote(used, budget, currency) {
  if (!budget) return "No limit set for this category.";
  if (used > budget) return `<span class="over">Over by ${money(used - budget, currency)} — worth a look before the next shop.</span>`;
  const left = budget - used;
  if (percent(used, budget) >= 80) return `Careful: only ${money(left, currency)} left in this budget.`;
  return `${money(left, currency)} still available.`;
}

export function renderBudgets(state, year, month) {
  const spent = new Map(categorySpending(state, year, month).map((r) => [r.category.id, r.amount]));
  const totalBudget = Object.values(state.budgets).reduce((s, n) => s + n, 0);
  const totalSpent = [...spent.values()].reduce((s, n) => s + n, 0);

  const rows = CATEGORIES.map((cat) => {
    const budget = state.budgets[cat.id] || 0;
    const used = spent.get(cat.id) || 0;
    const pct = budget ? Math.min(100, percent(used, budget)) : 0;
    const cls = used > budget && budget ? "over" : pct >= 80 ? "warn" : "";
    return `<div class="budget-row">
      <div class="budget-head">
        <span class="budget-name">${cat.icon} ${cat.name}</span>
        <span class="budget-figures"><strong>${money(used, state.currency)}</strong> of ${money(budget, state.currency)} (${budget ? percent(used, budget) : 0}%)</span>
      </div>
      <div class="bar" role="img" aria-label="${cat.name}: ${pct}% of budget used"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
      <p class="budget-note">${budgetNote(used, budget, state.currency)}</p>
      <form class="budget-edit" data-budget-form="${cat.id}">
        <label class="field" style="flex-direction:row;align-items:center;gap:8px">Monthly limit
          <input type="number" min="0" step="1" name="amount" value="${budget}" aria-label="Monthly limit for ${escapeHtml(cat.name)}">
        </label>
        <button class="button button-plain button-small" type="submit">Save</button>
      </form>
    </div>`;
  }).join("");

  return `
  <h2 class="section-title">Budgets</h2>
  <p class="section-lead">A monthly limit for each kind of spending. HearthLedger watches the bars so you do not have to do the maths in the supermarket queue.</p>
  <section class="grid grid-4" aria-label="Budget totals">
    <div class="card"><p class="stat-label">Total budgeted</p><p class="stat-value">${money(totalBudget, state.currency)}</p><p class="stat-sub">across ${CATEGORIES.length} categories</p></div>
    <div class="card"><p class="stat-label">Spent so far</p><p class="stat-value">${money(totalSpent, state.currency)}</p><p class="stat-sub">${percent(totalSpent, totalBudget)}% of all budgets</p></div>
    <div class="card"><p class="stat-label">Still available</p><p class="stat-value">${money(Math.max(0, totalBudget - totalSpent), state.currency)}</p><p class="stat-sub">before every limit is hit</p></div>
    <div class="card"><p class="stat-label">Categories over</p><p class="stat-value">${CATEGORIES.filter((c) => (spent.get(c.id) || 0) > (state.budgets[c.id] || 0) && state.budgets[c.id]).length}</p><p class="stat-sub">need a gentle review</p></div>
  </section>
  <section class="card" style="margin-top:18px" aria-label="Category budgets">
    ${rows}
  </section>`;
}

export function wireBudgets(state, rerender, toast) {
  document.querySelectorAll("[data-budget-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const id = form.getAttribute("data-budget-form");
      const value = Number(new FormData(form).get("amount"));
      if (!Number.isFinite(value) || value < 0) { toast("Enter a limit of zero or more."); return; }
      state.budgets[id] = Math.round(value);
      saveState(state);
      toast("Budget saved.");
      rerender();
    });
  });
}
