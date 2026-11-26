// views/insights.js — the story behind the numbers: six-month trend,
// biggest expenses, and a few plain-language observations.

import { lastSixMonths, monthTotals, topExpenses, categorySpending } from "../store.js";
import { escapeHtml, money, percent, prettyDate } from "../format.js";
import { trendChart } from "../charts.js";
import { transactionRow } from "./transactions.js";

function observations(state, year, month) {
  const notes = [];
  const totals = monthTotals(state, year, month);
  const byCategory = categorySpending(state, year, month);
  const trend = lastSixMonths(state, year, month);

  if (totals.income > 0) {
    const kept = percent(totals.left, totals.income);
    notes.push(kept >= 20
      ? `You kept ${kept}% of this month's income unspent — a healthy cushion for surprises.`
      : kept >= 0
        ? `You kept ${kept}% of this month's income. Nudging that towards 20% would build a cushion faster.`
        : `Spending ran ${money(-totals.left, state.currency)} ahead of income this month. One category to trim could close the gap.`);
  }
  if (byCategory.length) {
    const top = byCategory[0];
    notes.push(`${top.category.name} is the biggest slice at ${money(top.amount, state.currency)} (${percent(top.amount, totals.spending)}% of spending).`);
  }
  const prev = trend[trend.length - 2];
  if (prev && prev.spending > 0) {
    const diff = totals.spending - prev.spending;
    notes.push(diff <= 0
      ? `Spending is ${money(-diff, state.currency)} lower than last month. Steady as she goes.`
      : `Spending is ${money(diff, state.currency)} higher than last month — check the trend bars for what changed.`);
  }
  const over = byCategory.filter((r) => state.budgets[r.category.id] && r.amount > state.budgets[r.category.id]);
  if (over.length) {
    notes.push(`${over.map((r) => r.category.name).join(", ")} went over budget. Small leaks sink budgets; a mid-month glance helps.`);
  } else if (byCategory.length) {
    notes.push(`Every category is inside its budget so far. Nicely done.`);
  }
  return notes;
}

export function renderInsights(state, year, month) {
  const trend = lastSixMonths(state, year, month);
  const biggest = topExpenses(state, year, month, 5);
  const notes = observations(state, year, month);
  const totals = monthTotals(state, year, month);
  const avgSpend = Math.round(trend.reduce((s, m) => s + m.spending, 0) / trend.length);
  const avgIncome = Math.round(trend.reduce((s, m) => s + m.income, 0) / trend.length);

  return `
  <h2 class="section-title">Insights</h2>
  <p class="section-lead">Six months of money in and out, the month's biggest bills, and what the numbers are quietly telling you.</p>

  <section class="card" aria-label="Six month trend">
    <h3>Money in vs money out — last six months</h3>
    <p class="hint">Average month: ${money(avgIncome, state.currency)} in, ${money(avgSpend, state.currency)} out.</p>
    ${trendChart(trend, state.currency)}
  </section>

  <section class="grid grid-main" style="margin-top:18px">
    <div class="card" aria-label="Biggest expenses">
      <h3>Biggest expenses this month</h3>
      <p class="hint">The five largest single payments.</p>
      ${biggest.length
        ? `<ul class="tx-list">${biggest.map((t) => transactionRow(t, state, { readonly: true })).join("")}</ul>`
        : `<div class="empty"><strong>No spending yet</strong>Big expenses will line up here.</div>`}
    </div>
    <div class="card" aria-label="Observations">
      <h3>What stands out</h3>
      <p class="hint">Plain-language notes from this month's figures.</p>
      <ul class="legend" style="min-width:0">
        ${notes.map((n) => `<li><span aria-hidden="true">✦</span><span>${escapeHtml(n)}</span></li>`).join("")}
      </ul>
      <p class="hint" style="margin-top:14px">This month so far: ${money(totals.income, state.currency)} in, ${money(totals.spending, state.currency)} out, ${money(totals.left, state.currency)} left. Figures as of ${prettyDate(new Date().toISOString().slice(0, 10))}.</p>
    </div>
  </section>`;
}
