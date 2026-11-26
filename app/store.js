// store.js — the household's data: categories, seed figures, localStorage
// persistence, and every derived total the views show.

import { monthKeyOf, monthKey, shiftMonth } from "./format.js";

const STORAGE_KEY = "hearthledger-v1";

export const CATEGORIES = [
  { id: "housing", name: "Housing", icon: "⌂", color: "#14532d" },
  { id: "groceries", name: "Groceries", icon: "🛒", color: "#65a30d" },
  { id: "dining", name: "Dining out", icon: "🍽", color: "#d97706" },
  { id: "transport", name: "Transport", icon: "🚗", color: "#0369a1" },
  { id: "utilities", name: "Utilities & bills", icon: "💡", color: "#7c3aed" },
  { id: "health", name: "Health", icon: "✚", color: "#be185d" },
  { id: "kids", name: "Kids & school", icon: "🎒", color: "#db2777" },
  { id: "fun", name: "Entertainment", icon: "🎬", color: "#ea580c" },
  { id: "shopping", name: "Shopping", icon: "🛍", color: "#0f766e" },
  { id: "subs", name: "Subscriptions", icon: "↻", color: "#475569" },
  { id: "savings", name: "Savings", icon: "◎", color: "#b45309" },
  { id: "other", name: "Other", icon: "•", color: "#78716c" },
];

export const INCOME_SOURCES = ["Salary", "Freelance", "Benefits", "Rental", "Gift", "Other income"];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

let uidCounter = 0;
export function newId() {
  uidCounter += 1;
  return `tx-${Date.now().toString(36)}-${uidCounter}`;
}

function tx(date, kind, category, note, amount) {
  return { id: newId(), date, kind, category, note, amount };
}

// A believable household month (November 2026) plus five earlier months of
// totals, so every chart and list opens with real figures in place.
function seedData() {
  const transactions = [
    tx("2026-11-01", "in", "Salary", "Monthly salary — Alex", 3850),
    tx("2026-11-01", "out", "housing", "Rent", 1450),
    tx("2026-11-02", "out", "groceries", "Weekly shop — Market Basket", 128.40),
    tx("2026-11-03", "out", "transport", "Fuel", 52.00),
    tx("2026-11-03", "out", "subs", "Music streaming family plan", 16.99),
    tx("2026-11-04", "out", "dining", "Pizza night with the kids", 34.50),
    tx("2026-11-05", "out", "utilities", "Electricity bill", 96.20),
    tx("2026-11-06", "out", "kids", "School lunch money", 45.00),
    tx("2026-11-07", "out", "groceries", "Top-up shop — bread, milk, fruit", 38.75),
    tx("2026-11-08", "out", "health", "Pharmacy — prescriptions", 22.30),
    tx("2026-11-09", "out", "groceries", "Weekly shop — Market Basket", 141.10),
    tx("2026-11-10", "out", "transport", "Bus passes (2 × monthly)", 60.00),
    tx("2026-11-11", "in", "Freelance", "Logo design — side project", 420),
    tx("2026-11-12", "out", "shopping", "Winter boots for Mia", 64.99),
    tx("2026-11-13", "out", "fun", "Cinema tickets × 4", 48.00),
    tx("2026-11-14", "out", "utilities", "Water bill", 41.60),
    tx("2026-11-15", "out", "groceries", "Weekly shop — Market Basket", 133.85),
    tx("2026-11-15", "out", "savings", "Transfer to emergency fund", 300),
    tx("2026-11-16", "out", "dining", "Coffee and cake with Sam", 18.40),
    tx("2026-11-17", "out", "kids", "Swimming lessons term fee", 85.00),
    tx("2026-11-18", "out", "utilities", "Internet & mobile bundle", 79.99),
    tx("2026-11-19", "out", "transport", "Car service — oil & filters", 119.00),
    tx("2026-11-20", "out", "groceries", "Weekly shop — Market Basket", 152.60),
    tx("2026-11-21", "out", "health", "Dentist check-up", 55.00),
    tx("2026-11-22", "out", "fun", "Board game for family night", 29.95),
    tx("2026-11-23", "out", "shopping", "New kettle", 39.99),
    tx("2026-11-24", "out", "dining", "Takeaway curry", 41.20),
    tx("2026-11-25", "out", "subs", "Cloud photo storage", 2.99),
    tx("2026-11-26", "out", "groceries", "Small top-up shop", 27.45),
    tx("2026-10-01", "in", "Salary", "Monthly salary — Alex", 3850),
    tx("2026-10-01", "out", "housing", "Rent", 1450),
    tx("2026-10-06", "out", "groceries", "Weekly shops (October total)", 512.30),
    tx("2026-10-14", "out", "utilities", "Electricity & water", 148.90),
    tx("2026-10-19", "out", "transport", "Fuel & bus passes", 112.00),
    tx("2026-10-22", "out", "savings", "Transfer to emergency fund", 300),
    tx("2026-10-25", "out", "fun", "Birthday party supplies", 67.40),
    tx("2026-09-01", "in", "Salary", "Monthly salary — Alex", 3850),
    tx("2026-09-01", "out", "housing", "Rent", 1450),
    tx("2026-09-08", "out", "groceries", "Weekly shops (September total)", 498.75),
    tx("2026-09-15", "out", "kids", "Back-to-school supplies", 132.20),
    tx("2026-09-20", "out", "savings", "Transfer to emergency fund", 250),
    tx("2026-08-01", "in", "Salary", "Monthly salary — Alex", 3850),
    tx("2026-08-01", "out", "housing", "Rent", 1450),
    tx("2026-08-10", "out", "groceries", "Weekly shops (August total)", 530.10),
    tx("2026-08-17", "out", "fun", "Day trip to the coast", 96.50),
    tx("2026-08-24", "out", "savings", "Transfer to holiday fund", 200),
    tx("2026-07-01", "in", "Salary", "Monthly salary — Alex", 3850),
    tx("2026-07-01", "out", "housing", "Rent", 1450),
    tx("2026-07-09", "out", "groceries", "Weekly shops (July total)", 486.40),
    tx("2026-07-18", "out", "transport", "Car insurance (quarterly)", 210.00),
    tx("2026-06-01", "in", "Salary", "Monthly salary — Alex", 3850),
    tx("2026-06-01", "out", "housing", "Rent", 1450),
    tx("2026-06-11", "out", "groceries", "Weekly shops (June total)", 505.90),
    tx("2026-06-21", "out", "utilities", "Electricity & water", 139.25),
  ];

  return {
    household: "The Hartley Household",
    currency: "$",
    transactions,
    budgets: {
      housing: 1500, groceries: 600, dining: 160, transport: 260,
      utilities: 280, health: 120, kids: 220, fun: 120,
      shopping: 150, subs: 40, savings: 300, other: 100,
    },
    goals: [
      { id: "goal-emergency", name: "Emergency fund", target: 6000, saved: 3850, note: "Three months of essentials" },
      { id: "goal-holiday", name: "Summer holiday", target: 1800, saved: 720, note: "Coast cottage, July" },
      { id: "goal-laptop", name: "New family laptop", target: 900, saved: 340, note: "For homework & photos" },
    ],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions) && parsed.budgets) return parsed;
    }
  } catch { /* fall through to seed */ }
  const seeded = seedData();
  saveState(seeded);
  return seeded;
}

export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full/blocked: keep running in memory */ }
}

export function resetState() {
  const seeded = seedData();
  saveState(seeded);
  return seeded;
}

// ---------- Derived figures ----------

export function monthTransactions(state, year, monthIndex) {
  const key = monthKey(year, monthIndex);
  return state.transactions
    .filter((t) => monthKeyOf(t.date) === key)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function monthTotals(state, year, monthIndex) {
  let income = 0, spending = 0;
  for (const t of monthTransactions(state, year, monthIndex)) {
    if (t.kind === "in") income += t.amount; else spending += t.amount;
  }
  return { income, spending, left: income - spending };
}

export function categorySpending(state, year, monthIndex) {
  const totals = new Map();
  for (const t of monthTransactions(state, year, monthIndex)) {
    if (t.kind !== "out") continue;
    totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([id, amount]) => ({ category: categoryById(id), amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function lastSixMonths(state, year, monthIndex) {
  const rows = [];
  for (let back = 5; back >= 0; back--) {
    const { year: y, month: m } = shiftMonth(year, monthIndex, -back);
    rows.push({ year: y, month: m, ...monthTotals(state, y, m) });
  }
  return rows;
}

export function topExpenses(state, year, monthIndex, count = 5) {
  return monthTransactions(state, year, monthIndex)
    .filter((t) => t.kind === "out")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, count);
}
