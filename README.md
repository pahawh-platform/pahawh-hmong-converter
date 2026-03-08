# pahawh-hmong-converter

A fast, dependency-free JavaScript library for converting Hmong RPA (Romanized Popular Alphabet) to Pahawh Hmong Unicode script — and back. The first open-source Hmong RPA ↔ Pahawh converter on the web.

```html
<p class="to-pahawh">Nyob Zoo sawv daws</p>
<!-- becomes → 𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰 -->
```

**[Live Demo →](https://pahawh-platform.github.io/pahawh-hmong-converter/demo.html)**

---

## Features

- Converts Hmong RPA text to Pahawh Hmong Unicode on page load — no build step, no dependencies
- Two-way toggle with a swap button that preserves line breaks through both directions
- Moob Leeg dialect auto-detection (`aa`, `ndl`, `ndlh` patterns)
- English words mixed into Hmong text pass through silently
- Class-based API for static HTML — one attribute, done
- Programmatic API for dynamic content and single-page apps
- MutationObserver mode for content injected after page load
- Preserves `<br>` line breaks and HTML formatting in both directions
- O(1) Map lookups — 6,344 syllables resolved in constant time
- Zero dependencies, ~8kb, works in any modern browser

---

## Installation

### CDN (recommended for most sites)

Add to your `<head>`. Load the Pahawh font first so it's ready when the library runs.

```html
<!-- Pahawh Hmong font -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Pahawh+Hmong&display=swap" rel="stylesheet">

<!-- Library -->
<script src="https://cdn.jsdelivr.net/gh/pahawh-platform/pahawh-hmong-converter@v2.0.0/pahawh-converter.js"></script>
```

### Download

Download [`pahawh-converter.js`](./pahawh-converter.js) and host it yourself.

```html
<script src="/path/to/pahawh-converter.js"></script>
```

---

## Usage

### Reserved class names

The library watches for these class names automatically on page load. Do not use them for styling or other purposes.

| Class | Purpose |
|---|---|
| `.to-pahawh` | One-way static conversion on load |
| `.toggle-pahawh` | Two-way conversion with swap button |
| `.rpa` | State flag: element currently contains RPA text |
| `.pahawh` | State flag: element currently contains Pahawh text |
| `.pahawh-toggle-btn` | The injected swap button — style this yourself |

---

### Static conversion — `.to-pahawh`

RPA text is converted to Pahawh on page load. One-way, no button. Use this for headings, navigation, labels, and any static UI text.

```html
<p class="to-pahawh">Nyob Zoo sawv daws</p>
<span class="to-pahawh">Ua tsaug</span>
<h1 class="to-pahawh">Hmoob lub npe</h1>
```

English words mixed into the text pass through silently:

```html
<p class="to-pahawh">Nyob Zoo everyone, koj nyob li cas?</p>
```

Line breaks are preserved:

```html
<p class="to-pahawh">
  Nyob Zoo sawv daws <br>
  Ua tsaug ntau heev rau koj
</p>
```

---

### Toggle conversion — `.toggle-pahawh`

Converts on load and appends a swap button. Clicking the button toggles between Pahawh and RPA. Line breaks are preserved through both directions of the toggle.

**Element starts as RPA** — add `.rpa`:

```html
<p class="toggle-pahawh rpa">Nyob Zoo sawv daws</p>
```

The library converts the text to Pahawh on load, updates the state class to `.pahawh`, and appends the swap button. Clicking the button converts back to RPA and flips the class back to `.rpa`.

**Element starts as Pahawh** — add `.pahawh`:

```html
<p class="toggle-pahawh pahawh">𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰</p>
```

The library leaves the text alone, applies the Pahawh font, and appends the swap button. Clicking converts to RPA.

**With line breaks:**

```html
<p class="toggle-pahawh rpa">
  Nyob Zoo sawv daws <br>
  Ua tsaug ntau heev rau koj <br>
  Kuv hlub koj
</p>
```

#### Styling the swap button

The injected button has class `.pahawh-toggle-btn`. The library provides no default styles beyond making it functional — style it however fits your site:

```css
.pahawh-toggle-btn {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  padding: 3px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  vertical-align: middle;
}
.pahawh-toggle-btn:hover {
  border-color: #FBBC09;
}
```

---

### Moob Leeg dialect

The library automatically detects Moob Leeg RPA by looking for `aa`, `ndl`, or `ndlh` patterns and normalises them before conversion. No configuration needed — both dialects work with the same class names.

```html
<p class="to-pahawh">Kuv nyob zoo. Ua tsaug ntau.</p>      <!-- Moob Dawb -->
<p class="to-pahawh">Kuv nyob zoo. Uaa tsaug ntaau.</p>    <!-- Moob Leeg — auto-detected -->
```

---

## JavaScript API

All methods are available on the global `PahawhConverter` object.

### `PahawhConverter.toPahawh(text, mode?)`

Convert an RPA string to Pahawh unicode. Returns a string with `\n` for line breaks.

```js
PahawhConverter.toPahawh('Nyob Zoo sawv daws');
// → '𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰'

PahawhConverter.toPahawh('Nyob Zoo\nUa tsaug');
// → '𖬒𖬮𖬵 𖬍𖬰𖬥𖬰\n𖬑𖬰𖬮𖬰 𖬅𖬶𖬝𖬰'
```

The optional `mode` parameter controls how unrecognised tokens are handled:

- `'plain'` (default) — unrecognised tokens pass through as-is. Use for static site content.
- `'html'` — unrecognised tokens are wrapped in `<span class="pahawh-err">`. Use for converter app UIs where you want to highlight errors visually.

### `PahawhConverter.toRPA(text)`

Convert a Pahawh unicode string back to RPA. Capitalises after sentence boundaries (`. ! ?`).

```js
PahawhConverter.toRPA('𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰');
// → 'Nyob Zoo sawv daws'
```

### `PahawhConverter.detectLeeg(text)`

Returns `true` if the text contains Moob Leeg patterns (`aa`, `ndl`, or `ndlh`).

```js
PahawhConverter.detectLeeg('Kuv nyob zoo');      // → false
PahawhConverter.detectLeeg('Kuv nyob zoo ntaau'); // → true
```

### `PahawhConverter.toggle(el)`

Flip a `.toggle-pahawh` element between Pahawh and RPA programmatically.

```js
const el = document.querySelector('.toggle-pahawh');
PahawhConverter.toggle(el); // converts and flips .pahawh ↔ .rpa class
```

### `PahawhConverter.convert(el)`

Manually process a single element. Respects the same class conventions as auto-conversion. Use this when you inject content dynamically and the MutationObserver is off.

```js
const el = document.createElement('p');
el.className   = 'to-pahawh';
el.textContent = 'Nyob Zoo';
document.body.appendChild(el);
PahawhConverter.convert(el);
```

### `PahawhConverter.init(options?)`

Re-scan the page for `.to-pahawh` and `.toggle-pahawh` elements and process any that haven't been processed yet. Called automatically on `DOMContentLoaded`. Call manually after injecting dynamic content if observe mode is off.

```js
// Re-scan after a dynamic content load
PahawhConverter.init();

// Enable MutationObserver to watch for elements added after page load
PahawhConverter.init({ observe: true });

// Scope to a subtree (useful for single-page apps)
PahawhConverter.init({ root: document.getElementById('content') });
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `observe` | boolean | `false` | Watch for dynamically added elements via MutationObserver |
| `root` | Element | `document` | Root element to scan |

### `PahawhConverter.version`

```js
PahawhConverter.version; // → '2.0.0'
```

---

## Dynamic content

### Manual (observe off)

```js
// After injecting content, call convert() on each new element
const el = document.createElement('p');
el.className   = 'toggle-pahawh rpa';
el.textContent = 'Nyob Zoo sawv daws';
container.appendChild(el);
PahawhConverter.convert(el);
```

### Automatic (observe on)

```js
// Set once at startup — the library watches for new elements automatically
PahawhConverter.init({ observe: true });

// Now any element you add with the right class name is processed automatically
const el = document.createElement('p');
el.className   = 'to-pahawh';
el.textContent = 'Nyob Zoo';
container.appendChild(el); // converted automatically on the next animation frame
```

The MutationObserver batches mutations within a single animation frame, so injecting 100 elements at once triggers one scan rather than 100.

---

## Conflict warning

If an element has both `to-pahawh` and `toggle-pahawh`, the library logs a warning and applies only `toggle-pahawh`:

```
[PahawhConverter] Element has both "to-pahawh" and "toggle-pahawh" —
only "toggle-pahawh" will be applied. Remove "to-pahawh" to silence this warning.
```

---

## Browser support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires ES6 (`Map`, `WeakSet`, `const`, arrow functions). No IE11 support.

---

## Font

The library applies `'Noto Sans Pahawh Hmong', sans-serif` to converted elements. For best rendering load the font in your `<head>` before the library:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Pahawh+Hmong&display=swap" rel="stylesheet">
```

---

## About Pahawh Hmong

Pahawh Hmong (𖬖𖬰𖬝𖬵 𖬁𖬰𖬦𖬰) is an indigenous writing system created by Shong Lue Yang in the 1950s for the Hmong language. It is encoded in Unicode at code points U+16B00–U+16B8F. The script reads left to right and encodes syllables differently from the Latin-based RPA — vowels are written before consonants in Pahawh, which is the reverse of RPA.

---

## Credits

Original conversion algorithm by **Vao Her**.
Library design, Pahawh Unicode mapping, optimisation, and open-source release by **Pahawh Platform**.

---

## License

MIT License — Copyright (c) 2025 Vao Her & Pahawh Platform.
See [LICENSE](./LICENSE) for the full text.
