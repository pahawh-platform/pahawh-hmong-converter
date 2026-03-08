/**
 * pahawh-converter.js v2.0.0
 * Hmong RPA ↔ Pahawh Hmong Unicode converter
 *
 * MIT License — Copyright (c) 2025 Vao Her & Pahawh Platform
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RESERVED CLASS NAMES — do not use these for styling or other purposes:
 *   .to-pahawh          One-way: converts RPA text to Pahawh on page load
 *   .toggle-pahawh      Two-way: converts and adds a swap button
 *   .rpa                State flag: element currently contains RPA text
 *   .pahawh             State flag: element currently contains Pahawh text
 *   .pahawh-toggle-btn  The injected swap button — style this yourself
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * STATIC CONVERSION (one-way, no button)
 *   <p class="to-pahawh">Nyob Zoo sawv daws</p>
 *
 * TOGGLE CONVERSION (two-way, adds swap button)
 *   <p class="toggle-pahawh rpa">Nyob Zoo sawv daws</p>
 *   <p class="toggle-pahawh pahawh">𖬒𖬮𖬵 𖬍𖬰𖬥𖬰</p>
 *
 * LINE BREAKS ARE PRESERVED through both directions of toggle:
 *   <p class="toggle-pahawh rpa">
 *     Nyob Zoo sawv daws <br>
 *     Ua tsaug ntau heev
 *   </p>
 *
 * CONFLICT: both classes on one element → toggle-pahawh wins + console.warn
 *
 * PUBLIC API
 *   PahawhConverter.toPahawh(text, mode?)   'plain' (default) or 'html'
 *   PahawhConverter.toRPA(text)
 *   PahawhConverter.detectLeeg(text)        → boolean
 *   PahawhConverter.toggle(el)              flip a .toggle-pahawh element
 *   PahawhConverter.convert(el)             manually process one element
 *   PahawhConverter.init(options?)          re-scan; options: { observe, root }
 *   PahawhConverter.version                 '2.0.0'
 *
 * FONT
 *   Applies 'Noto Sans Pahawh Hmong' via font-display swap.
 *   For best results preload the font in your <head>:
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Pahawh+Hmong&display=swap" rel="stylesheet">
 */

const PahawhConverter = (() => {

  const VERSION = '2.0.0';

  // ─── Conversion data ───────────────────────────────────────────────────────

  const VOWEL_ROOTS   = ["ee","i","au","u","e","ai","oo","aw","ua","o","ia","a","w"];
  const TONE_SUFFIXES = ["b","m","d","j","v","","s","g"];

  const CONSONANTS = [
    "m","txh","q","nts","ts","ph","y","nc","s","h","th","pl","l","d","dh",
    "c","ntsh","tx","v","nr","f","plh","tsh","p","ch","xy","t","x","k","ny",
    "hn","kh","nt","hl","z","ntxh","nk","ntx","rh","n","nq","nqh","r","nph",
    "nphl","nth","npl","nkh","nch","nrh","np","qh","nyh","hm","ml","hnl","g",
    "w","ndl","ndlh"
  ];
  const K_INDEX = 28; // "k" — no consonant modifier in Pahawh output

  const PAH_VOWEL = [
    "𖬀","𖬁","𖬂","𖬃","𖬄","𖬅","𖬆","𖬇","𖬈","𖬉",
    "𖬊","𖬋","𖬌","𖬍","𖬎","𖬏","𖬐","𖬑","𖬒","𖬓",
    "𖬔","𖬕","𖬖","𖬗","𖬘","𖬙"
  ];
  const PAH_TONE1 = ["","𖬰","𖬱","𖬲","","𖬰","𖬲","𖬶"];

  const PAH_CONS = [
    "𖬦","𖬝","𖬤","𖬟","𖬞","𖬯","𖬜","𖬪","𖬧","𖬮",
    "𖬩","𖬥","𖬢","𖬬","𖬡","𖬫","𖬨","𖬣","𖬠","𖬭"
  ];
  const PAH_TONE2 = ["","𖬰","𖬵"];

  const SPECIAL_LATIN  = [".",","  ,"!","@","#","$","%","^","&","(",")",
                           "?","{","}","|","\\","/","=","+","-","<",">",":",";"," [","]","_"];
  const SPECIAL_PAHAWH = [".",","  ,"!","@","#","$","%","^","&","(",")",
                           "?","{","}","*","\\","/","=","+","-","<",">",":",";"," [","]","_"];

  // ─── Build lookup maps (runs once at script load) ──────────────────────────

  const latinLib1   = [];
  const pahawhLib01 = [];
  for (let i = 0; i < VOWEL_ROOTS.length; i++) {
    const vg = i * 2;
    for (let t = 0; t < 8; t++) {
      latinLib1.push(VOWEL_ROOTS[i] + TONE_SUFFIXES[t]);
      pahawhLib01.push(PAH_VOWEL[vg + (t < 4 ? 0 : 1)] + PAH_TONE1[t]);
    }
  }

  // 60 consonant slots stepped in groups of 3 (20 glyphs × 3 tone variants)
  const pahawhLib02 = new Array(60);
  for (let l = 0, cg = 0; l < 60; l += 3, cg++) {
    pahawhLib02[l]     = PAH_CONS[cg] + PAH_TONE2[0];
    pahawhLib02[l + 1] = PAH_CONS[cg] + PAH_TONE2[1];
    pahawhLib02[l + 2] = PAH_CONS[cg] + PAH_TONE2[2];
  }

  // Build master arrays then immediately populate Maps and discard the arrays
  const rpaMap = new Map(); // lowercase RPA syllable → Pahawh string
  const phMap  = new Map(); // Pahawh string → RPA syllable

  (() => {
    const lm = [], pm = [];
    for (let i = 0; i < CONSONANTS.length; i++) {
      for (let j = 0; j < latinLib1.length; j++) {
        lm.push(CONSONANTS[i] + latinLib1[j]);
        pm.push(i !== K_INDEX ? pahawhLib01[j] + pahawhLib02[i] : pahawhLib01[j]);
      }
    }
    for (let j = 0; j < latinLib1.length; j++) {
      lm.push(latinLib1[j]);
      pm.push(pahawhLib01[j] + pahawhLib02[K_INDEX]);
    }
    for (let i = 0; i < lm.length; i++) {
      rpaMap.set(lm[i].toLowerCase(), pm[i]);
      phMap.set(pm[i], lm[i]);
    }
  })();

  const l2p      = new Map(SPECIAL_LATIN.map((c, i)  => [c, SPECIAL_PAHAWH[i]]));
  const p2l      = new Map(SPECIAL_PAHAWH.map((c, i) => [c, SPECIAL_LATIN[i]]));
  const pSpecSet = new Set(SPECIAL_PAHAWH);

  // Regex to detect if an unrecognised token looks like intended Hmong RPA
  // (only these trigger a console.warn — pure English words pass through silently)
  // Matches tokens that look like partial Hmong RPA — specifically multi-character
  // consonant clusters that are characteristic of Hmong and unlikely to appear in
  // English words. Single letters (h, w, x, q, etc.) are intentionally excluded
  // to avoid false warnings on English words mixed into Hmong text.
  // The pattern requires the token to START with a known Hmong cluster; the [a-z]*
  // tail allows partial syllables like "hm" (from "hmoob") and "kh" (from "kho").
  const HMONG_RPA_RE = /^(txh|ntsh|ntxh|nphl|ndlh|ndl|nts|nth|npl|nkh|nch|nrh|ntx|nph|nqh|nyh|hnl|ts|ph|nc|dh|tx|nr|plh|tsh|ch|xy|ny|hn|kh|nt|hl|nk|rh|nq|np|qh|hm|ml|pl|nh)[a-z]*$/i;

  // ─── Core: toPahawh ───────────────────────────────────────────────────────

  /**
   * Convert an RPA string to Pahawh unicode.
   * mode 'plain' (default): unrecognised tokens pass through as-is (static site use)
   * mode 'html':            unrecognised tokens wrapped in <span class="pahawh-err">
   *                         (converter app use)
   */
  function toPahawh(text, mode = 'plain') {
    const isLeeg = detectLeeg(text);
    if (isLeeg) text = text.replaceAll("aa", "a");

    // Pre-compute once — avoids a string comparison inside flushWord for every word
    const isHtml = mode === 'html';

    const lines = text.split("\n");

    // Index of the last non-empty line — used to suppress the warning on the
    // final token of the entire input, which is likely still being typed.
    let lastLineIdx = lines.length - 1;
    while (lastLineIdx > 0 && !lines[lastLineIdx].trim()) lastLineIdx--;

    return lines.map((line, lineIdx) => {
      if (!line) return "";
      let out = "", word = "";
      const isLastLine = lineIdx === lastLineIdx;

      // isLastToken: true only for the final flushWord() call on the last line.
      // When true, suppresses the console.warn so mid-word partial tokens
      // (e.g. "hm" while still typing "hmoob") don't pollute the console.
      const flushWord = (isLastToken = false) => {
        if (!word) return;
        const key = word.toLowerCase();
        if (rpaMap.has(key)) {
          out += rpaMap.get(key);
        } else {
          if (!isLastToken && HMONG_RPA_RE.test(word)) {
            console.warn(`[PahawhConverter] Unrecognised RPA token: "${word}"`);
          }
          out += isHtml
            ? `<span class="pahawh-err">${word}</span>`
            : word;
        }
        word = "";
      };

      for (let i = 0; i < line.length; i++) {
        const code = line.charCodeAt(i);
        if ((code >= 97 && code <= 122) || (code >= 65 && code <= 90)) {
          word += line[i]; // a-z A-Z: accumulate word
        } else {
          flushWord(); // mid-line flush — word ended by space/punct, never last token
          if (line[i] === " ") {
            out += " ";
          } else if (code >= 48 && code <= 57) {
            out += line[i]; // digit passthrough
          } else {
            out += l2p.get(line[i]) ?? line[i]; // special char or passthrough
          }
        }
      }
      // Final flush — only suppress warning if this is the last line
      flushWord(isLastLine);
      return out;
    }).join("\n");
  }

  // ─── Core: toRPA ──────────────────────────────────────────────────────────

  /**
   * Convert a Pahawh unicode string back to RPA.
   * Capitalises after sentence boundaries (. ! ?)
   * Note: for...of is intentional — Pahawh glyphs are surrogate pairs (U+16B00+)
   * and for...of handles them correctly where charCodeAt indexing would not.
   */
  function toRPA(text) {
    let cap = true;
    return text.split("\n").map(line => {
      if (!line) return "";
      let out = "", word = "";

      const flushWord = () => {
        if (!word) return;
        const rpa = phMap.get(word);
        if (rpa !== undefined) {
          out += cap ? rpa[0].toUpperCase() + rpa.slice(1) : rpa;
          cap = false;
        } else {
          out += word; // pass through (English, numbers, unknown Pahawh)
        }
        word = "";
      };

      for (const ch of line) {
        const code = ch.charCodeAt(0);
        if (ch === " " || pSpecSet.has(ch)) {
          flushWord();
          out += ch === " " ? " " : (p2l.get(ch) ?? ch);
          if (ch === "!" || ch === "?" || ch === ".") cap = true;
        } else if (code >= 48 && code <= 57) {
          flushWord();
          out += ch;
        } else {
          word += ch;
        }
      }
      flushWord();
      return out;
    }).join("\n");
  }

  // ─── Core: detectLeeg ─────────────────────────────────────────────────────

  function detectLeeg(text) {
    return text.includes("aa") || text.includes("ndl") || text.includes("ndlh");
  }

  // ─── Font helpers ──────────────────────────────────────────────────────────

  const PAHAWH_FONT = "'Noto Sans Pahawh Hmong', sans-serif";

  function applyPahawhFont(el) { el.style.fontFamily = PAHAWH_FONT; }
  function applyRPAFont(el)    { el.style.fontFamily = "inherit"; }

  // ─── Node walker: read element → lines preserving <br> ────────────────────
  //
  // Walks an element's child nodes and collects text content, converting
  // <br> elements to "\n". Ignores .pahawh-toggle-btn children entirely.
  // Returns a plain string with \n for line breaks — safe to pass to
  // toPahawh() or toRPA().

  function _readLines(el) {
    let text = "";
    let afterBR = false; // true immediately after we've written a \n for a <br>

    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        // In HTML source, authors indent content around <br> tags with newlines
        // and spaces — those are purely formatting and must not appear in output.
        // Collapse all newline+space sequences to a single space first.
        let t = node.textContent.replace(/\n/g, " ").replace(/  +/g, " ");
        if (afterBR) {
          // Only strip the leading space if this text node has real content.
          // If the node is purely whitespace (e.g. between two <br> tags for
          // an intentional blank line), leave it alone — trimming it would
          // collapse the blank line away.
          if (t.trim().length > 0) {
            t = t.trimStart();
          }
          afterBR = false;
        }
        text += t;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.nodeName === "BR") {
          text = text.trimEnd(); // strip trailing space before the line break
          // Two consecutive <br>s with no text between = intentional blank line
          if (afterBR) text += "\n";
          text += "\n";
          afterBR = true;
        } else if (!node.classList.contains("pahawh-toggle-btn")) {
          // Recurse into inline wrappers (e.g. <span class="pahawh-err">)
          // but skip the toggle button entirely
          text += _readLines(node);
          afterBR = false;
        }
      }
    }
    return text.trim();
  }

  // ─── Node walker: write converted lines back into element ─────────────────
  //
  // Takes a converted string (with \n for line breaks) and writes it back
  // into the element as a series of text nodes and <br> elements,
  // preserving line structure. Any existing .pahawh-toggle-btn is
  // detached first and re-appended after so it survives the write.

  function _writeLines(el, text, btn) {
    // Clear element content but preserve the toggle button reference
    el.textContent = "";

    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        el.appendChild(document.createTextNode(lines[i]));
      }
      // Add <br> between lines but not after the last one
      if (i < lines.length - 1) {
        el.appendChild(document.createElement("br"));
      }
    }

    // Re-append the toggle button if it existed
    if (btn) el.appendChild(btn);
  }

  // ─── Toggle button factory ─────────────────────────────────────────────────

  const SWAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`;

  function _createToggleBtn(el) {
    const btn = document.createElement("button");
    btn.className = "pahawh-toggle-btn";
    btn.type      = "button";
    btn.title     = "Toggle Pahawh / RPA";
    btn.setAttribute("aria-label", "Toggle between Pahawh and RPA");
    btn.innerHTML = SWAP_SVG;
    btn.addEventListener("click", e => { e.stopPropagation(); toggle(el); });
    return btn;
  }

  // ─── Public: toggle(el) ───────────────────────────────────────────────────

  function toggle(el) {
    if (!el.classList.contains("toggle-pahawh")) {
      console.warn("[PahawhConverter] toggle() called on element without .toggle-pahawh class.", el);
      return;
    }

    // Detach button so it doesn't pollute the text read by _readLines
    const btn = el.querySelector(".pahawh-toggle-btn");
    if (btn) btn.remove();

    if (el.classList.contains("pahawh")) {
      // Pahawh → RPA: read lines, convert, write back with <br>s preserved
      const lines = _readLines(el).trim();
      const rpaText = toRPA(lines);
      _writeLines(el, rpaText, btn);
      applyRPAFont(el);
      el.classList.replace("pahawh", "rpa");

    } else if (el.classList.contains("rpa")) {
      // RPA → Pahawh: read lines, convert, write back with <br>s preserved
      const lines = _readLines(el).trim();
      const pahText = toPahawh(lines, 'plain');
      _writeLines(el, pahText, btn);
      applyPahawhFont(el);
      el.classList.replace("rpa", "pahawh");

    } else {
      console.warn("[PahawhConverter] toggle() element has neither .rpa nor .pahawh class.", el);
      if (btn) el.appendChild(btn); // put button back
    }
  }

  // ─── Public: convert(el) ──────────────────────────────────────────────────

  function convert(el) {
    const isStatic = el.classList.contains("to-pahawh");
    const isToggle = el.classList.contains("toggle-pahawh");

    if (isStatic && isToggle) {
      console.warn(
        `[PahawhConverter] Element has both "to-pahawh" and "toggle-pahawh" — ` +
        `only "toggle-pahawh" will be applied. Remove "to-pahawh" to silence this warning.`,
        el
      );
      el.classList.remove("to-pahawh");
      _processToggleEl(el);
    } else if (isToggle) {
      _processToggleEl(el);
    } else if (isStatic) {
      _processStaticEl(el);
    }
  }

  // ─── Processed-element guard ──────────────────────────────────────────────
  //
  // WeakSet is ~2× faster than dataset string access and leaves no
  // data-* attribute visible in the DOM for developers inspecting the HTML.

  const _processed = new WeakSet();

  // ─── Internal processors ──────────────────────────────────────────────────

  function _processStaticEl(el) {
    if (_processed.has(el)) return;
    _processed.add(el);

    // Read lines from child nodes (preserves <br> structure)
    const rpaText = _readLines(el).trim();
    _writeLines(el, toPahawh(rpaText, 'plain'), null);
    applyPahawhFont(el);
  }

  function _processToggleEl(el) {
    if (_processed.has(el)) return;
    _processed.add(el);

    // Default missing state class to "rpa" with a warning
    if (!el.classList.contains("rpa") && !el.classList.contains("pahawh")) {
      console.warn(
        `[PahawhConverter] .toggle-pahawh element is missing a state class ("rpa" or "pahawh"). ` +
        `Defaulting to "rpa".`,
        el
      );
      el.classList.add("rpa");
    }

    const btn = _createToggleBtn(el);

    if (el.classList.contains("rpa")) {
      // Read lines, convert RPA → Pahawh, write back preserving <br>s
      const rpaText = _readLines(el).trim();
      _writeLines(el, toPahawh(rpaText, 'plain'), btn);
      applyPahawhFont(el);
      el.classList.replace("rpa", "pahawh");
    } else {
      // Already Pahawh — just apply font and append button
      applyPahawhFont(el);
      el.appendChild(btn);
    }
  }

  // ─── Public: init(options) ────────────────────────────────────────────────

  let _observer    = null;
  let _rafPending  = false; // true while a rAF flush is scheduled
  let _pendingNodes = [];   // element nodes queued between animation frames

  /**
   * Flush all nodes queued by the MutationObserver in a single rAF frame.
   * Collapses N simultaneous DOM additions (e.g. rendering a list) into
   * one querySelectorAll pass instead of one per added node.
   */
  function _flushPending() {
    _rafPending = false;
    const nodes = _pendingNodes;
    _pendingNodes = [];
    for (const node of nodes) {
      if (!node.isConnected) continue; // skip nodes removed before frame fired
      if (node.classList.contains("to-pahawh") ||
          node.classList.contains("toggle-pahawh")) {
        convert(node);
      }
      node.querySelectorAll(".to-pahawh, .toggle-pahawh").forEach(convert);
    }
  }

  /**
   * Scan for and process all .to-pahawh and .toggle-pahawh elements.
   * Called automatically on DOMContentLoaded.
   * Call manually after injecting dynamic content if observe is off.
   *
   * options.observe {boolean} Watch for dynamically added elements (default: false)
   * options.root    {Element} Root element to scan (default: document)
   */
  function init(options = {}) {
    const root    = options.root    ?? document;
    const observe = options.observe ?? false;

    // Conflict check
    root.querySelectorAll(".to-pahawh.toggle-pahawh").forEach(el => {
      console.warn(
        `[PahawhConverter] Element has both "to-pahawh" and "toggle-pahawh" — ` +
        `only "toggle-pahawh" will be applied. Remove "to-pahawh" to silence this warning.`,
        el
      );
      el.classList.remove("to-pahawh");
    });

    root.querySelectorAll(".to-pahawh").forEach(_processStaticEl);
    root.querySelectorAll(".toggle-pahawh").forEach(_processToggleEl);

    // Disconnect any existing observer
    if (_observer) { _observer.disconnect(); _observer = null; }

    if (observe) {
      _observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            _pendingNodes.push(node);
          }
        }
        // Batch everything within one animation frame — one flush per frame
        if (!_rafPending) {
          _rafPending = true;
          requestAnimationFrame(_flushPending);
        }
      });
      _observer.observe(root === document ? document.body : root, {
        childList: true,
        subtree:   true
      });
    }
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => init());
    } else {
      init();
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  return {
    version:    VERSION,
    toPahawh,
    toRPA,
    detectLeeg,
    toggle,
    convert,
    init,
  };

})();
