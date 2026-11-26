// charts.js — small SVG/HTML charts drawn from the store's figures.
// No library: a donut for category shares, bars for the six-month trend.

import { money, percent, shortMonthLabel } from "./format.js";

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function donutSlice(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const [x1, y1] = polar(cx, cy, rOuter, startDeg);
  const [x2, y2] = polar(cx, cy, rOuter, endDeg);
  const [x3, y3] = polar(cx, cy, rInner, endDeg);
  const [x4, y4] = polar(cx, cy, rInner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} A ${rInner} ${rInner} 0 ${large} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
}

export function donutChart(rows, total, currency) {
  const size = 190, cx = size / 2, cy = size / 2, rOuter = 86, rInner = 56;
  if (!total) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="No spending yet">
      <circle cx="${cx}" cy="${cy}" r="${(rOuter + rInner) / 2}" fill="none" stroke="#f0e9da" stroke-width="${rOuter - rInner}"/>
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="#5c6b62">No spending yet</text>
    </svg>`;
  }
  let angle = 0;
  const slices = rows.map(({ category, amount }) => {
    const sweep = (amount / total) * 360;
    const path = donutSlice(cx, cy, rOuter, rInner, angle, angle + Math.max(sweep - 1.2, 0.4));
    angle += sweep;
    return `<path d="${path}" fill="${category.color}"><title>${category.name}: ${money(amount, currency)}</title></path>`;
  }).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category">
    ${slices}
    <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="12" fill="#5c6b62">Spent</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="17" font-weight="700" fill="#22302a">${money(total, currency)}</text>
  </svg>`;
}

export function donutLegend(rows, total, currency) {
  if (!rows.length) return `<p class="hint">Nothing spent this month yet.</p>`;
  const items = rows.map(({ category, amount }) => `
    <li>
      <span class="swatch" style="background:${category.color}"></span>
      <span>${category.icon} ${category.name}</span>
      <span class="legend-amount">${money(amount, currency)}</span>
      <span class="legend-share">${percent(amount, total)}%</span>
    </li>`).join("");
  return `<ul class="legend">${items}</ul>`;
}

export function trendChart(months, currency) {
  const max = Math.max(...months.map((m) => Math.max(m.income, m.spending)), 1);
  const cols = months.map((m) => {
    const inH = Math.max(3, Math.round((m.income / max) * 140));
    const outH = Math.max(3, Math.round((m.spending / max) * 140));
    return `<div class="trend-col">
      <div class="trend-bars">
        <div class="trend-bar in" style="height:${inH}px" title="In: ${money(m.income, currency)}"></div>
        <div class="trend-bar out" style="height:${outH}px" title="Out: ${money(m.spending, currency)}"></div>
      </div>
      <span class="trend-label">${shortMonthLabel(m.year, m.month)}</span>
    </div>`;
  }).join("");
  return `<div class="trend">${cols}</div>
    <div class="trend-key">
      <span><span class="swatch" style="background:#14532d"></span>Money in</span>
      <span><span class="swatch" style="background:#d97706"></span>Money out</span>
    </div>`;
}
