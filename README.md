# ⚡ Troy's Dev Toolkit

A **zero-dependency** toolbox for everyday developer tasks. No frameworks, no build step,
no tracking — just plain HTML/CSS/JS that runs 100% in your browser.

## 🚀 Quick start

**Option 1** — double-click `index.html`. That's it.

**Option 2** — serve it locally:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## 🧰 The tools

| Tool | What it does |
|---|---|
| 🧾 **JSON Formatter** | Beautify, minify & validate JSON with syntax highlighting |
| 🔐 **Base64 Encode / Decode** | Unicode-safe conversion (emoji included) |
| 🔗 **URL Encode / Decode** | Component or full-URI percent-encoding |
| #️⃣ **Hash Generator** | Live SHA-1 / SHA-256 / SHA-384 / SHA-512 digests |
| 🆔 **UUID Generator** | Bulk RFC 4122 v4 UUIDs via `crypto.getRandomValues` |
| ⏱️ **Timestamp Converter** | Live clock + unix ↔ ISO ↔ human ↔ relative time |
| 🔤 **Case Converter** | camel / Pascal / snake / kebab / constant / title … |
| 🔑 **Password Generator** | Crypto-random passwords with entropy strength meter |
| 🎨 **Color Studio** | HEX ↔ RGB ↔ HSL, live preview, click-to-copy shades |
| 📝 **Lorem Ipsum** | Placeholder text by paragraphs, sentences or words |

## ⌨️ Shortcuts

- `/` — focus the tool search
- `Esc` — clear search

## 🛠️ Adding a tool

Open [`app.js`](app.js) and add an object to the `TOOLS` array:

```js
{
  id: 'slug',                    // unique id (used in the URL hash)
  name: 'Slug Generator',        // shown in sidebar + header
  icon: '🐛',                    // any emoji
  desc: 'Turn titles into URL slugs.',
  keywords: 'slug url seo',      // used by search
  render: () => `<div class="tool-card">…</div>`,
  init(root, ctx) {
    // wire up events; root is the #tool-panel element.
    // ctx.onCleanup(fn) runs when the user switches tools.
  },
}
```

The nav, routing (`#slug` deep links), search and copy-to-clipboard are all automatic.

## 🔒 Privacy

Everything runs locally in your browser. No network requests, no analytics, nothing leaves your machine.

## 📄 License

[MIT](LICENSE) © TechTroyAi
