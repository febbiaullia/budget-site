// format.js — money, date and number formatting helpers.
// Every view formats figures through here so the whole site agrees.

export function money(amount, currency) {
  const sign = amount < 0 ? "−" : "";
  const abs = Math.abs(amount);
  const text = abs.toLocaleString("en-US", {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${currency}${text}`;
}

export function signedMoney(amount, currency) {
  if (amount > 0) return `+${money(amount, currency)}`;
  return money(amount, currency);
}

export function percent(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(monthIndex) {
  return MONTH_NAMES[monthIndex];
}

export function monthLabel(year, monthIndex) {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function shortMonthLabel(year, monthIndex) {
  return `${MONTH_NAMES[monthIndex].slice(0, 3)} ’${String(year).slice(2)}`;
}

export function prettyDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`;
}

export function todayIso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function monthKeyOf(isoDate) {
  return isoDate.slice(0, 7); // "YYYY-MM"
}

export function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function shiftMonth(year, monthIndex, delta) {
  const total = year * 12 + monthIndex + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
