/* ============================================================
   Troy's Dev Toolkit — app.js
   Zero dependencies · 100% client-side · add tools via TOOLS[]
   ============================================================ */
'use strict';

/* ---------------- tiny helpers ---------------- */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const debounce = (fn, ms = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext !== false) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (_) {
    return false;
  }
}

/* Copy buttons: data-copy-target="#selector" or data-copy-text="literal" */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy-target], [data-copy-text]');
  if (!btn) return;
  let text;
  if (btn.dataset.copyTarget) {
    const t = $(btn.dataset.copyTarget);
    text = t ? (t.value !== undefined ? t.value : t.textContent) : '';
  } else {
    text = btn.dataset.copyText;
  }
  if (!text) { toast('Nothing to copy yet'); return; }
  toast((await copyText(text)) ? 'Copied to clipboard ✨' : 'Copy failed — select & copy manually');
});

/* ---------------- pure-JS hash fallbacks (for non-secure contexts) ---------------- */

function sha1Sync(str) {
  const rotl = (n, s) => ((n << s) | (n >>> (32 - s))) >>> 0;
  const msg = new TextEncoder().encode(str);
  const ml = msg.length;
  const total = ((((ml + 9) + 63) >> 6) << 6);
  const bytes = new Uint8Array(total);
  bytes.set(msg);
  bytes[ml] = 0x80;
  const dv = new DataView(bytes.buffer);
  dv.setUint32(total - 4, (ml * 8) >>> 0);
  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  const w = new Uint32Array(80);
  for (let i = 0; i < total; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
    for (let j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let j = 0; j < 80; j++) {
      let f, k;
      if (j < 20)      { f = (b & c) | (~b & d);          k = 0x5A827999; }
      else if (j < 40) { f = b ^ c ^ d;                   k = 0x6ED9EBA1; }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else             { f = b ^ c ^ d;                   k = 0xCA62C1D6; }
      const t = (rotl(a, 5) + f + e + k + w[j]) >>> 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = t;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map(x => x.toString(16).padStart(8, '0')).join('');
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256Sync(str) {
  const rotr = (n, s) => ((n >>> s) | (n << (32 - s))) >>> 0;
  const msg = new TextEncoder().encode(str);
  const ml = msg.length;
  const total = ((((ml + 9) + 63) >> 6) << 6);
  const bytes = new Uint8Array(total);
  bytes.set(msg);
  bytes[ml] = 0x80;
  const dv = new DataView(bytes.buffer);
  dv.setUint32(total - 4, (ml * 8) >>> 0);
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Uint32Array(64);
  for (let i = 0; i < total; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + SHA256_K[j] + w[j]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    const upd = [a, b, c, d, e, f, g, hh];
    for (let j = 0; j < 8; j++) h[j] = (h[j] + upd[j]) >>> 0;
  }
  return h.map(x => x.toString(16).padStart(8, '0')).join('');
}

async function digest(algo, text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  }
  if (algo === 'SHA-256') return sha256Sync(text);
  if (algo === 'SHA-1')   return sha1Sync(text);
  throw new Error(algo + ' needs a secure context (https or localhost)');
}

/* ---------------- shared bits ---------------- */

function highlightJSON(json) {
  // escape only & and < — quotes must survive so the tokenizer can match strings
  const safe = json.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return safe.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let cls = 'j-num';
      if (m.startsWith('"')) cls = m.endsWith(':') ? 'j-key' : 'j-str';
      else if (m === 'true' || m === 'false') cls = 'j-bool';
      else if (m === 'null') cls = 'j-null';
      return '<span class="' + cls + '">' + m + '</span>';
    }
  );
}

function relTime(date, now = new Date()) {
  const diff = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diff);
  const label = (n, u) => Math.abs(n) + ' ' + u + (Math.abs(n) === 1 ? '' : 's');
  let out;
  if (abs < 5) out = 'just now';
  else if (abs < 60) out = label(diff, 'second');
  else if (abs < 3600) out = label(Math.round(diff / 60), 'minute');
  else if (abs < 86400) out = label(Math.round(diff / 3600), 'hour');
  else if (abs < 2592000) out = label(Math.round(diff / 86400), 'day');
  else out = label(Math.round(diff / 2592000), 'month');
  if (out === 'just now') return out;
  return diff < 0 ? out + ' ago' : 'in ' + out;
}

/* ---------------- tool registry ---------------- */
/* Add a tool: push an object with id, name, icon, desc, keywords,
   render() -> HTML string, init(root, ctx) -> wire up behavior.
   ctx.onCleanup(fn) registers teardown when switching tools.       */

const TOOLS = [

  /* ---------- JSON Formatter ---------- */
  {
    id: 'json',
    name: 'JSON Formatter',
    icon: '🧾',
    desc: 'Beautify, minify and validate JSON with syntax highlighting.',
    keywords: 'json format pretty print minify validate lint parse',
    render: () => `
      <div class="tool-card">
        <label class="lbl" for="json-in">Input</label>
        <textarea id="json-in" spellcheck="false" placeholder="Paste JSON here, or load a sample…"></textarea>
        <div class="btn-row">
          <button class="btn primary" id="json-format">Format</button>
          <button class="btn" id="json-minify">Minify</button>
          <button class="btn" id="json-validate">Validate</button>
          <button class="btn ghost" id="json-sample">Sample</button>
          <button class="btn ghost" id="json-clear">Clear</button>
        </div>
        <div class="out-head">
          <label class="lbl">Output</label>
          <button class="btn tiny" data-copy-target="#json-out">Copy</button>
        </div>
        <pre class="output" id="json-out"></pre>
        <div class="status" id="json-status"></div>
      </div>`,
    init(root) {
      const $in = $('#json-in', root), $out = $('#json-out', root), $st = $('#json-status', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const run = (mode) => {
        const t = $in.value.trim();
        if (!t) { $out.textContent = ''; setStatus('Waiting for input…'); return; }
        try {
          const obj = JSON.parse(t);
          const res = mode === 'min' ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
          $out.innerHTML = mode === 'min' ? highlightJSON(res) : highlightJSON(res);
          setStatus('✓ Valid JSON — ' + res.length.toLocaleString() + ' chars', 'ok');
        } catch (err) {
          $out.textContent = '';
          setStatus('✗ ' + err.message, 'err');
        }
      };
      const SAMPLE = {
        name: 'Troy',
        role: 'developer',
        stack: ['JS', 'Python', 'Go'],
        active: true,
        projects: 12,
        meta: { city: 'Davao', timezone: 'UTC+8', tags: null },
      };
      $('#json-format', root).onclick = () => run('pretty');
      $('#json-minify', root).onclick = () => run('min');
      $('#json-validate', root).onclick = () => run('pretty');
      $('#json-sample', root).onclick = () => { $in.value = JSON.stringify(SAMPLE, null, 2); run('pretty'); };
      $('#json-clear', root).onclick = () => { $in.value = ''; $out.textContent = ''; setStatus(''); };
      setStatus('Waiting for input…');
    },
  },

  /* ---------- Base64 ---------- */
  {
    id: 'base64',
    name: 'Base64 Encode / Decode',
    icon: '🔐',
    desc: 'Convert text to and from Base64 — Unicode-safe, including emoji.',
    keywords: 'base64 encode decode b64 atob btoa',
    render: () => `
      <div class="tool-card">
        <label class="lbl" for="b64-in">Input</label>
        <textarea id="b64-in" class="small" spellcheck="false" placeholder="Type text to encode, or paste Base64 to decode…"></textarea>
        <div class="btn-row">
          <button class="btn primary" id="b64-encode">Encode →</button>
          <button class="btn" id="b64-decode">← Decode</button>
          <button class="btn ghost" id="b64-swap">⇅ Swap</button>
          <button class="btn ghost" id="b64-clear">Clear</button>
        </div>
        <div class="out-head">
          <label class="lbl" for="b64-out">Output</label>
          <button class="btn tiny" data-copy-target="#b64-out">Copy</button>
        </div>
        <textarea id="b64-out" class="small" readonly spellcheck="false"></textarea>
        <div class="status" id="b64-status"></div>
      </div>`,
    init(root) {
      const $in = $('#b64-in', root), $out = $('#b64-out', root), $st = $('#b64-status', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const encode = () => {
        try {
          const bytes = new TextEncoder().encode($in.value);
          let bin = '';
          for (const b of bytes) bin += String.fromCharCode(b);
          $out.value = btoa(bin);
          setStatus('✓ Encoded ' + $in.value.length + ' chars → ' + $out.value.length + ' chars', 'ok');
        } catch (e) { setStatus('✗ ' + e.message, 'err'); }
      };
      const decode = () => {
        try {
          const bin = atob($in.value.trim());
          const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
          $out.value = new TextDecoder().decode(bytes);
          setStatus('✓ Decoded successfully', 'ok');
        } catch (_) {
          $out.value = '';
          setStatus('✗ Invalid Base64 input', 'err');
        }
      };
      $('#b64-encode', root).onclick = encode;
      $('#b64-decode', root).onclick = decode;
      $('#b64-swap', root).onclick = () => { $in.value = $out.value; $out.value = ''; setStatus('Swapped — hit Encode or Decode.'); };
      $('#b64-clear', root).onclick = () => { $in.value = ''; $out.value = ''; setStatus(''); };
      setStatus('Ready.');
    },
  },

  /* ---------- URL Encode / Decode ---------- */
  {
    id: 'url',
    name: 'URL Encode / Decode',
    icon: '🔗',
    desc: 'Escape and unescape URLs or query-string components.',
    keywords: 'url uri encode decode escape percent component query',
    render: () => `
      <div class="tool-card">
        <label class="lbl" for="url-in">Input</label>
        <textarea id="url-in" class="small" spellcheck="false" placeholder="https://example.com/search?q=hello world&lang=en"></textarea>
        <div class="btn-row">
          <button class="btn primary" id="url-encode">Encode</button>
          <button class="btn" id="url-decode">Decode</button>
          <button class="btn ghost" id="url-swap">⇅ Swap</button>
          <button class="btn ghost" id="url-clear">Clear</button>
          <select id="url-mode" style="width:auto">
            <option value="component">Component</option>
            <option value="full">Full URL</option>
          </select>
        </div>
        <div class="out-head">
          <label class="lbl" for="url-out">Output</label>
          <button class="btn tiny" data-copy-target="#url-out">Copy</button>
        </div>
        <textarea id="url-out" class="small" readonly spellcheck="false"></textarea>
        <div class="status" id="url-status"></div>
      </div>`,
    init(root) {
      const $in = $('#url-in', root), $out = $('#url-out', root), $st = $('#url-status', root),
            $mode = $('#url-mode', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const run = (dir) => {
        const comp = $mode.value === 'component';
        try {
          $out.value = dir === 'enc'
            ? (comp ? encodeURIComponent($in.value) : encodeURI($in.value))
            : (comp ? decodeURIComponent($in.value) : decodeURI($in.value));
          setStatus('✓ Done', 'ok');
        } catch (_) {
          $out.value = '';
          setStatus('✗ Malformed percent-encoding', 'err');
        }
      };
      $('#url-encode', root).onclick = () => run('enc');
      $('#url-decode', root).onclick = () => run('dec');
      $('#url-swap', root).onclick = () => { const v = $in.value; $in.value = $out.value; $out.value = v; setStatus('Swapped.'); };
      $('#url-clear', root).onclick = () => { $in.value = ''; $out.value = ''; setStatus(''); };
      setStatus('Component mode keeps /?& intact? Nope — it escapes everything. Full URL mode preserves structural characters.');
    },
  },

  /* ---------- Hash Generator ---------- */
  {
    id: 'hash',
    name: 'Hash Generator',
    icon: '#️⃣',
    desc: 'SHA-1 / SHA-256 / SHA-384 / SHA-512 digests, computed live as you type.',
    keywords: 'hash sha sha1 sha256 sha512 digest checksum',
    render: () => `
      <div class="tool-card">
        <div class="out-head">
          <label class="lbl" for="hash-algo">Algorithm</label>
        </div>
        <select id="hash-algo">
          <option>SHA-256</option>
          <option>SHA-1</option>
          <option>SHA-384</option>
          <option>SHA-512</option>
        </select>
        <label class="lbl" for="hash-in">Input</label>
        <textarea id="hash-in" class="small" spellcheck="false" placeholder="Type anything — the hash updates live…"></textarea>
        <div class="out-head">
          <label class="lbl">Digest (hex)</label>
          <button class="btn tiny" data-copy-target="#hash-out">Copy</button>
        </div>
        <pre class="output" id="hash-out"></pre>
        <div class="status" id="hash-status"></div>
      </div>`,
    init(root, ctx) {
      const $in = $('#hash-in', root), $out = $('#hash-out', root),
            $st = $('#hash-status', root), $algo = $('#hash-algo', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const update = async () => {
        const text = $in.value;
        if (!text) { $out.textContent = ''; setStatus('Waiting for input…'); return; }
        try {
          const hex = await digest($algo.value, text);
          $out.textContent = hex;
          setStatus('✓ ' + $algo.value + ' · input ' + text.length.toLocaleString() + ' chars', 'ok');
        } catch (e) {
          $out.textContent = '';
          setStatus('✗ ' + e.message, 'err');
        }
      };
      $in.addEventListener('input', debounce(update, 120));
      $algo.addEventListener('change', update);
      ctx.onCleanup(() => {});
      setStatus('Waiting for input…');
    },
  },

  /* ---------- UUID Generator ---------- */
  {
    id: 'uuid',
    name: 'UUID Generator',
    icon: '🆔',
    desc: 'Bulk-generate RFC 4122 version-4 UUIDs with one click.',
    keywords: 'uuid guid v4 random id identifier',
    render: () => `
      <div class="tool-card">
        <label class="lbl" for="uuid-count">How many? (1–200)</label>
        <input type="number" id="uuid-count" min="1" max="200" value="5">
        <div class="btn-row">
          <button class="btn primary" id="uuid-gen">Generate</button>
          <button class="btn" data-copy-target="#uuid-all-raw" id="uuid-copy-all">Copy all</button>
          <button class="btn ghost" id="uuid-clear">Clear</button>
        </div>
        <div id="uuid-list"></div>
        <textarea id="uuid-all-raw" hidden></textarea>
        <div class="status" id="uuid-status"></div>
      </div>`,
    init(root) {
      const $list = $('#uuid-list', root), $count = $('#uuid-count', root),
            $st = $('#uuid-status', root), $raw = $('#uuid-all-raw', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const v4 = () => {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        const b = new Uint8Array(16);
        (crypto && crypto.getRandomValues ? crypto : { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } }).getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
        return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
      };
      const generate = () => {
        let n = parseInt($count.value, 10);
        if (!Number.isFinite(n)) n = 5;
        n = Math.min(200, Math.max(1, n));
        $count.value = n;
        const ids = Array.from({ length: n }, v4);
        $raw.value = ids.join('\n');
        $list.innerHTML = ids.map(u =>
          '<div class="list-row"><span class="val">' + esc(u) + '</span>' +
          '<button class="btn tiny" data-copy-text="' + esc(u) + '">Copy</button></div>'
        ).join('');
        setStatus('✓ Generated ' + n + ' UUID' + (n === 1 ? '' : 's'), 'ok');
      };
      $('#uuid-gen', root).onclick = generate;
      $('#uuid-clear', root).onclick = () => { $list.innerHTML = ''; $raw.value = ''; setStatus(''); };
      generate();
    },
  },

  /* ---------- Timestamp Converter ---------- */
  {
    id: 'timestamp',
    name: 'Timestamp Converter',
    icon: '⏱️',
    desc: 'Live clock plus unix ↔ ISO ↔ human conversion, with relative time.',
    keywords: 'timestamp unix epoch time date iso convert utc',
    render: () => `
      <div class="tool-card">
        <h3>Right now</h3>
        <div class="now-grid">
          <div class="now-cell"><div class="k">Unix (s)</div><div class="v" id="now-s"></div></div>
          <div class="now-cell"><div class="k">Unix (ms)</div><div class="v" id="now-ms"></div></div>
          <div class="now-cell"><div class="k">ISO 8601</div><div class="v" id="now-iso"></div></div>
          <div class="now-cell"><div class="k">Your local time</div><div class="v" id="now-local"></div></div>
        </div>
      </div>
      <div class="tool-card">
        <h3>Convert</h3>
        <label class="lbl" for="ts-in">Unix seconds / milliseconds / microseconds, or an ISO date string</label>
        <input type="text" id="ts-in" spellcheck="false" placeholder="e.g. 1712345678 · 1712345678901 · 2024-04-05T12:34:56Z">
        <div class="btn-row">
          <button class="btn primary" id="ts-convert">Convert</button>
          <button class="btn ghost" id="ts-now">Use current time</button>
          <button class="btn ghost" id="ts-clear">Clear</button>
        </div>
        <div id="ts-out"></div>
        <div class="status" id="ts-status"></div>
      </div>`,
    init(root, ctx) {
      const tick = () => {
        const now = new Date();
        const set = (id, v) => { const el = $(id, root); if (el) el.textContent = v; };
        set('#now-s', Math.floor(now.getTime() / 1000).toString());
        set('#now-ms', now.getTime().toString());
        set('#now-iso', now.toISOString());
        set('#now-local', now.toLocaleString());
      };
      tick();
      const timer = setInterval(tick, 1000);
      ctx.onCleanup(() => clearInterval(timer));

      const $in = $('#ts-in', root), $out = $('#ts-out', root), $st = $('#ts-status', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };

      const parse = (raw) => {
        const t = raw.trim();
        if (/^\d{10}$/.test(t))  return new Date(parseInt(t, 10) * 1000);
        if (/^\d{13}$/.test(t))  return new Date(parseInt(t, 10));
        if (/^\d{16}$/.test(t))  return new Date(parseInt(t, 10) / 1000);
        const d = new Date(t);
        return isNaN(d.getTime()) ? null : d;
      };

      const row = (k, v) =>
        '<div class="list-row"><span class="lbl-inline">' + esc(k) + '</span>' +
        '<span class="val">' + esc(v) + '</span>' +
        '<button class="btn tiny" data-copy-text="' + esc(v) + '">Copy</button></div>';

      const convert = () => {
        const d = parse($in.value);
        if (!$in.value.trim()) { $out.innerHTML = ''; setStatus('Waiting for input…'); return; }
        if (!d) { $out.innerHTML = ''; setStatus('✗ Could not parse that as a timestamp or date', 'err'); return; }
        $out.innerHTML =
          row('Unix (s)', Math.floor(d.getTime() / 1000).toString()) +
          row('Unix (ms)', d.getTime().toString()) +
          row('ISO 8601', d.toISOString()) +
          row('Local', d.toLocaleString()) +
          row('UTC', d.toUTCString()) +
          row('Relative', relTime(d));
        setStatus('✓ Parsed', 'ok');
      };

      $('#ts-convert', root).onclick = convert;
      $('#ts-now', root).onclick = () => { $in.value = Math.floor(Date.now() / 1000).toString(); convert(); };
      $('#ts-clear', root).onclick = () => { $in.value = ''; $out.innerHTML = ''; setStatus(''); };
      $in.addEventListener('keydown', (e) => { if (e.key === 'Enter') convert(); });
      setStatus('Waiting for input…');
    },
  },

  /* ---------- Case Converter ---------- */
  {
    id: 'case',
    name: 'Case Converter',
    icon: '🔤',
    desc: 'One input, every convention — camel, snake, kebab, Pascal and more.',
    keywords: 'case camel snake kebab pascal title capitalize convert naming',
    render: () => `
      <div class="tool-card">
        <label class="lbl" for="case-in">Input</label>
        <textarea id="case-in" class="small" spellcheck="false" placeholder="e.g. user profile page URL · userProfilePageURL · user_profile_page"></textarea>
        <div id="case-out"></div>
        <div class="status" id="case-status"></div>
      </div>`,
    init(root) {
      const $in = $('#case-in', root), $out = $('#case-out', root), $st = $('#case-status', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const words = (text) =>
        text.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .split(/[\s\-_.]+/)
            .map(w => w.trim())
            .filter(Boolean);
      const lower = (ws) => ws.map(w => w.toLowerCase());
      const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      const cases = {
        'camelCase':  (ws) => lower(ws).map((w, i) => i ? cap(w) : w).join(''),
        'PascalCase': (ws) => lower(ws).map(cap).join(''),
        'snake_case': (ws) => lower(ws).join('_'),
        'kebab-case': (ws) => lower(ws).join('-'),
        'CONSTANT_CASE': (ws) => lower(ws).join('_').toUpperCase(),
        'dot.case':   (ws) => lower(ws).join('.'),
        'Title Case': (ws) => ws.map(cap).join(' '),
        'Sentence case': (ws) => { const l = lower(ws); return l.map((w, i) => i ? w : cap(w)).join(' '); },
      };
      const update = () => {
        const ws = words($in.value);
        if (!ws.length) { $out.innerHTML = ''; setStatus('Waiting for input…'); return; }
        $out.innerHTML = Object.entries(cases).map(([name, fn]) => {
          const v = fn(ws);
          return '<div class="list-row"><span class="lbl-inline">' + esc(name) + '</span>' +
            '<span class="val">' + esc(v) + '</span>' +
            '<button class="btn tiny" data-copy-text="' + esc(v) + '">Copy</button></div>';
        }).join('');
        setStatus('✓ ' + ws.length + ' word' + (ws.length === 1 ? '' : 's'), 'ok');
      };
      $in.addEventListener('input', debounce(update, 120));
      update();
    },
  },

  /* ---------- Password Generator ---------- */
  {
    id: 'password',
    name: 'Password Generator',
    icon: '🔑',
    desc: 'Cryptographically random passwords with entropy-based strength meter.',
    keywords: 'password random generator secure entropy strength',
    render: () => `
      <div class="tool-card">
        <div class="out-head">
          <label class="lbl" for="pw-out">Password</label>
          <div>
            <button class="btn tiny" id="pw-regen">↻ Regenerate</button>
            <button class="btn tiny" data-copy-target="#pw-out">Copy</button>
          </div>
        </div>
        <input type="text" id="pw-out" class="big-out" readonly spellcheck="false">
        <div class="meter"><i id="pw-meter-bar"></i></div>
        <div class="meter-label" id="pw-meter-label"></div>
        <label class="lbl" for="pw-len">Length: <span id="pw-len-label"></span></label>
        <div class="range-row">
          <input type="range" id="pw-len" min="6" max="64" value="20">
        </div>
        <div class="check-row">
          <label><input type="checkbox" id="pw-lower" checked> a–z</label>
          <label><input type="checkbox" id="pw-upper" checked> A–Z</label>
          <label><input type="checkbox" id="pw-digit" checked> 0–9</label>
          <label><input type="checkbox" id="pw-symbol" checked> !@#$%</label>
          <label><input type="checkbox" id="pw-noambiguous"> Exclude look-alikes (il1Lo0O)</label>
        </div>
        <div class="status" id="pw-status"></div>
      </div>`,
    init(root) {
      const $out = $('#pw-out', root), $len = $('#pw-len', root), $lenLabel = $('#pw-len-label', root),
            $bar = $('#pw-meter-bar', root), $mLabel = $('#pw-meter-label', root), $st = $('#pw-status', root);
      const cbs = ['lower', 'upper', 'digit', 'symbol', 'noambiguous'].map(k => $('#pw-' + k, root));
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const rndInt = (max) => {
        if (window.crypto && crypto.getRandomValues) {
          const a = new Uint32Array(1);
          crypto.getRandomValues(a);
          return a[0] % max;
        }
        return Math.floor(Math.random() * max);
      };
      const SETS = {
        lower: 'abcdefghijklmnopqrstuvwxyz',
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        digit: '0123456789',
        symbol: '!@#$%^&*()-_=+[]{};:,.?/',
      };
      const AMBIG = /[il1Lo0O]/g;
      const generate = () => {
        const len = parseInt($len.value, 10);
        $lenLabel.textContent = len;
        const chosen = cbs.slice(0, 4).filter(cb => cb.checked);
        let pools = chosen.map(cb => SETS[cb.id.slice(3)]);
        if (cbs[4].checked) pools = pools.map(s => s.replace(AMBIG, ''));
        if (!pools.length || pools.every(p => !p.length)) {
          $out.value = '';
          setStatus('✗ Pick at least one character set', 'err');
          $bar.style.width = '0';
          $mLabel.textContent = '';
          return;
        }
        const all = pools.join('');
        const chars = pools.map(p => p[rndInt(p.length)]);          // guarantee one of each
        while (chars.length < len) chars.push(all[rndInt(all.length)]);
        for (let i = chars.length - 1; i > 0; i--) {                // Fisher–Yates shuffle
          const j = rndInt(i + 1);
          [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        const pw = chars.slice(0, len).join('');
        $out.value = pw;
        const bits = Math.round(len * Math.log2(all.length) * 10) / 10;
        let cls, label;
        if (bits < 45)       { cls = 'st-weak';   label = 'Weak'; }
        else if (bits < 70)  { cls = 'st-fair';   label = 'Fair'; }
        else if (bits < 100) { cls = 'st-strong'; label = 'Strong'; }
        else                 { cls = 'st-max';    label = 'Excellent'; }
        const pct = Math.min(100, Math.round(bits / 128 * 100));
        $bar.style.width = pct + '%';
        $bar.className = cls;
        $mLabel.textContent = label + ' · ~' + bits + ' bits of entropy · pool of ' + all.length + ' chars';
        setStatus('✓ Generated with crypto.getRandomValues', 'ok');
      };
      $('#pw-regen', root).onclick = generate;
      $len.addEventListener('input', generate);
      cbs.forEach(cb => cb.addEventListener('change', generate));
      generate();
    },
  },

  /* ---------- Color Studio ---------- */
  {
    id: 'color',
    name: 'Color Studio',
    icon: '🎨',
    desc: 'HEX ↔ RGB ↔ HSL conversion, live preview and an auto-generated shade palette.',
    keywords: 'color hex rgb hsl convert palette shades picker css',
    render: () => `
      <div class="tool-card">
        <div class="grid2">
          <div>
            <label class="lbl" for="col-hex">HEX</label>
            <input type="text" id="col-hex" spellcheck="false" value="#6c8cff" maxlength="7">
          </div>
          <div>
            <label class="lbl" for="col-pick">Picker</label>
            <input type="color" id="col-pick" value="#6c8cff">
          </div>
        </div>
        <div class="color-preview" id="col-preview"></div>
        <div id="col-rows"></div>
        <label class="lbl">Shades — click to copy</label>
        <div class="swatches" id="col-swatches"></div>
        <div class="status" id="col-status"></div>
      </div>`,
    init(root) {
      const $hex = $('#col-hex', root), $pick = $('#col-pick', root),
            $prev = $('#col-preview', root), $rows = $('#col-rows', root),
            $sw = $('#col-swatches', root), $st = $('#col-status', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };

      const hexToRgb = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });
      const toHex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
      const rgbToHex = ({ r, g, b }) => '#' + toHex(r) + toHex(g) + toHex(b);
      const rgbToHsl = ({ r, g, b }) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
          else if (max === g) h = ((b - r) / d + 2);
          else h = ((r - g) / d + 4);
          h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
      };
      const mix = (c, target, t) => ({ r: c.r + (target - c.r) * t, g: c.g + (target - c.g) * t, b: c.b + (target - c.b) * t });

      const row = (k, v) =>
        '<div class="list-row"><span class="lbl-inline">' + esc(k) + '</span>' +
        '<span class="val">' + esc(v) + '</span>' +
        '<button class="btn tiny" data-copy-text="' + esc(v) + '">Copy</button></div>';

      const apply = (hex, fromPicker) => {
        if (!fromPicker) $pick.value = hex;
        $hex.value = hex.toUpperCase();
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb);
        $prev.style.background = hex;
        $rows.innerHTML =
          row('HEX', hex.toUpperCase()) +
          row('RGB', 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')') +
          row('HSL', 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)');
        const lum = Math.round((0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 2.55);
        const steps = [0.7, 0.45, 0.2, 0, 0.2, 0.45, 0.7];
        const targets = [255, 255, 255, null, 0, 0, 0];
        $sw.innerHTML = steps.map((t, i) => {
          const hx = targets[i] === null ? hex : rgbToHex(mix(rgb, targets[i], t));
          return '<button class="swatch" data-copy-text="' + hx + '" title="Copy ' + hx + '">' +
            '<span class="chip" style="background:' + hx + '"></span>' +
            '<span class="code">' + hx + '</span></button>';
        }).join('');
        setStatus('✓ Perceived luminance ~' + lum + '%', 'ok');
      };

      $pick.addEventListener('input', () => apply($pick.value, true));
      $hex.addEventListener('change', () => {
        let h = $hex.value.trim().replace(/^#/, '');
        if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/(.)/g, '$1$1');
        if (/^[0-9a-f]{6}$/i.test(h)) h = '#' + h;
        if (/^#[0-9a-f]{6}$/i.test(h)) apply(h.toLowerCase());
        else { setStatus('✗ Enter a valid HEX color like #6c8cff', 'err'); $hex.value = $pick.value.toUpperCase(); }
      });
      apply('#6c8cff');
    },
  },

  /* ---------- Lorem Ipsum ---------- */
  {
    id: 'lorem',
    name: 'Lorem Ipsum Generator',
    icon: '📝',
    desc: 'Placeholder text by paragraphs, sentences or words.',
    keywords: 'lorem ipsum placeholder dummy text filler',
    render: () => `
      <div class="tool-card">
        <div class="grid2">
          <div>
            <label class="lbl" for="lorem-count">Amount</label>
            <input type="number" id="lorem-count" min="1" max="100" value="3">
          </div>
          <div>
            <label class="lbl" for="lorem-unit">Unit</label>
            <select id="lorem-unit">
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn primary" id="lorem-gen">Generate</button>
          <button class="btn" data-copy-target="#lorem-out">Copy</button>
        </div>
        <div class="output" id="lorem-out" style="white-space:pre-wrap"></div>
        <div class="status" id="lorem-status"></div>
      </div>`,
    init(root) {
      const $count = $('#lorem-count', root), $unit = $('#lorem-unit', root),
            $out = $('#lorem-out', root), $st = $('#lorem-status', root);
      const setStatus = (msg, cls) => { $st.textContent = msg; $st.className = 'status' + (cls ? ' ' + cls : ''); };
      const BANK = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore ' +
        'et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea ' +
        'commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur ' +
        'excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');
      const rint = (n) => Math.floor(Math.random() * n);
      const sentence = (first) => {
        const n = 8 + rint(9);
        const ws = Array.from({ length: n }, () => BANK[rint(BANK.length)]);
        const s = (first ? 'Lorem ipsum dolor sit amet, ' + ws.slice(0, n - 5).join(' ') : ws.join(' '));
        return s.charAt(0).toUpperCase() + s.slice(1) + '.';
      };
      const paragraph = (first) => Array.from({ length: 4 + rint(4) }, (_, i) => sentence(first && i === 0)).join(' ');
      const generate = () => {
        let n = parseInt($count.value, 10) || 1;
        n = Math.min(100, Math.max(1, n));
        let text;
        if ($unit.value === 'words')      text = ['Lorem ipsum', ...Array.from({ length: Math.max(0, n - 2) }, () => BANK[rint(BANK.length)])].slice(0, n).join(' ');
        else if ($unit.value === 'sentences') text = Array.from({ length: n }, (_, i) => sentence(i === 0)).join(' ');
        else text = Array.from({ length: n }, (_, i) => paragraph(i === 0)).join('\n\n');
        $out.textContent = text;
        setStatus('✓ ' + text.split(/\s+/).length + ' words generated', 'ok');
      };
      $('#lorem-gen', root).onclick = generate;
      generate();
    },
  },
];

/* ---------------- app shell ---------------- */

let cleanupFns = [];

function selectTool(id) {
  const tool = TOOLS.find(t => t.id === id) || TOOLS[0];

  cleanupFns.forEach(fn => { try { fn(); } catch (_) {} });
  cleanupFns = [];

  $$('.tool-link').forEach(a => a.classList.toggle('active', a.dataset.id === tool.id));
  $('#tool-title').textContent = tool.name;
  $('#tool-desc').textContent = tool.desc;

  const panel = $('#tool-panel');
  panel.innerHTML = tool.render();
  tool.init(panel, { onCleanup: (fn) => cleanupFns.push(fn) });
  const main = $('#main');
  if (main && typeof main.scrollIntoView === 'function') main.scrollIntoView({ block: 'start' });
}

function boot() {
  $('#tool-nav').innerHTML = TOOLS.map(t =>
    '<a class="tool-link" href="#' + t.id + '" data-id="' + t.id + '">' +
    '<span class="icon" aria-hidden="true">' + t.icon + '</span><span class="name">' + esc(t.name) + '</span></a>'
  ).join('');
  $('#tool-count').textContent = TOOLS.length + ' tools';

  window.addEventListener('hashchange', () => selectTool(location.hash.slice(1)));
  selectTool(location.hash.slice(1));

  const search = $('#tool-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    const links = $$('.tool-link');
    let firstVisible = null;
    links.forEach(a => {
      const tool = TOOLS.find(t => t.id === a.dataset.id);
      const hit = !q || (tool.name + ' ' + tool.keywords + ' ' + tool.desc).toLowerCase().includes(q);
      a.classList.toggle('hidden', !hit);
      if (hit && !firstVisible) firstVisible = a;
    });
    if (firstVisible && q && firstVisible.dataset.id !== (TOOLS.find(t => t.id === location.hash.slice(1)) || TOOLS[0]).id) {
      location.hash = firstVisible.dataset.id;
    }
    if (q && !firstVisible) {
      $('#tool-title').textContent = 'No matches';
      $('#tool-desc').textContent = 'Nothing matches “' + q + '” — try another search.';
      $('#tool-panel').innerHTML = '';
    } else if (!q && !location.hash) {
      selectTool(TOOLS[0].id);
    }
  });

  document.addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test((document.activeElement || {}).tagName || '');
    if (e.key === '/' && !typing) { e.preventDefault(); search.focus(); }
    if (e.key === 'Escape' && document.activeElement === search) {
      search.value = '';
      search.dispatchEvent(new Event('input'));
      search.blur();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
