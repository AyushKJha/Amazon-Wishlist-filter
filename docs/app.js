import { PRIORITIES, stats, dealScore, addPrice, filterItems, planBudget, parseItems, newItem, safeUrl } from './lib/deals.js';
import { createStore, download, el, sparkline } from './lib/store.js';

const $ = s => document.querySelector(s);
const store = createStore('wishlist-deal-tracker', () => ({ version: 1, currency: 'INR', items: [], migrated: false }));
let state;

const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); };
const money = v => v == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency, maximumFractionDigits: state.currency === 'INR' ? 0 : 2 }).format(v);
const save = async () => { await store.save(state); render(); };
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Add / edit ----------
function resetForm() {
  const f = $('#itemForm'); f.reset(); f.id.value = '';
  $('#formTitle').textContent = 'Add an item'; $('#saveItem').textContent = 'Add item';
  f.price.closest('label').firstChild.textContent = 'Price now';
}
$('#clearItem').onclick = resetForm;

$('#itemForm').onsubmit = async e => {
  e.preventDefault();
  const f = e.target;
  try {
    const fields = { name: f.name.value, url: f.url.value, target: f.target.value, category: f.category.value, priority: f.priority.value, notes: f.notes.value };
    if (f.url.value && !safeUrl(f.url.value)) throw new Error('The link must start with http:// or https://');
    if (f.id.value) {
      const i = state.items.findIndex(x => x.id === f.id.value);
      const base = newItem(fields);
      let updated = { ...state.items[i], ...base, id: state.items[i].id, history: state.items[i].history, addedAt: state.items[i].addedAt };
      if (f.price.value !== '') updated = addPrice(updated, f.price.value, today());
      state.items[i] = updated;
      toast('Item updated');
    } else {
      let item = newItem(fields);
      if (f.price.value !== '') item = addPrice(item, f.price.value, today());
      state.items.unshift(item);
      toast('Added to your wishlist');
    }
    resetForm(); await save();
  } catch (err) { toast(err.message); }
};

function edit(item) {
  const f = $('#itemForm');
  f.id.value = item.id; f.name.value = item.name; f.url.value = item.url; f.target.value = item.target ?? '';
  f.category.value = item.category; f.priority.value = String(item.priority); f.notes.value = item.notes; f.price.value = '';
  f.price.closest('label').firstChild.textContent = 'New price (optional)';
  $('#formTitle').textContent = 'Edit item'; $('#saveItem').textContent = 'Save changes';
  f.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  f.name.focus({ preventScroll: true });
}

$('#importCsv').onclick = async () => {
  try {
    const items = parseItems($('#csv').value);
    state.items.unshift(...items); $('#csv').value = '';
    await save(); toast(`Imported ${items.length} item${items.length === 1 ? '' : 's'}`);
  } catch (err) { toast(err.message); }
};

// ---------- List ----------
function itemCard(item) {
  const s = stats(item);
  const priceInput = el('input', { type: 'number', min: 0, step: 'any', inputmode: 'decimal', placeholder: 'Today\'s price', 'aria-label': `Today's price for ${item.name}` });
  const log = el('form', { class: 'log', onsubmit: async e => {
    e.preventDefault();
    if (priceInput.value === '') return;
    try {
      const idx = state.items.findIndex(x => x.id === item.id);
      state.items[idx] = addPrice(state.items[idx], priceInput.value, today());
      const n = stats(state.items[idx]);
      await save();
      toast(n.belowTarget ? `${item.name} is at or below your target. Time to buy?` : n.atLowest ? 'Lowest price you have seen' : 'Price logged');
    } catch (err) { toast(err.message); }
  } }, priceInput, el('button', { type: 'submit' }, 'Log price'));

  const tags = [];
  if (s.belowTarget) tags.push(el('span', { class: 'badge ok' }, 'At or below target'));
  if (s.atLowest) tags.push(el('span', { class: 'badge ok' }, 'Lowest yet'));
  if (s.dropPct >= 5) tags.push(el('span', { class: 'badge warn' }, `${s.dropPct}% below peak`));
  tags.push(el('span', { class: 'badge none' }, PRIORITIES[item.priority] || 'Want'));

  return el('article', { class: 'wish' },
    el('div', {},
      el('h3', {}, item.url ? el('a', { href: item.url, target: '_blank', rel: 'noopener noreferrer' }, item.name) : item.name),
      el('p', { class: 'meta' }, [item.category, item.target != null ? `Target ${money(item.target)}` : null, s.lowest != null && s.lowest !== s.current ? `Lowest ${money(s.lowest)}` : null].filter(Boolean).join(' · ') || 'No category'),
      item.notes ? el('p', { class: 'meta' }, item.notes) : null,
      el('div', { class: 'tags' }, tags)),
    el('div', { class: 'price' },
      el('b', {}, money(s.current)),
      s.change ? el('span', { class: 'delta ' + (s.change < 0 ? 'down' : 'up') }, (s.change < 0 ? '▼ ' : '▲ ') + money(Math.abs(s.change))) : null,
      sparkline(item.history.map(h => h.price), { width: 100, height: 26 })),
    el('div', { class: 'wish-foot' }, log,
      el('div', { class: 'item-actions' },
        el('button', { type: 'button', onclick: () => edit(item) }, 'Edit'),
        el('button', { type: 'button', class: 'danger', onclick: async () => {
          if (!confirm(`Remove "${item.name}" from your wishlist?`)) return;
          state.items = state.items.filter(x => x.id !== item.id); await save(); toast('Removed');
        } }, 'Remove'))));
}

function render() {
  const cats = [...new Set(state.items.map(i => i.category).filter(Boolean))].sort();
  $('#categories').replaceChildren(...cats.map(c => el('option', { value: c })));
  const fc = $('#filterCategory'), chosen = fc.value;
  fc.replaceChildren(el('option', { value: '' }, 'All'), ...cats.map(c => el('option', { value: c, selected: c === chosen }, c)));

  const all = state.items.map(stats);
  $('#statItems').textContent = state.items.length;
  $('#statDeals').textContent = all.filter(s => s.belowTarget).length;
  const priced = all.filter(s => s.current != null);
  $('#statValue').textContent = priced.length ? money(priced.reduce((a, s) => a + s.current, 0)) : '—';
  $('#statSaved').textContent = priced.length ? money(priced.reduce((a, s) => a + (s.highest - s.current), 0)) : '—';

  const list = filterItems(state.items, { query: $('#search').value, category: fc.value, onlyDeals: $('#onlyDeals').checked, sort: $('#sort').value });
  $('#count').textContent = `${list.length} of ${state.items.length} item${state.items.length === 1 ? '' : 's'}`;
  $('#items').replaceChildren(...(list.length ? list.map(itemCard)
    : [el('p', { class: 'empty' }, state.items.length ? 'Nothing matches these filters.' : 'Your wishlist is empty. Add something you\'re waiting to buy.')]));
}
for (const id of ['#search', '#filterCategory', '#sort', '#onlyDeals']) $(id).addEventListener('input', render);

// ---------- Budget ----------
$('#budgetForm').onsubmit = e => {
  e.preventDefault();
  const plan = planBudget(state.items, e.target.budget.value);
  const box = $('#plan');
  if (!plan.picked.length) { box.replaceChildren(el('p', { class: 'small muted spaced' }, 'Nothing with a logged price fits this budget yet.')); return; }
  box.replaceChildren(
    el('ul', { class: 'plan-list' }, plan.picked.map(i => el('li', {}, el('span', {}, i.name, ' ', el('span', { class: 'muted small' }, PRIORITIES[i.priority])), el('b', {}, money(stats(i).current))))),
    el('p', { class: 'plan-total' }, `Total ${money(plan.total)} · ${money(plan.left)} left`));
};

// ---------- Settings & backups ----------
$('#currency').onchange = async e => { state.currency = e.target.value; await save(); };
$('#export').onclick = () => download(`wishlist-${today()}.json`, JSON.stringify(state, null, 2));
$('#importBtn').onclick = () => $('#importFile').click();
$('#importFile').onchange = async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    if (/\.csv$/i.test(file.name)) { const items = parseItems(text); state.items.unshift(...items); await save(); toast(`Imported ${items.length} items`); return; }
    const data = JSON.parse(text);
    if (!Array.isArray(data.items)) throw new Error('This is not a wishlist backup');
    if (state.items.length && !confirm('Replace your current wishlist with this backup?')) return;
    state = { ...state, items: data.items, currency: data.currency || state.currency };
    await save(); toast('Backup imported');
  } catch (err) { toast(err.message); }
};

// Bring over items saved by the earlier version of this page, once.
async function migrateOldRecords() {
  if (state.migrated) return;
  state.migrated = true;
  try {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('project-records-Amazon-Wishlist-filter');
      r.onupgradeneeded = () => { r.transaction.abort(); rej(new Error('none')); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    if (!db.objectStoreNames.contains('records')) return;
    const rows = await new Promise((res, rej) => { const q = db.transaction('records').objectStore('records').getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const old = rows.filter(r => r.entity === 'wishlist_item' && r.product_name);
    for (const r of old) {
      let item = newItem({ name: r.product_name, category: r.category || '' });
      if (Number.isFinite(r.current_price)) item = addPrice(item, r.current_price, String(r.updatedAt || r.createdAt || '').slice(0, 10) || today());
      state.items.push(item);
    }
    if (old.length) toast(`Brought over ${old.length} item${old.length === 1 ? '' : 's'} from the earlier version`);
  } catch { /* nothing to migrate */ }
}

state = await store.load();
$('#currency').value = state.currency;
await migrateOldRecords();
await save();
if (!store.persistent) $('#footer').textContent = 'This browser is blocking storage, so your list will be lost when you close the tab. Use Export to keep a copy.';
