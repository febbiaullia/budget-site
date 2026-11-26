// main.js — the shell: hash routing between the six views, the month
// switcher, the sidebar summary and the little toast messages.

import { loadState, monthTotals } from "./store.js";
import { money, monthLabel, shiftMonth } from "./format.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderTransactions, wireTransactions } from "./views/transactions.js";
import { renderBudgets, wireBudgets } from "./views/budgets.js";
import { renderInsights } from "./views/insights.js";
import { renderGoals, wireGoals } from "./views/goals.js";
import { renderSettings, wireSettings } from "./views/settings.js";

let state = loadState();

// Open on the newest month that has data, so the first screen is full.
function newestMonthWithData() {
  const dates = state.transactions.map((t) => t.date).sort();
  if (!dates.length) { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; }
  const [y, m] = dates[dates.length - 1].split("-").map(Number);
  return { year: y, month: m - 1 };
}

const cursor = newestMonthWithData();
const ui = { query: "", filterKind: "all", filterCategory: "all", editingId: null };

const viewEl = document.getElementById("view");
const monthTitle = document.getElementById("month-title");
const toastEl = document.getElementById("toast");
let toastTimer = null;

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

function routeFromHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  return ["dashboard", "transactions", "budgets", "insights", "goals", "settings"].includes(hash) ? hash : "dashboard";
}

function paintChrome(route) {
  monthTitle.textContent = monthLabel(cursor.year, cursor.month);
  document.getElementById("household-name").textContent = state.household;
  const totals = monthTotals(state, cursor.year, cursor.month);
  document.getElementById("sidebar-left").textContent = money(totals.left, state.currency);
  document.getElementById("sidebar-left-sub").textContent =
    totals.left >= 0 ? "left to spend this month" : "over this month — see Insights";
  document.querySelectorAll("[data-route]").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-route") === route);
  });
}

function render(options = {}) {
  const route = routeFromHash();
  paintChrome(route);
  const rerender = (opts) => render(opts);
  if (route === "dashboard") {
    viewEl.innerHTML = renderDashboard(state, cursor.year, cursor.month);
  } else if (route === "transactions") {
    viewEl.innerHTML = renderTransactions(state, cursor.year, cursor.month, ui);
    wireTransactions(state, ui, rerender, toast);
  } else if (route === "budgets") {
    viewEl.innerHTML = renderBudgets(state, cursor.year, cursor.month);
    wireBudgets(state, rerender, toast);
  } else if (route === "insights") {
    viewEl.innerHTML = renderInsights(state, cursor.year, cursor.month);
  } else if (route === "goals") {
    viewEl.innerHTML = renderGoals(state);
    wireGoals(state, rerender, toast);
  } else if (route === "settings") {
    viewEl.innerHTML = renderSettings(state);
    wireSettings(state, rerender, toast, (fresh) => { state = fresh; render(); });
  }
  if (options.keepFocus) {
    const el = document.getElementById(options.keepFocus);
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }
}

document.getElementById("month-prev").addEventListener("click", () => {
  Object.assign(cursor, shiftMonth(cursor.year, cursor.month, -1));
  ui.editingId = null;
  render();
});
document.getElementById("month-next").addEventListener("click", () => {
  Object.assign(cursor, shiftMonth(cursor.year, cursor.month, 1));
  ui.editingId = null;
  render();
});

window.addEventListener("hashchange", () => render());
render();
