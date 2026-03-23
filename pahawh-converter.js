/**
 * @@@@@@@@@@@@@@@@@@@@@@@@@@                                                                             
 * @@                     @@@                                                                            
 * @@          @@         @@@                               @@@                                 @@@      
 * @@  @@@@@@@@@@@@@@@@@  @@@        @@@@@@@@@@             @@@                                 @@@      
 * @@                     @@@        @@@@@@@@@@   @@@@ @@@  @@@@@@@@    @@@@@@@@ @@@        @@@ @@@ @@@@ 
 * @@  @@   @@@ @@@@@@@@  @@@        @@@@  @@@@ @@@@@@@@@@  @@@@@@@@@  @@@@@@@@@ @@@@  @@@ @@@@ @@@@@@@@@
 * @@  @@   @@@ @@    @@  @@@        @@@@@@@@@@ @@@    @@@  @@@   @@@ @@@@   @@@  @@@ @@@@@@@@  @@@@  @@@
 * @@  @@@@ @@@ @@@@@     @@@        @@@@@@@@   @@@    @@@  @@@   @@@ @@@@   @@@   @@@@@@@@@@@  @@@   @@@
 * @@  @@   @@@ @@    @@  @@@        @@@@       @@@@@@@@@@  @@@   @@@  @@@@@@@@@   @@@@  @@@@   @@@   @@@
 * @@  @@@@@@@@ @@@@@@@@  @@@         @@@         @@@@ @@@  @@@   @@@    @@@@@@@    @@    @@    @@@   @@@
 * @@                     @@@                                                                            
 * @@@@@@@@@@@@@@@@@@@@@@@@@@                                                                             
 *
 * 
 * pahawh-converter.js v2.0.0
 * Hmong RPA ↔ Pahawh Hmong Unicode converter
 * Supports Pahawh Phiaj 2 (Version 2 - Second Stage Reduced) and Phiaj 3 (Version 3 - Third Stage Reduced)
 *
 * MIT License — Copyright (c) 2017-2026 Vao Her & Pahawh Platform.
 * 
 * 2026 version edit with Claude.AI. Claude was used for code refactoring and enhance the storage structure
 * from parallel arrays to key-value maps
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
 * PUBLIC API
 *   PahawhConverter.toPahawh(text, mode?, version?, options?)
 *     mode:    'plain' (default) or 'html'
 *     version: 2 or 3 (default 3)
 *     options: { pahawhPunctuation, pahawhNumerals, pahawhRedup }
 *
 *   PahawhConverter.toRPA(text, version?)
 *     Always converts Pahawh punctuation/numerals/symbols → English equivalents.
 *     Always expands reduplication symbol 𖭂.
 *
 *   PahawhConverter.toggle(el)              flip a .toggle-pahawh element
 *   PahawhConverter.convert(el)             manually process one element
 *   PahawhConverter.init(options?)          re-scan; options: { observe, root }
 *   PahawhConverter.version                 '2.0.0'
 *
 * FONT
 *   Applies 'Noto Sans Pahawh Hmong' via font-display swap.
 *   <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Pahawh+Hmong&display=swap" rel="stylesheet">
 */

const PahawhConverter = (() => {

  const VERSION = '2.0.0';

  // Conversion data (shared between Phiaj 2 (V2) and Phiaj 3 (V3))

  // 14 vowel roots — "aa" has its own dedicated Pahawh glyphs (𖬚/𖬛)
  const VOWEL_ROOTS   = ["ee","i","au","u","e","ai","oo","aw","ua","o","ia","a","aa","w"];
  const TONE_SUFFIXES = ["b","m","d","j","v","","s","g"];

  const CONSONANTS = [
    "m","txh","q","nts","ts","ph","y","nc","s","h","th","pl","l","d","dh",
    "c","ntsh","tx","v","nr","f","plh","tsh","p","ch","xy","t","x","k","ny",
    "hn","kh","nt","hl","z","ntxh","nk","ntx","rh","n","nq","nqh","r","nph",
    "nphl","nth","npl","nkh","nch","nrh","np","qh","nyh","hm","ml","hnl","g",
    "w","ndl","ndlh"
  ];
  const K_INDEX = 28;

  // Pahawh glyph data

  const PAH_VOWEL = [
    "𖬀","𖬁","𖬂","𖬃","𖬄","𖬅","𖬆","𖬇","𖬈","𖬉",
    "𖬊","𖬋","𖬌","𖬍","𖬎","𖬏","𖬐","𖬑","𖬒","𖬓",
    "𖬔","𖬕","𖬖","𖬗","𖬘","𖬙","𖬚","𖬛"
  ];

  const PAH_TONE1 = ["","𖬰","𖬱","𖬲","","𖬰","𖬲","𖬶"];

  const PAH_CONS = [
    "𖬦","𖬝","𖬤","𖬟","𖬞","𖬯","𖬜","𖬪","𖬧","𖬮",
    "𖬩","𖬥","𖬢","𖬬","𖬡","𖬫","𖬨","𖬣","𖬠","𖬭"
  ];
  const PAH_TONE2 = ["","𖬰","𖬵"];

  // Special character maps

  // Characters that pass through unchanged in both directions (not Pahawh-specific)
  const SPECIAL_LATIN  = [".",","  ,"!","@","#","$","%","^","&","(",")",
                           "?","{","}","|","\\","/","=","+","-","<",">",":",";"," ","[","]","_"];
  const SPECIAL_PAHAWH = [".",","  ,"!","@","#","$","%","^","&","(",")",
                           "?","{","}","*","\\","/","=","+","-","<",">",":",";"," ","[","]","_"];

  // Pahawh-specific punctuation & math operators ↔ English equivalents
  const PAH_PUNCT_TO_ENG = new Map([
    ["𖬷", "?"], ["𖬸", "!"], ["𖬹", ","], ["𖬺", "&"], ["𖬻", "%"],
    ["𖬼", "+"], ["𖬽", "-"], ["𖬾", "×"], ["𖬿", "÷"],
  ]);
  const ENG_TO_PAH_PUNCT = new Map([
    ["?", "𖬷"], ["!", "𖬸"], [",", "𖬹"], ["&", "𖬺"], ["%", "𖬻"],
    ["+", "𖬼"], ["-", "𖬽"], ["×", "𖬾"], ["÷", "𖬿"],
  ]);

  // Pahawh digits ↔ ASCII digits
  // These are SMP characters (U+16B50–U+16B59) — must use for...of or Array.from
  const PAH_DIGIT_CHARS = Array.from("𖭐𖭑𖭒𖭓𖭔𖭕𖭖𖭗𖭘𖭙");
  const PAH_DIGIT_TO_ASCII = new Map();
  const ASCII_TO_PAH_DIGIT_V2 = new Map(); // V2: uses 𖭐 for 0
  const ASCII_TO_PAH_DIGIT_V3 = new Map(); // V3: uses regular 0 for zero
  for (let d = 0; d < 10; d++) {
    const pah = PAH_DIGIT_CHARS[d];
    PAH_DIGIT_TO_ASCII.set(pah, String(d));
    ASCII_TO_PAH_DIGIT_V2.set(String(d), pah);
    if (d === 0) {
      ASCII_TO_PAH_DIGIT_V3.set("0", "0"); // V3 keeps regular 0
    } else {
      ASCII_TO_PAH_DIGIT_V3.set(String(d), pah);
    }
  }
  const PAH_DIGIT_SET = new Set(PAH_DIGIT_CHARS);

  // Pahawh measurement/logographic symbols (Pahawh → RPA only, one-way)
  // Compounds (two-char) must be checked before singles
  const _CUA = PAH_DIGIT_CHARS[0]; // 𖭐 — shared between digit 0 and measurement
  const PAH_MEASURE_COMPOUNDS = new Map([
    ["𖭜" + _CUA, "txhiab"], ["𖭝" + _CUA, "ntsuab"], ["𖭞" + _CUA, "tw"],
    ["𖭟" + _CUA, "taw"],    ["𖭠" + _CUA, "kem"],
  ]);
  const PAH_MEASURE_SINGLES = new Map([
    [_CUA, "cua"], ["𖭛", "caum"], ["𖭜", "pua"], ["𖭝", "vam"],
    ["𖭞", "root"], ["𖭟", "neev"], ["𖭠", "ruav"], ["𖭡", "tas"],
  ]);
  // Build sets for detection
  const PAH_MEASURE_SET = new Set();
  for (const k of PAH_MEASURE_COMPOUNDS.keys()) { for (const c of k) PAH_MEASURE_SET.add(c); }
  for (const k of PAH_MEASURE_SINGLES.keys()) PAH_MEASURE_SET.add(k);

  // Reduplication symbol
  const PAH_REDUP = "𖭂";

  // Set of all Pahawh punctuation chars for detection in toRPA
  const PAH_PUNCT_SET = new Set(PAH_PUNCT_TO_ENG.keys());

  // V2 rime table

  //                          b              m              j              v              ∅              s              g
  const V2_RIMES = {
    "ee": [ [0,"𖬶"],  [0,""],    [0,"𖬰"],  [0,"𖬲"],  [1,""],    [1,"𖬰"],  [1,"𖬲"]  ],
    "i":  [ [2,"𖬲"],  [2,""],    [2,"𖬰"],  [2,"𖬶"],  [3,""],    [3,"𖬰"],  [3,"𖬲"]  ],
    "au": [ [4,"𖬰"],  [4,""],    [4,"𖬶"],  [4,"𖬲"],  [5,""],    [5,"𖬰"],  [5,"𖬲"]  ],
    "u":  [ [6,"𖬰"],  [6,""],    [6,"𖬶"],  [6,"𖬲"],  [7,""],    [7,"𖬰"],  [7,"𖬲"]  ],
    "e":  [ [8,"𖬰"],  [8,""],    [8,"𖬲"],  [9,""],    [9,"𖬰"],  [9,"𖬲"],  [9,"𖬶"]  ],
    "ai": [ [10,"𖬰"], [10,""],   [10,"𖬶"], [10,"𖬲"], [11,""],   [11,"𖬰"], [11,"𖬲"] ],
    "oo": [ [12,""],   [12,"𖬰"], [12,"𖬲"], [13,"𖬰"], [13,""],   [13,"𖬲"], [13,"𖬶"] ],
    "aw": [ [14,""],   [14,"𖬰"], [14,"𖬲"], [14,"𖬶"], [15,""],   [15,"𖬰"], [15,"𖬲"] ],
    "ua": [ [16,"𖬶"], [16,""],   [16,"𖬰"], [16,"𖬲"], [17,""],   [17,"𖬲"], [17,"𖬶"] ],
    "o":  [ [18,"𖬰"], [18,""],   [18,"𖬲"], [18,"𖬶"], [19,"𖬰"], [19,"𖬲"], [19,""]   ],
    "ia": [ [20,""],   [20,"𖬰"], [20,"𖬶"], [20,"𖬲"], [21,""],   [21,"𖬰"], [21,"𖬲"] ],
    "a":  [ [22,"𖬲"], [22,""],   [22,"𖬰"], [23,""],   [23,"𖬰"], [23,"𖬲"], [23,"𖬶"] ],
    "aa": [ [26,"𖬲"], [26,""],   [26,"𖬰"], [27,""],   [27,"𖬰"], [27,"𖬲"], [27,"𖬶"] ],
    "w":  [ [24,"𖬰"], [24,""],   [24,"𖬲"], [25,""],   [25,"𖬰"], [25,"𖬲"], [25,"𖬶"] ],
  };

  // Phiaj 3 (V3) lookup maps

  // Map each vowel root to its PAH_VOWEL pair indices [classA, classB]
  // Most vowels use contiguous pairs (i*2, i*2+1), but "aa" uses 26,27
  const V3_VOWEL_PAIRS = [
    [0,1],   // ee → 𖬀,𖬁
    [2,3],   // i  → 𖬂,𖬃
    [4,5],   // au → 𖬄,𖬅
    [6,7],   // u  → 𖬆,𖬇
    [8,9],   // e  → 𖬈,𖬉
    [10,11], // ai → 𖬊,𖬋
    [12,13], // oo → 𖬌,𖬍
    [14,15], // aw → 𖬎,𖬏
    [16,17], // ua → 𖬐,𖬑
    [18,19], // o  → 𖬒,𖬓
    [20,21], // ia → 𖬔,𖬕
    [22,23], // a  → 𖬖,𖬗
    [26,27], // aa → 𖬚,𖬛
    [24,25], // w  → 𖬘,𖬙
  ];

  const latinLib1   = [];
  const pahawhLib01 = [];
  for (let i = 0; i < VOWEL_ROOTS.length; i++) {
    const [a, b] = V3_VOWEL_PAIRS[i];
    for (let t = 0; t < 8; t++) {
      latinLib1.push(VOWEL_ROOTS[i] + TONE_SUFFIXES[t]);
      pahawhLib01.push(PAH_VOWEL[t < 4 ? a : b] + PAH_TONE1[t]);
    }
  }

  const pahawhLib02 = new Array(60);
  for (let l = 0, cg = 0; l < 60; l += 3, cg++) {
    pahawhLib02[l]     = PAH_CONS[cg] + PAH_TONE2[0];
    pahawhLib02[l + 1] = PAH_CONS[cg] + PAH_TONE2[1];
    pahawhLib02[l + 2] = PAH_CONS[cg] + PAH_TONE2[2];
  }

  const rpaMap = new Map();
  const phMap  = new Map();

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

  // Phiaj 2 (V2) lookup maps

  const rpaMap2 = new Map();
  const phMap2  = new Map();

  (() => {
    const rpaToV2Tone = [0, 1, 3, 2, 3, 4, 5, 6];

    const v2Lib1   = [];
    const v2PahLib = [];

    for (const vowel of VOWEL_ROOTS) {
      const rimeData = V2_RIMES[vowel];
      for (let t = 0; t < 8; t++) {
        const rpa = vowel + TONE_SUFFIXES[t];
        v2Lib1.push(rpa);
        const v2Idx = rpaToV2Tone[t];
        const entry = rimeData[v2Idx];
        v2PahLib.push(PAH_VOWEL[entry[0]] + entry[1]);
      }
    }

    const lm = [], pm = [];
    for (let i = 0; i < CONSONANTS.length; i++) {
      for (let j = 0; j < v2Lib1.length; j++) {
        lm.push(CONSONANTS[i] + v2Lib1[j]);
        pm.push(i !== K_INDEX ? v2PahLib[j] + pahawhLib02[i] : v2PahLib[j]);
      }
    }
    for (let j = 0; j < v2Lib1.length; j++) {
      lm.push(v2Lib1[j]);
      pm.push(v2PahLib[j] + pahawhLib02[K_INDEX]);
    }
    for (let i = 0; i < lm.length; i++) {
      rpaMap2.set(lm[i].toLowerCase(), pm[i]);
      phMap2.set(pm[i], lm[i]);
    }
  })();

  // Shared data

  const l2p      = new Map(SPECIAL_LATIN.map((c, i)  => [c, SPECIAL_PAHAWH[i]]));
  const p2l      = new Map(SPECIAL_PAHAWH.map((c, i) => [c, SPECIAL_LATIN[i]]));
  const pSpecSet = new Set(SPECIAL_PAHAWH);

  const HMONG_RPA_RE = /^(txh|ntsh|ntxh|nphl|ndlh|ndl|nts|nth|npl|nkh|nch|nrh|ntx|nph|nqh|nyh|hnl|ts|ph|nc|dh|tx|nr|plh|tsh|ch|xy|ny|hn|kh|nt|hl|nk|rh|nq|np|qh|hm|ml|pl|nh)[a-z]*$/i;

  // Compound word auto-split

  // Build a set of consonant onsets for split validation.
  // Syllables without a consonant (bare vowel+tone like "a", "e", "oo") use the
  // null consonant slot (K_INDEX = "k"), but for split validation we want to
  // require a real consonant onset on each part to avoid false positives with
  // English words that happen to decompose into bare-vowel Hmong syllables.
  const _ONSET_SET = new Set();
  for (let i = 0; i < CONSONANTS.length; i++) {
    if (i !== K_INDEX) _ONSET_SET.add(CONSONANTS[i]);
  }

  /**
   * Check whether a syllable string starts with a known Hmong consonant onset.
   * Returns false for bare-vowel syllables like "a", "ee", "oo".
   */
  function _hasConsonantOnset(syllable) {
    const lower = syllable.toLowerCase();
    // Try matching longest consonant cluster first (up to 4 chars: "nphl", "ndlh", "ntxh", "ntsh")
    for (let len = Math.min(4, lower.length); len >= 1; len--) {
      if (_ONSET_SET.has(lower.slice(0, len))) return true;
    }
    return false;
  }

  /**
   * Attempt to split an unrecognised token into valid RPA syllables.
   * Uses greedy left-to-right matching against the rpaMap.
   * Returns an array of syllables if fully decomposable, or null if not.
   *
   * Guards against false positives (English words that coincidentally split):
   *   1. Minimum word length of 5 characters
   *   2. Every split part must have a Hmong consonant onset (no bare vowels)
   *
   * Example: "dabtsi" → ["dab", "tsi"]
   *          "hello"  → null (no valid split)
   *          "yea"    → null (too short, and "a" has no consonant onset)
   */
  function _splitCompound(word, map) {
    const lower = word.toLowerCase();

    // Guard: minimum 5 characters to attempt splitting
    if (lower.length < 5) return null;

    // Pre-filter: must start with a letter
    if (!/^[a-z]/i.test(lower)) return null;

    // Recursive split with memoization
    const memo = new Map();

    function solve(str) {
      if (str === "") return [];
      if (memo.has(str)) return memo.get(str);

      // Greedy: try longest prefix first
      for (let end = str.length; end >= 1; end--) {
        const prefix = str.slice(0, end);
        if (map.has(prefix)) {
          const rest = solve(str.slice(end));
          if (rest !== null) {
            const result = [prefix, ...rest];
            memo.set(str, result);
            return result;
          }
        }
      }

      memo.set(str, null);
      return null;
    }

    const parts = solve(lower);

    // Must split into at least 2 parts — single matches would have been found already
    if (!parts || parts.length < 2) return null;

    // Guard: every part must have a Hmong consonant onset (rejects bare vowels)
    for (const part of parts) {
      if (!_hasConsonantOnset(part)) return null;
    }

    // Restore original capitalization on first syllable
    if (word[0] !== word[0].toLowerCase()) {
      parts[0] = parts[0][0].toUpperCase() + parts[0].slice(1);
    }

    return parts;
  }

  /**
   * Public utility: split compound words in an RPA text string.
   * Returns an object mapping original compounds to their split forms.
   * Example: splitCompounds("Kuv tsis paub dabtsi") → { "dabtsi": "dab tsi" }
   */
  function splitCompounds(text, version = 3) {
    const map = version === 2 ? rpaMap2 : rpaMap;
    const result = {};
    const words = text.split(/(\s+)/);

    for (const w of words) {
      if (!w.trim()) continue;
      const lower = w.toLowerCase();
      if (map.has(lower)) continue; // already a valid syllable
      const parts = _splitCompound(w, map);
      if (parts) {
        result[w] = parts.join(" ");
      }
    }

    return result;
  }

  // Core: toPahawh

  /**
   * Convert an RPA string to Pahawh unicode.
   * mode:    'plain' (default) or 'html'
   * version: 2 or 3 (default 3)
   * options: {
   *   pahawhPunctuation: false,  // convert ? ! , & % + - × ÷ to Pahawh symbols
   *   pahawhNumerals:    false,  // convert digits to Pahawh numerals
   *   pahawhRedup:       false,  // collapse repeated words to 𖭂
   *   autoSplit:         true,   // split compound words into valid syllables
   * }
   */
  function toPahawh(text, mode = 'plain', version = 3, options = {}) {
    const map         = version === 2 ? rpaMap2 : rpaMap;
    const usePahPunct = options.pahawhPunctuation || false;
    const usePahNum   = options.pahawhNumerals    || false;
    const usePahRedup = options.pahawhRedup        || false;
    const useAutoSplit = options.autoSplit !== false; // ON by default
    const numMap      = version === 2 ? ASCII_TO_PAH_DIGIT_V2 : ASCII_TO_PAH_DIGIT_V3;

    const isHtml = mode === 'html';

    // Escape blocks: extract /* ... */ regions before conversion
    // Replace each escape block with a unique placeholder token.
    // After conversion, swap placeholders back with the original content.
    // Placeholders use Unicode non-characters that won't appear in normal text
    // and won't be treated as letters/digits by the character loop.
    const escapeBlocks = [];
    const PH_START = "\uFDD0"; // placeholder start marker
    const PH_END   = "\uFDD1"; // placeholder end marker
    const PH_SEP   = "\uFDD2"; // digit separator (used between index digits)
    text = text.replace(/\/\*([^]*?)\*\//g, (full, inner) => {
      const idx = escapeBlocks.length;
      escapeBlocks.push(inner);
      // Encode the index as non-character codepoints: each digit d → \uFDD3 + d offset
      // This avoids any ASCII digits in the placeholder.
      const encodedIdx = String(idx).split("").map(d => String.fromCharCode(0xFDD3 + Number(d))).join("");
      return PH_START + encodedIdx + PH_END;
    });

    // When reduplication is on, always build plain first so redup doesn't
    // collide with HTML error spans. Re-apply error wrapping after.
    const buildPlain = usePahRedup || !isHtml;
    const lines = text.split("\n");

    let lastLineIdx = lines.length - 1;
    while (lastLineIdx > 0 && !lines[lastLineIdx].trim()) lastLineIdx--;

    let result = lines.map((line, lineIdx) => {
      if (!line) return "";
      let out = "", word = "";
      const isLastLine = lineIdx === lastLineIdx;

      const flushWord = (isLastToken = false) => {
        if (!word) return;
        const key = word.toLowerCase();
        if (map.has(key)) {
          out += map.get(key);
        } else {
          // Try auto-split on unrecognised tokens
          if (useAutoSplit) {
            const parts = _splitCompound(word, map);
            if (parts) {
              // Convert each split syllable individually
              out += parts.map(p => map.get(p.toLowerCase()) ?? p).join(" ");
              word = "";
              return;
            }
          }

          if (!isLastToken && HMONG_RPA_RE.test(word)) {
            console.warn(`[PahawhConverter] Unrecognised RPA token: "${word}"`);
          }
          // In plain/redup-first mode, pass through as-is (no HTML wrapping yet)
          if (buildPlain) {
            out += word;
          } else {
            out += `<span class="pahawh-err">${word}</span>`;
          }
        }
        word = "";
      };

      for (let i = 0; i < line.length; i++) {
        const code = line.charCodeAt(i);
        if ((code >= 97 && code <= 122) || (code >= 65 && code <= 90)) {
          word += line[i];
        } else {
          flushWord();
          if (line[i] === " ") {
            out += " ";
          } else if (code >= 48 && code <= 57) {
            if (usePahNum) {
              out += numMap.get(line[i]) ?? line[i];
            } else {
              out += line[i];
            }
          } else {
            if (usePahPunct && ENG_TO_PAH_PUNCT.has(line[i])) {
              out += ENG_TO_PAH_PUNCT.get(line[i]);
            } else {
              out += l2p.get(line[i]) ?? line[i];
            }
          }
        }
      }
      flushWord(isLastLine);
      return out;
    }).join("\n");

    // Reduplication: collapse consecutive identical words to word + 𖭂
    if (usePahRedup) {
      result = _collapseRedup(result);
    }

    // If HTML mode was requested and we built plain first (for redup), now
    // re-scan and wrap any remaining Latin-alphabet passthrough tokens with
    // the error class. Pahawh syllables won't match since they're all SMP chars.
    if (isHtml && usePahRedup) {
      result = result.replace(/\b([a-zA-Z]+)\b/g, (match) => {
        // Only wrap if the token isn't a known RPA syllable that converted
        // (it wouldn't still be Latin if it had converted successfully)
        return `<span class="pahawh-err">${match}</span>`;
      });
    }

    // Restore escape blocks
    if (escapeBlocks.length) {
      // Match: PH_START + one or more encoded digits (\uFDD3-\uFDDC) + PH_END
      const escapeRe = new RegExp(PH_START + "([\uFDD3-\uFDDC]+)" + PH_END, "g");
      result = result.replace(escapeRe, (full, encoded) => {
        // Decode index: each char \uFDD3+d → digit d
        const idxStr = Array.from(encoded).map(c => c.charCodeAt(0) - 0xFDD3).join("");
        const content = escapeBlocks[Number(idxStr)];
        if (isHtml) {
          return `<span class="pahawh-orphan">${content}</span>`;
        }
        return content;
      });
    }

    return result;
  }

  /**
   * Collapse consecutive identical Pahawh words into first word + 𖭂 symbols.
   * "𖬍𖬰𖬥𖬰 𖬍𖬰𖬥𖬰 𖬍𖬰𖬥𖬰" → "𖬍𖬰𖬥𖬰 𖭂 𖭂"
   * Punctuation between repetitions is preserved but doesn't break the chain.
   * "𖬍𖬰𖬥𖬰 𖬍𖬰𖬥𖬰, 𖬍𖬰𖬥𖬰 𖬍𖬰𖬥𖬰" → "𖬍𖬰𖬥𖬰 𖭂, 𖭂 𖭂"
   */
  function _collapseRedup(text) {
    const _isPunctChar = c => pSpecSet.has(c) || PAH_PUNCT_SET.has(c) || c === "." || c === "," || c === "!" || c === "?" || c === ";" || c === ":";

    return text.split("\n").map(line => {
      // Tokenize: split spaces, words, and punct as separate tokens
      const tokens = [];
      let current = "";

      for (const ch of line) {
        if (ch === " ") {
          if (current) { tokens.push(current); current = ""; }
          tokens.push(" ");
        } else if (_isPunctChar(ch)) {
          if (current) { tokens.push(current); current = ""; }
          tokens.push(ch);
        } else {
          current += ch;
        }
      }
      if (current) tokens.push(current);

      const isSpace = t => t === " ";
      const isPunct = t => t.length === 1 && _isPunctChar(t);

      let lastWord = "";
      const out = [];

      for (const tok of tokens) {
        if (isSpace(tok) || isPunct(tok)) {
          out.push(tok);
          // Punctuation doesn't reset lastWord — chain continues
        } else {
          if (tok === lastWord) {
            out.push(PAH_REDUP);
          } else {
            lastWord = tok;
            out.push(tok);
          }
        }
      }

      return out.join("");
    }).join("\n");
  }

  // Single consonant map (for "Allow single consonants" feature)
  // Maps each of the 60 Pahawh consonant forms (20 glyphs × 3 diacritics) to
  // the RPA consonant + "au" (the default teaching vowel).
  // Also builds a reverse map: RPA "consonant + au" → the Pahawh consonant form alone.
  const _singleConsMap = new Map();   // Pahawh consonant form → RPA "Xau"
  const _singleConsRevMap = new Map(); // RPA "xau" (lowercase) → Pahawh consonant form
  for (let i = 0; i < CONSONANTS.length; i++) {
    if (i === K_INDEX) continue; // skip null consonant (bare vowel slot)
    const pahCons = pahawhLib02[i]; // the Pahawh consonant form for this RPA consonant
    const rpa = CONSONANTS[i] + "au";
    _singleConsMap.set(pahCons, rpa);
    _singleConsRevMap.set(rpa.toLowerCase(), pahCons);
  }

  // Core: toRPA

  /**
   * Convert a Pahawh unicode string back to RPA.
   * Always converts Pahawh punctuation → English equivalents.
   * Always converts Pahawh numerals → digits.
   * Always expands reduplication symbol 𖭂.
   * Always converts measurement symbols → RPA words.
   * Capitalises after sentence boundaries (. ! ? 𖬷 𖬸)
   *
   * options: {
   *   singleConsonants: false,  // treat standalone consonant glyphs as consonant + "au"
   * }
   */
  function toRPA(text, version = 3, options = {}) {
    const map = version === 2 ? phMap2 : phMap;
    const useSingleCons = options.singleConsonants || false;
    let cap = true;

    return text.split("\n").map(line => {
      if (!line) return "";
      let out = "", word = "";
      let lastRpaWord = ""; // track for reduplication expansion

      // Convert line to array of codepoints for lookahead
      const chars = [...line];
      let i = 0;

      const flushWord = () => {
        if (!word) return;
        const rpa = map.get(word);
        if (rpa !== undefined) {
          const formatted = cap ? rpa[0].toUpperCase() + rpa.slice(1) : rpa;
          out += formatted;
          lastRpaWord = formatted;
          cap = false;
        } else if (useSingleCons && _singleConsMap.has(word)) {
          // Standalone consonant glyph → consonant + "au"
          const rpa = _singleConsMap.get(word);
          const formatted = cap ? rpa[0].toUpperCase() + rpa.slice(1) : rpa;
          out += formatted;
          lastRpaWord = formatted;
          cap = false;
        } else {
          out += word;
        }
        word = "";
      };

      while (i < chars.length) {
        const ch = chars[i];
        const code = ch.charCodeAt(0);

        // Check for reduplication symbol 𖭂
        if (ch === PAH_REDUP) {
          flushWord();
          if (lastRpaWord) {
            out += lastRpaWord;
          }
          i++;
          continue;
        }

        // Check for measurement compounds (two-char lookahead)
        if (i + 1 < chars.length) {
          const pair = ch + chars[i + 1];
          if (PAH_MEASURE_COMPOUNDS.has(pair)) {
            flushWord();
            const rpa = PAH_MEASURE_COMPOUNDS.get(pair);
            const formatted = cap ? rpa[0].toUpperCase() + rpa.slice(1) : rpa;
            out += formatted;
            lastRpaWord = formatted;
            cap = false;
            i += 2;
            continue;
          }
        }

        // Check for Pahawh digits
        if (PAH_DIGIT_SET.has(ch)) {
          flushWord();
          // Check if this digit is adjacent to a measurement symbol (then it's part
          // of a number, not "cua"). Since compounds were already handled above,
          // standalone 𖭐 next to other digits = digit 0.
          // Check context: if previous or next char is also a Pahawh digit, treat as number
          const prevIsDigit = i > 0 && PAH_DIGIT_SET.has(chars[i - 1]);
          const nextIsDigit = i + 1 < chars.length && PAH_DIGIT_SET.has(chars[i + 1]);

          if (ch === "𖭐" && !prevIsDigit && !nextIsDigit && !PAH_MEASURE_SET.has(chars[i + 1] ?? "")) {
            // Standalone 𖭐 not in a number sequence = "cua"
            const formatted = cap ? "Cua" : "cua";
            out += formatted;
            lastRpaWord = formatted;
            cap = false;
          } else {
            out += PAH_DIGIT_TO_ASCII.get(ch) ?? ch;
          }
          i++;
          continue;
        }

        // Check for measurement singles (only if not already handled as digit)
        if (PAH_MEASURE_SINGLES.has(ch) && ch !== "𖭐") {
          flushWord();
          const rpa = PAH_MEASURE_SINGLES.get(ch);
          const formatted = cap ? rpa[0].toUpperCase() + rpa.slice(1) : rpa;
          out += formatted;
          lastRpaWord = formatted;
          cap = false;
          i++;
          continue;
        }

        // Check for Pahawh punctuation
        if (PAH_PUNCT_SET.has(ch)) {
          flushWord();
          const eng = PAH_PUNCT_TO_ENG.get(ch);
          out += eng;
          if (eng === "!" || eng === "?") cap = true;
          i++;
          continue;
        }

        // Space or generic special
        if (ch === " " || pSpecSet.has(ch)) {
          flushWord();
          out += ch === " " ? " " : (p2l.get(ch) ?? ch);
          if (ch === "!" || ch === "?" || ch === ".") cap = true;
        } else if (code >= 48 && code <= 57) {
          flushWord();
          out += ch;
        } else {
          // Pahawh syllable character — accumulate
          word += ch;
        }
        i++;
      }
      flushWord();
      return out;
    }).join("\n");
  }

  // Font helpers

  const PAHAWH_FONT = "'Noto Sans Pahawh Hmong', sans-serif";

  function applyPahawhFont(el) { el.style.fontFamily = PAHAWH_FONT; }
  function applyRPAFont(el)    { el.style.fontFamily = "inherit"; }

  // Node walker: read element → lines preserving <br>

  function _readLines(el) {
    let text = "";
    let afterBR = false;

    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        let t = node.textContent.replace(/\n/g, " ").replace(/  +/g, " ");
        if (afterBR) {
          if (t.trim().length > 0) {
            t = t.trimStart();
          }
          afterBR = false;
        }
        text += t;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.nodeName === "BR") {
          text = text.trimEnd();
          if (afterBR) text += "\n";
          text += "\n";
          afterBR = true;
        } else if (!node.classList.contains("pahawh-toggle-btn")) {
          text += _readLines(node);
          afterBR = false;
        }
      }
    }
    return text.trim();
  }

  // Node walker: write converted lines back into element

  function _writeLines(el, text, btn) {
    el.textContent = "";

    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        el.appendChild(document.createTextNode(lines[i]));
      }
      if (i < lines.length - 1) {
        el.appendChild(document.createElement("br"));
      }
    }

    if (btn) el.appendChild(btn);
  }

  // Toggle button factory

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

  // Public: toggle(el)

  function toggle(el) {
    if (!el.classList.contains("toggle-pahawh")) {
      console.warn("[PahawhConverter] toggle() called on element without .toggle-pahawh class.", el);
      return;
    }

    const btn = el.querySelector(".pahawh-toggle-btn");
    if (btn) btn.remove();

    if (el.classList.contains("pahawh")) {
      const lines = _readLines(el).trim();
      const rpaText = toRPA(lines);
      _writeLines(el, rpaText, btn);
      applyRPAFont(el);
      el.classList.replace("pahawh", "rpa");
    } else if (el.classList.contains("rpa")) {
      const lines = _readLines(el).trim();
      const pahText = toPahawh(lines, 'plain');
      _writeLines(el, pahText, btn);
      applyPahawhFont(el);
      el.classList.replace("rpa", "pahawh");
    } else {
      console.warn("[PahawhConverter] toggle() element has neither .rpa nor .pahawh class.", el);
      if (btn) el.appendChild(btn);
    }
  }

  // Public: convert(el)

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

  const _processed = new WeakSet();

  function _processStaticEl(el) {
    if (_processed.has(el)) return;
    _processed.add(el);
    const rpaText = _readLines(el).trim();
    _writeLines(el, toPahawh(rpaText, 'plain'), null);
    applyPahawhFont(el);
  }

  function _processToggleEl(el) {
    if (_processed.has(el)) return;
    _processed.add(el);

    if (!el.classList.contains("rpa") && !el.classList.contains("pahawh")) {
      console.warn(
        `[PahawhConverter] .toggle-pahawh element is missing a state class ("rpa" or "pahawh"). ` +
        `Defaulting to "rpa".`,
        el
      );
      el.classList.add("rpa");
    }

    // Remove ALL existing toggle buttons (defensive — prevents duplicates)
    el.querySelectorAll(".pahawh-toggle-btn").forEach(b => b.remove());

    const btn = _createToggleBtn(el);

    if (el.classList.contains("rpa")) {
      const rpaText = _readLines(el).trim();
      _writeLines(el, toPahawh(rpaText, 'plain'), btn);
      applyPahawhFont(el);
      el.classList.replace("rpa", "pahawh");
    } else {
      applyPahawhFont(el);
      el.appendChild(btn);
    }
  }

  // Also ensure init() itself never double-processes
  let _initRun = false;

  // Public: init(options)

  let _observer    = null;
  let _rafPending  = false;
  let _pendingNodes = [];

  function _flushPending() {
    _rafPending = false;
    const nodes = _pendingNodes;
    _pendingNodes = [];
    for (const node of nodes) {
      if (!node.isConnected) continue;
      if (node.classList.contains("to-pahawh") ||
          node.classList.contains("toggle-pahawh")) {
        convert(node);
      }
      node.querySelectorAll(".to-pahawh, .toggle-pahawh").forEach(convert);
    }
  }

  function init(options = {}) {
    const root    = options.root    ?? document;
    const observe = options.observe ?? false;

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

    if (_observer) { _observer.disconnect(); _observer = null; }

    if (observe) {
      _observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            _pendingNodes.push(node);
          }
        }
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

  // Bootstrap
  // Guard against multiple instances
  // loading pahawh-converter.js). Only the first instance bootstraps.

  if (typeof document !== "undefined" && !window.__pahawhConverterLoaded) {
    window.__pahawhConverterLoaded = true;
    const _runInit = () => { if (!_initRun) { _initRun = true; init(); } };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", _runInit);
    } else {
      _runInit();
    }
  }

  // Public API

  return {
    version:    VERSION,
    toPahawh,
    toRPA,
    toggle,
    convert,
    init,
    splitCompounds,
    _singleConsMap,     // exposed for round-trip in app.js (Pahawh → RPA)
    _singleConsRevMap,  // exposed for round-trip in app.js (RPA → Pahawh)
  };

})();
