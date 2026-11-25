import test from 'node:test';
import assert from 'node:assert/strict';
import { stats, dealScore, addPrice, filterItems, planBudget, parseItems, newItem, safeUrl } from '../docs/lib/deals.js';

const withPrices = (fields, prices) => prices.reduce((it, p, i) => addPrice(it, p, `2026-11-${String(i + 1).padStart(2, '0')}`), newItem(fields));

test('tracks current, lowest, highest and drop', () => {
  const s = stats(withPrices({ name: 'Headphones', target: 2500 }, [3000, 2800, 2400]));
  assert.equal(s.current, 2400);
  assert.equal(s.highest, 3000);
  assert.equal(s.dropPct, 20);
  assert.equal(s.belowTarget, true);
  assert.equal(s.atLowest, true);
  assert.equal(s.change, -400);
});

test('one price per day, kept in date order', () => {
  let it = newItem({ name: 'x' });
  it = addPrice(it, 10, '2026-11-02');
  it = addPrice(it, 12, '2026-11-01');
  it = addPrice(it, 9, '2026-11-02');
  assert.deepEqual(it.history.map(h => h.price), [12, 9]);
  assert.throws(() => addPrice(it, -1), /valid price/);
});

test('deal score rewards drops and targets', () => {
  const flat = withPrices({ name: 'a' }, [100, 100]);
  const deal = withPrices({ name: 'b', target: 80 }, [100, 75]);
  assert.ok(dealScore(deal) > dealScore(flat));
  assert.equal(dealScore(newItem({ name: 'c' })), 0);
});

test('filters and sorts', () => {
  const items = [withPrices({ name: 'Book', category: 'Books' }, [500]), withPrices({ name: 'Phone', category: 'Electronics', target: 20000 }, [25000, 19000])];
  assert.deepEqual(filterItems(items, { onlyDeals: true }).map(i => i.name), ['Phone']);
  assert.deepEqual(filterItems(items, { sort: 'price' }).map(i => i.name), ['Book', 'Phone']);
  assert.deepEqual(filterItems(items, { query: 'book' }).map(i => i.name), ['Book']);
});

test('budget planner picks the best set that fits', () => {
  const items = [
    withPrices({ name: 'Must', priority: 3 }, [600]),
    withPrices({ name: 'Want A', priority: 2 }, [300]),
    withPrices({ name: 'Want B', priority: 2 }, [300]),
    withPrices({ name: 'Nice', priority: 1 }, [100]),
  ];
  const plan = planBudget(items, 1000);
  assert.deepEqual(plan.picked.map(i => i.name).sort(), ['Must', 'Nice', 'Want A'].sort());
  assert.equal(plan.total, 1000);
  assert.equal(plan.left, 0);
  assert.deepEqual(planBudget(items, 50).picked, []);
  // A must-have beats several cheaper wants that would fill the budget instead.
  const big = [withPrices({ name: 'Headphones', priority: 3 }, [900]), ...[1, 2, 3].map(n => withPrices({ name: 'Want ' + n, priority: 2 }, [300]))];
  assert.deepEqual(planBudget(big, 1000).picked.map(i => i.name), ['Headphones']);
});

test('imports CSV with loose headers and currency symbols', () => {
  const items = parseItems('Product Name,Current Price,Target,Category,Link\n"Kindle, 16GB","₹9,999",8999,Electronics,https://example.com/k\nMug,299,,Home,javascript:alert(1)\n');
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Kindle, 16GB');
  assert.equal(stats(items[0]).current, 9999);
  assert.equal(items[0].target, 8999);
  assert.equal(items[1].url, '');
  assert.throws(() => parseItems('price\n10'), /name column/);
});

test('only http links are kept', () => {
  assert.equal(safeUrl('https://www.amazon.in/dp/B0'), 'https://www.amazon.in/dp/B0');
  assert.equal(safeUrl('data:text/html,hi'), '');
});
