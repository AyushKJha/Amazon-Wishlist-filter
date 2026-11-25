// Price tracking, deal scoring and budget planning. No DOM access, so it runs in Node tests too.

export const PRIORITIES = { 3: 'Must have', 2: 'Want', 1: 'Nice to have' };

export function stats(item) {
  const prices = (item.history || []).map(h => h.price);
  if (!prices.length) return { current: null, lowest: null, highest: null, dropPct: 0, belowTarget: false, change: 0 };
  const current = prices[prices.length - 1];
  const lowest = Math.min(...prices), highest = Math.max(...prices);
  const previous = prices.length > 1 ? prices[prices.length - 2] : current;
  return {
    current, lowest, highest,
    dropPct: highest ? Math.round((highest - current) / highest * 100) : 0,
    belowTarget: item.target != null && current <= item.target,
    atLowest: prices.length > 1 && current === lowest,
    change: round(current - previous),
  };
}

// A simple 0–100 score: how far the price is below its peak, plus a bonus for hitting the target.
export function dealScore(item) {
  const s = stats(item);
  if (s.current == null) return 0;
  let score = Math.min(60, s.dropPct * 2);
  if (s.belowTarget) score += 30;
  if (s.atLowest) score += 10;
  return Math.min(100, Math.round(score));
}

export function addPrice(item, price, date = new Date().toISOString().slice(0, 10)) {
  const p = Number(price);
  if (!Number.isFinite(p) || p < 0 || p > 1e9) throw new Error('Enter a valid price');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Enter a valid date');
  const history = (item.history || []).filter(h => h.date !== date).concat({ date, price: round(p) });
  history.sort((a, b) => a.date.localeCompare(b.date));
  return { ...item, history: history.slice(-120) };
}

export function filterItems(items, { query = '', category = '', onlyDeals = false, sort = 'deal' } = {}) {
  const q = query.trim().toLowerCase();
  const list = items.filter(i =>
    (!q || [i.name, i.category, i.notes, i.store].some(v => String(v || '').toLowerCase().includes(q))) &&
    (!category || i.category === category) &&
    (!onlyDeals || stats(i).belowTarget || stats(i).dropPct >= 10));
  const cmp = {
    deal: (a, b) => dealScore(b) - dealScore(a),
    price: (a, b) => (stats(a).current ?? Infinity) - (stats(b).current ?? Infinity),
    drop: (a, b) => stats(b).dropPct - stats(a).dropPct,
    priority: (a, b) => (b.priority || 0) - (a.priority || 0) || dealScore(b) - dealScore(a),
    name: (a, b) => a.name.localeCompare(b.name),
  }[sort] || (() => 0);
  return [...list].sort(cmp);
}

// Pick the set of items that fits the budget and gives the most value.
// Value favours priority first, then a good deal. Solved exactly (0/1 knapsack) in whole currency units.
export function planBudget(items, budget) {
  const B = Math.floor(Number(budget));
  if (!Number.isFinite(B) || B <= 0) return { picked: [], total: 0, left: Math.max(0, B || 0) };
  // One must-have outweighs any number of wants, and one want outweighs any number of nice-to-haves.
  const weight = { 3: 1e6, 2: 1e3, 1: 1 };
  const cands = items.map(i => ({ item: i, cost: Math.ceil(stats(i).current ?? Infinity), value: (weight[i.priority] || 1e3) * (1 + dealScore(i) / 1000) }))
    .filter(c => Number.isFinite(c.cost) && c.cost <= B);
  const cap = Math.min(B, 500000);
  const scale = B > cap ? B / cap : 1;
  const W = Math.floor(B / scale);
  const best = new Float64Array(W + 1);
  const keep = cands.map(() => new Uint8Array(W + 1));
  cands.forEach((c, n) => {
    const w = Math.ceil(c.cost / scale);
    for (let x = W; x >= w; x--) {
      const v = best[x - w] + c.value;
      if (v > best[x]) { best[x] = v; keep[n][x] = 1; }
    }
  });
  const picked = [];
  let x = W;
  for (let n = cands.length - 1; n >= 0; n--) if (keep[n][x]) { picked.push(cands[n].item); x -= Math.ceil(cands[n].cost / scale); }
  picked.reverse();
  const total = round(picked.reduce((s, i) => s + stats(i).current, 0));
  return { picked, total, left: round(B - total) };
}

// CSV import: name,price[,target,category,url,priority,notes]. Header names are matched loosely.
export function parseItems(text) {
  const rows = splitCsv(String(text).replace(/^﻿/, '').trim());
  if (rows.length < 2) throw new Error('Include a header row and at least one item');
  const header = rows.shift().map(h => h.trim().toLowerCase());
  const find = (...names) => header.findIndex(h => names.includes(h));
  const c = {
    name: find('name', 'product', 'product name', 'product_name', 'title', 'item'),
    price: find('price', 'current price', 'current_price', 'cost'),
    target: find('target', 'target price', 'target_price'),
    category: find('category'), url: find('url', 'link'), priority: find('priority'), notes: find('notes', 'note'),
  };
  if (c.name < 0) throw new Error('CSV needs a name column');
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((r, n) => {
    const name = (r[c.name] || '').trim();
    if (!name) throw new Error(`Row ${n + 2} has no name`);
    let item = newItem({
      name, category: (r[c.category] || '').trim(), url: safeUrl(r[c.url]),
      target: num(r[c.target]), priority: [1, 2, 3].includes(Number(r[c.priority])) ? Number(r[c.priority]) : 2,
      notes: (r[c.notes] || '').trim(),
    });
    const p = num(r[c.price]);
    if (p != null) item = addPrice(item, p, today);
    return item;
  });
}

export function newItem({ name, category = '', url = '', target = null, priority = 2, notes = '' }) {
  if (!name || !String(name).trim()) throw new Error('Give the item a name');
  return {
    id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    name: String(name).trim().slice(0, 160), category: String(category).trim().slice(0, 60),
    url: safeUrl(url), target: target == null || target === '' ? null : num(target), priority: Number(priority) || 2,
    notes: String(notes).slice(0, 1000), history: [], addedAt: new Date().toISOString(),
  };
}

export function safeUrl(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  try { const u = new URL(s); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}

function num(v) { const s = String(v ?? '').replace(/[^\d.\-]/g, ''); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? round(n) : null; }
const round = n => Math.round(n * 100) / 100;

function splitCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (q) throw new Error('A quote in the CSV is never closed');
  row.push(cell); rows.push(row);
  return rows.filter(r => r.some(v => v.trim()));
}
