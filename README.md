# Pahawh Hmong Converter

A fast, dependency-free JavaScript library for converting Hmong RPA (Romanized Popular Alphabet) to Pahawh Hmong Unicode script — and back. Supports both **Version 2** (Second Stage Reduced) and **Version 3** (Third Stage Reduced) of Pahawh Hmong. The first open-source Hmong RPA ↔ Pahawh converter on the web.

```html
<p class="to-pahawh">Nyob Zoo sawv daws</p>
<!-- becomes → 𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰 -->
```

**[Live Demo →](https://pahawh-platform.github.io/pahawh-hmong-converter/)** &nbsp;&nbsp;&nbsp;
**[CodePen Demo →](https://codepen.io/Pahawh-Platform/pen/raMGbvd)**

---

## Features

- Converts Hmong RPA text to Pahawh Hmong Unicode on page load — no build step, no dependencies
- **Pahawh V2 and V3 support** — choose between Second Stage Reduced and Third Stage Reduced
- **14 vowels** including `aa` as a distinct vowel with dedicated Pahawh glyphs (𖬚/𖬛) in both versions
- **Pahawh symbol options** — opt-in conversion of punctuation, numerals, and reduplication (𖭂)
- **Measurement symbols** — one-way Pahawh → RPA conversion of logographic number symbols (𖭐–𖭡)
- Two-way toggle with a swap button that preserves line breaks through both directions
- English words mixed into Hmong text pass through silently
- Class-based API for static HTML
- Programmatic API for dynamic content and single-page apps
- MutationObserver mode for content injected after page load
- Preserves `<br>` line breaks and HTML formatting in both directions
- O(1) Map lookups — 6,832 syllables (14 vowels × 8 tones × 61 consonant slots)
- Zero dependencies, works in any modern browser

---

## Installation

### CDN (recommended for most sites)

Add to your `<head>`. Load the Pahawh font first so it's ready when the library runs.

```html
<!-- Pahawh Hmong font via Google Fonts -->
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

RPA text is converted to Pahawh on page load. One-way, no button.

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

**Element starts as Pahawh** — add `.pahawh`:

```html
<p class="toggle-pahawh pahawh">𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰</p>
```

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
  
}
.pahawh-toggle-btn:hover {
  
}
```

---

### The `aa` vowel

The `aa` vowel is treated as a distinct 14th vowel in both V2 and V3, with its own dedicated Pahawh glyphs (𖬚/𖬛). Words like `kaab` and `kab` produce different Pahawh output. This applies to both Hmong Dawb and Moob Leeg text — no special detection or normalisation is needed.

```html
<p class="to-pahawh">kab</p>   <!-- → 𖬖 (a vowel) -->
<p class="to-pahawh">kaab</p>  <!-- → 𖬚 (aa vowel — distinct) -->
```

---

## Pahawh Version 2 vs Version 3

The library supports both major orthographic stages of Pahawh Hmong:

- **Version 3** (Third Stage Reduced) — default. Systematic tone-to-diacritic mapping.
- **Version 2** (Second Stage Reduced) — irregular tone assignments per vowel.

Both versions use the same Unicode codepoints (U+16B00–U+16B8F), the same 14 vowels, and the same consonant mappings. The difference is entirely in how tone diacritics are assigned to vowel rimes.

Key V2 differences:
- The `-d` RPA tone (not phonemic) maps to `-v` output
- Each vowel has its own irregular diacritic pattern (no formula — full lookup table)

---

## Pahawh Symbols

The library supports opt-in conversion of Pahawh-specific symbols when converting RPA → Pahawh. When converting Pahawh → RPA, these symbols are always converted back to their English equivalents.

### Punctuation

Pahawh has its own punctuation marks. By default, English punctuation is preserved. With the `pahawhPunctuation` option, these are converted:

| English | Pahawh | Name |
|---|---|---|
| `?` | 𖬷 | Vos Thom |
| `!` | 𖬸 | Vos Tshab Ceeb |
| `,` | 𖬹 | Cim Cheem |
| `&` | 𖬺 | Vos Thiab |
| `%` | 𖬻 | Vos Feem |
| `+` | 𖬼 | Xyeem Ntxiv |
| `-` | 𖬽 | Xyeem Rho |
| `×` | 𖬾 | Xyeem Tov |
| `÷` | 𖬿 | Xyeem Faib |

### Numerals

Pahawh has its own numeral system (positional, like Arabic numerals). With the `pahawhNumerals` option, digits are converted to Pahawh numerals. In V3, the zero digit uses the regular `0` character. In V2, zero uses the Pahawh glyph 𖭐.

### Reduplication (𖭂)

The Pahawh reduplication symbol 𖭂 means "repeat the previous word." With the `pahawhRedup` option, consecutive identical words are collapsed: `zoo zoo zoo` → `𖬍𖬰𖬥𖬰 𖭂 𖭂`. When converting Pahawh → RPA, the symbol is always expanded back.

### Measurement symbols

Pahawh has logographic symbols for counting and measurement words. These are converted one-way (Pahawh → RPA only):

| Pahawh | RPA | Pahawh | RPA |
|---|---|---|---|
| 𖭐 | cua | 𖭜𖭐 | txhiab |
| 𖭛 | caum | 𖭝𖭐 | ntsuab |
| 𖭜 | pua | 𖭞𖭐 | tw |
| 𖭝 | vam | 𖭟𖭐 | taw |
| 𖭞 | root | 𖭠𖭐 | kem |
| 𖭟 | neev | 𖭡 | tas |
| 𖭠 | ruav | | |

---

## JavaScript API

All methods are available on the global `PahawhConverter` object.

### `PahawhConverter.toPahawh(text, mode?, version?, options?)`

Convert an RPA string to Pahawh unicode. Returns a string with `\n` for line breaks.

```js
// Stage 3 (default)
PahawhConverter.toPahawh('Nyob Zoo sawv daws');
// → '𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰'

// Stage 2 (Second Stage Reduced)
PahawhConverter.toPahawh('Nyob Zoo sawv daws', 'plain', 2);

// With Pahawh symbols
PahawhConverter.toPahawh('zoo zoo!', 'plain', 3, {
  pahawhPunctuation: true,
  pahawhNumerals: true,
  pahawhRedup: true
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `text` | string | — | RPA text to convert |
| `mode` | string | `'plain'` | `'plain'`: pass through unrecognised tokens. `'html'`: wrap in `<span class="pahawh-err">` |
| `version` | number | `3` | `2` for Second Stage Reduced, `3` for Third Stage Reduced |
| `options` | object | `{}` | See options below |

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `pahawhPunctuation` | boolean | `false` | Convert `? ! , & % + - × ÷` to Pahawh symbols |
| `pahawhNumerals` | boolean | `false` | Convert digits to Pahawh numerals |
| `pahawhRedup` | boolean | `false` | Collapse repeated words using 𖭂 |

### `PahawhConverter.toRPA(text, version?)`

Convert a Pahawh unicode string back to RPA. Always converts Pahawh punctuation, numerals, measurement symbols, and reduplication back to their English/RPA equivalents. Capitalises after sentence boundaries (`. ! ?`).

```js
// Stage 3 (default)
PahawhConverter.toRPA('𖬒𖬮𖬵 𖬍𖬰𖬥𖬰 𖬏𖬤𖬵 𖬏𖬲𖬞𖬰');
// → 'Nyob Zoo sawv daws'

// Stage 2
PahawhConverter.toRPA(pahawhV2Text, 2);
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `text` | string | — | Pahawh unicode text to convert |
| `version` | number | `3` | Which Pahawh version to interpret the input as |

### `PahawhConverter.toggle(el)`

Flip a `.toggle-pahawh` element between Pahawh and RPA programmatically.

```js
const el = document.querySelector('.toggle-pahawh');
PahawhConverter.toggle(el);
```

### `PahawhConverter.convert(el)`

Manually process a single element. Use this when you inject content dynamically.

```js
const el = document.createElement('p');
el.className   = 'to-pahawh';
el.textContent = 'Nyob Zoo';
document.body.appendChild(el);
PahawhConverter.convert(el);
```

### `PahawhConverter.init(options?)`

Re-scan the page for `.to-pahawh` and `.toggle-pahawh` elements.

```js
PahawhConverter.init();
PahawhConverter.init({ observe: true });
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
const el = document.createElement('p');
el.className   = 'toggle-pahawh rpa';
el.textContent = 'Nyob Zoo sawv daws';
container.appendChild(el);
PahawhConverter.convert(el);
```

### Automatic (observe on)

```js
PahawhConverter.init({ observe: true });

const el = document.createElement('p');
el.className   = 'to-pahawh';
el.textContent = 'Nyob Zoo';
container.appendChild(el); // converted automatically
```

---

## Browser support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires ES6. No IE11 support.

---

## Font

The library applies `'Noto Sans Pahawh Hmong', sans-serif` to converted elements. Noto Sans Pahawh Hmong renders both Stage 2 and Stage 3 correctly. For best rendering load the font in your `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Pahawh+Hmong&display=swap" rel="stylesheet">
```

---

## About Pahawh Hmong

Pahawh Hmong (𖬖𖬲𖬝𖬵 𖬄𖬲𖬟 𖬌𖬣𖬵) is an indigenous writing system created by Shong Lue Yang in the 1950s for the Hmong language. It is encoded in Unicode at code points U+16B00–U+16B8F. The script reads left to right and encodes syllables differently from the Latin-based RPA — vowels are written before consonants in Pahawh, which is the reverse of RPA.

The writing system has four stages of development. The Second Stage Reduced Version and Third Stage Reduced Version are both in active use today. This library supports both.

---

## Credits

Original Pahawh Converter (c) 2017 by **Vao Her**.
Library design, optimisation, and open-source release by **Pahawh Platform**.

---

## License

MIT License — Copyright (c) 2017-2026 Vao Her & Pahawh Platform.
See [LICENSE](./LICENSE) for the full text.
