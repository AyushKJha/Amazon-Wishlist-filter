// Saves one JSON state object in IndexedDB, falling back to memory when storage is blocked.
export function createStore(name, initial) {
  let memory = null, dbPromise = null;
  const open = () => dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return {
    persistent: true,
    async load() {
      try {
        const db = await open();
        const value = await new Promise((res, rej) => {
          const r = db.transaction('kv').objectStore('kv').get('state');
          r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
        });
        return { ...initial(), ...(value || {}) };
      } catch {
        this.persistent = false;
        return memory ?? initial();
      }
    },
    async save(state) {
      memory = state;
      if (!this.persistent) return;
      try {
        const db = await open();
        await new Promise((res, rej) => {
          const tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(structuredClone(state), 'state');
          tx.oncomplete = res; tx.onerror = tx.onabort = () => rej(tx.error);
        });
      } catch { this.persistent = false; }
    },
  };
}

export function download(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

export function sparkline(values, { width = 120, height = 28 } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'spark'); svg.setAttribute('aria-hidden', 'true');
  if (values.length < 2) return svg;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1) * (width - 4) + 2).toFixed(1)},${(height - 3 - (v - min) / span * (height - 6)).toFixed(1)}`);
  const line = document.createElementNS(ns, 'polyline');
  line.setAttribute('points', pts.join(' '));
  svg.append(line);
  return svg;
}

export const when = iso => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
