// views/dashboard.js — the month at a glance: headline figures, category
// donut, budget health bars and the latest transactions.

import { categoryById, categorySpending, monthTotals, monthTransactions } from "../store.js";
import { money, percent, prettyDate, escapeHtml } from "../format.js";
import { donutChart, donutLegend } from "../charts.js";
import { transactionRow } from "./transactions.js";

function budgetHealth(state, year, month) {
  const spent = new Map(categorySpending(state, year, month).map((r) => [r.category.id, r.amount]));
  const rows = Object.entries(state.budgets)
    .map(([id, budget]) => ({ id, budget, used: spent.get(id) || 0 }))
    .filter((r) => r.budget > 0)
    .sort((a, b) => (b.used / b.budget) - (a.used / a.budget))
    .slice(0, 5);
  if (!rows.length) return `<p class="hint">No budgets set yet. <a href="#/budgets">Set your first budget</a>.</p>`;
  return rows.map((r) => {
    const cat = categoryById(r.id);
    const pct = Math.min(100, percent(r.used, r.budget));
    const cls = r.used > r.budget ? "over" : pct >= 80 ? "warn" : "";
    return `<div class="budget-row">
      <div class="budget-head">
        <span class="budget-name">${cat.icon} ${cat.name}</span>
        <span class="budget-figures"><strong>${money(r.used, state.currency)}</strong> of ${money(r.budget, state.currency)}</span>
      </div>
      <div class="bar" role="img" aria-label="${cat.name}: ${pct}% of budget used"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}

export function renderDashboard(state, year, month) {
  const totals = monthTotals(state, year, month);
  const byCategory = categorySpending(state, year, month);
  const recent = monthTransactions(state, year, month).slice(0, 6);
  const saveRate = totals.income ? percent(totals.left, totals.income) : 0;

  return `
  <section class="grid grid-4" aria-label="Month summary">
    <div class="card stat-in">
      <p class="stat-label">Money in</p>
      <p class="stat-value">${money(totals.income, state.currency)}</p>
      <p class="stat-sub">income this month</p>
    </div>
    <div class="card stat-out">
      <p class="stat-label">Money out</p>
      <p class="stat-value">${money(totals.spending, state.currency)}</p>
      <p class="stat-sub">spending this month</p>
    </div>
    <div class="card stat-left">
      <p class="stat-label">Left to spend</p>
      <p class="stat-value">${money(totals.left, state.currency)}</p>
      <p class="stat-sub">${totals.left >= 0 ? "still in the pot" : "over for the month"}</p>
    </div>
    <div class="card stat-save">
      <p class="stat-label">Kept aside</p>
      <p class="stat-value">${saveRate}%</p>
      <p class="stat-sub">of income not spent</p>
    </div>
  </section>

  <section class="grid grid-main" style="margin-top:18px">
    <div class="card">
      <h2>Where it went</h2>
      <p class="hint">Spending by category this month.</p>
      <div class="chart-wrap">
        ${donutChart(byCategory, totals.spending, state.currency)}
        ${donutLegend(byCategory, totals.spending, state.currency)}
      </div>
    </div>
    <div class="card">
      <h2>Budget health</h2>
      <p class="hint">The five budgets closest to their limit. <a href="#/budgets">See all budgets</a></p>
      ${budgetHealth(state, year, month)}
    </div>
  </section>

  <section class="card" style="margin-top:18px">
    <h2>Latest transactions</h2>
    <p class="hint">The newest money in and out. <a href="#/transactions">See everything</a></p>
    ${recent.length
      ? `<ul class="tx-list">${recent.map((t) => transactionRow(t, state, { readonly: true })).join("")}</ul>`
      : `<div class="empty"><strong>Nothing recorded yet</strong>Add your first transaction and it will show up here.</div>`}
  </section>`;
}
