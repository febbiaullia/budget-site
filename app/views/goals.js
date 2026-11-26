// views/goals.js — savings goals with progress bars; add a contribution
// or start a new goal, all saved on the device.

import { newId, saveState } from "../store.js";
import { escapeHtml, money, percent } from "../format.js";

export function renderGoals(state) {
  const cards = state.goals.map((g) => {
    const pct = Math.min(100, percent(g.saved, g.target));
    const done = g.saved >= g.target;
    return `<article class="card goal-card">
      <h3>${done ? "🎉 " : ""}${escapeHtml(g.name)}</h3>
      <p class="hint" style="margin-bottom:2px">${escapeHtml(g.note || "")}</p>
      <div class="goal-figures"><span><strong>${money(g.saved, state.currency)}</strong> saved</span><span>of ${money(g.target, state.currency)}</span></div>
      <div class="bar" role="img" aria-label="${escapeHtml(g.name)}: ${pct}% saved"><div class="bar-fill" style="width:${pct}%"></div></div>
      <p class="budget-note">${done ? "Goal reached — time to celebrate (sensibly)." : `${money(g.target - g.saved, state.currency)} to go · ${pct}% there`}</p>
      <form class="goal-add" data-goal-form="${g.id}">
        <input type="number" name="amount" min="1" step="1" placeholder="Add amount" aria-label="Add to ${escapeHtml(g.name)}">
        <button class="button button-primary button-small" type="submit">Add</button>
        <button class="button button-plain button-small" type="button" data-goal-delete="${g.id}" aria-label="Remove ${escapeHtml(g.name)}">Remove</button>
      </form>
    </article>`;
  }).join("");

  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);

  return `
  <h2 class="section-title">Savings goals</h2>
  <p class="section-lead">Name what you are saving for, watch the bars fill, and add a little whenever the month allows. Together you have saved ${money(totalSaved, state.currency)} of ${money(totalTarget, state.currency)}.</p>
  <section class="grid grid-2" aria-label="Your goals">${cards}</section>
  <section class="card" style="margin-top:18px" aria-label="New goal">
    <h3>Start a new goal</h3>
    <form id="goal-new-form">
      <div class="form-grid">
        <label class="field">Goal name <input name="name" type="text" maxlength="50" placeholder="e.g. New washing machine" required></label>
        <label class="field">Target amount <input name="target" type="number" min="1" step="1" placeholder="1000" required></label>
        <label class="field">Already saved <input name="saved" type="number" min="0" step="1" placeholder="0"></label>
        <label class="field">Note <input name="note" type="text" maxlength="70" placeholder="Why it matters"></label>
      </div>
      <p class="form-error" id="goal-error" role="alert"></p>
      <div class="form-actions"><button class="button button-primary" type="submit">Add goal</button></div>
    </form>
  </section>`;
}

export function wireGoals(state, rerender, toast) {
  document.querySelectorAll("[data-goal-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const id = form.getAttribute("data-goal-form");
      const amount = Number(new FormData(form).get("amount"));
      if (!Number.isFinite(amount) || amount <= 0) { toast("Enter an amount above zero."); return; }
      const goal = state.goals.find((g) => g.id === id);
      if (!goal) return;
      goal.saved += Math.round(amount * 100) / 100;
      saveState(state);
      toast(goal.saved >= goal.target ? `Goal reached: ${goal.name}!` : `Added to ${goal.name}.`);
      rerender();
    });
  });
  document.querySelectorAll("[data-goal-delete]").forEach((btn) => btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-goal-delete");
    const goal = state.goals.find((g) => g.id === id);
    if (goal && confirm(`Remove the goal "${goal.name}"?`)) {
      state.goals = state.goals.filter((g) => g.id !== id);
      saveState(state);
      toast("Goal removed.");
      rerender();
    }
  }));
  const form = document.getElementById("goal-new-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const target = Number(data.get("target"));
    const saved = Number(data.get("saved") || 0);
    const error = document.getElementById("goal-error");
    if (!name) { error.textContent = "Give the goal a name."; return; }
    if (!Number.isFinite(target) || target <= 0) { error.textContent = "Set a target above zero."; return; }
    state.goals.push({ id: newId(), name, target: Math.round(target), saved: Math.max(0, Math.round(saved || 0)), note: String(data.get("note") || "").trim() });
    saveState(state);
    toast("Goal added.");
    rerender();
  });
}
