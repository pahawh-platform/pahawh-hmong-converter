/**
 * taskpane.js — Pahawh Converter Word Add-in
 * Depends on: office.js (loaded by taskpane.html), pahawh-converter.js
 *
 * What this file does:
 *   - Initialises the Office add-in on load
 *   - Reads selected text (or entire document) via the Word JavaScript API
 *   - Passes text through PahawhConverter.toPahawh() or PahawhConverter.toRPA()
 *   - Writes converted text back into the document with the correct font applied
 *   - Handles paragraphs individually to preserve line breaks in the document
 */

/* global Office, Word, PahawhConverter */

// ─── Direction state ──────────────────────────────────────────────────────────

let isSwapped = false; // false = RPA→Pahawh, true = Pahawh→RPA

const PAHAWH_FONT = 'Noto Sans Pahawh Hmong';
const RPA_FONT    = 'Calibri'; // Word's default body font — change if your doc uses another

// ─── Office initialisation ────────────────────────────────────────────────────

Office.onReady(info => {
  if (info.host === Office.HostType.Word) {
    showStatus('Ready. Select text in your document to begin.', 'info');
  }
});

// ─── Direction toggle ─────────────────────────────────────────────────────────

function setDirection(swap) {
  if (isSwapped === swap) return;
  isSwapped = swap;

  document.getElementById('btnRtP').classList.toggle('active', !swap);
  document.getElementById('btnPtR').classList.toggle('active',  swap);
  document.getElementById('dirPill').classList.toggle('right',  swap);

  // Update instruction text
  const instruction = document.getElementById('instruction');
  if (swap) {
    instruction.innerHTML = '<strong>Select</strong> Pahawh Hmong text in your document, then click <strong>Convert Selection</strong>. The selected text will be replaced with RPA and the font will be reset.';
  } else {
    instruction.innerHTML = '<strong>Select</strong> Hmong RPA text in your document, then click <strong>Convert Selection</strong>. The selected text will be replaced with Pahawh Unicode and the font will be set automatically.';
  }

  // Clear any existing preview and status when direction changes
  clearPreview();
  hideStatus();
}

// ─── Preview ──────────────────────────────────────────────────────────────────

async function previewSelection() {
  clearPreview();
  hideStatus();

  try {
    await Word.run(async context => {
      const selection = context.document.getSelection();
      selection.load('text');
      await context.sync();

      const text = selection.text.trim();
      if (!text) {
        showStatus('Nothing is selected. Select some text first.', 'info');
        return;
      }

      // Run conversion in preview mode
      const converted = isSwapped
        ? PahawhConverter.toRPA(text)
        : PahawhConverter.toPahawh(text, 'plain');

      // Check for Leeg dialect
      if (!isSwapped) {
        const isLeeg = PahawhConverter.detectLeeg(text);
        document.getElementById('leegRow').classList.toggle('visible', isLeeg);
      } else {
        document.getElementById('leegRow').classList.remove('visible');
      }

      // Show preview
      const previewBox = document.getElementById('previewBox');
      previewBox.textContent = converted;
      previewBox.classList.toggle('is-rpa', isSwapped);
      document.getElementById('previewWrap').classList.add('visible');
    });
  } catch (err) {
    showStatus('Could not read selection: ' + err.message, 'error');
  }
}

// ─── Convert selection ────────────────────────────────────────────────────────
//
// The Word API works paragraph by paragraph. We iterate over all paragraphs
// that overlap with the selection, convert each one's text, and write back.
// This preserves paragraph breaks in the document rather than collapsing
// everything into a single run of text.

async function convertSelection() {
  clearPreview();
  hideStatus();
  setButtonsDisabled(true);

  try {
    await Word.run(async context => {
      const selection = context.document.getSelection();

      // Load the paragraphs that overlap with the selection
      const paragraphs = selection.paragraphs;
      paragraphs.load('items');
      await context.sync();

      if (paragraphs.items.length === 0) {
        showStatus('Nothing is selected. Select some text first.', 'info');
        setButtonsDisabled(false);
        return;
      }

      // Load text for all paragraphs in one sync call (one round-trip)
      paragraphs.items.forEach(p => p.load('text'));
      await context.sync();

      let convertedCount = 0;

      for (const para of paragraphs.items) {
        const text = para.text.trim();
        if (!text) continue; // skip empty paragraphs

        // Convert the paragraph text
        const converted = isSwapped
          ? PahawhConverter.toRPA(text)
          : PahawhConverter.toPahawh(text, 'plain');

        // Get all runs in this paragraph and clear them
        // Then insert the converted text as a new run with the correct font
        const paraRange = para.getRange();
        paraRange.insertText(converted, Word.InsertLocation.replace);

        // Apply font to the paragraph
        para.font.name = isSwapped ? RPA_FONT : PAHAWH_FONT;
        para.font.size = isSwapped ? 11 : 13; // Pahawh glyphs render better slightly larger

        convertedCount++;
      }

      await context.sync();

      const direction = isSwapped ? 'RPA' : 'Pahawh Unicode';
      showStatus(
        `✓ Converted ${convertedCount} paragraph${convertedCount !== 1 ? 's' : ''} to ${direction}.`,
        'success'
      );
    });

  } catch (err) {
    showStatus('Conversion failed: ' + err.message, 'error');
  } finally {
    setButtonsDisabled(false);
  }
}

// ─── Convert entire document ──────────────────────────────────────────────────
//
// Same approach as convertSelection but iterates over ALL paragraphs in the
// document. Asks for confirmation first since this cannot be undone easily.

async function convertAll() {
  clearPreview();
  hideStatus();

  // Simple confirmation — the Office task pane doesn't have native dialogs
  // so we use a status message as a two-step confirm
  const btn = document.getElementById('btnConvertAll') || event.target;
  if (!btn._confirming) {
    btn._confirming = true;
    btn.textContent = 'Tap again to confirm — converts entire doc';
    btn.style.borderColor = '#C0392B';
    btn.style.color = '#C0392B';
    setTimeout(() => {
      btn._confirming = false;
      btn.textContent = 'Convert Entire Document';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 3000);
    return;
  }

  // Second tap — proceed
  btn._confirming = false;
  btn.textContent = 'Convert Entire Document';
  btn.style.borderColor = '';
  btn.style.color = '';

  setButtonsDisabled(true);

  try {
    await Word.run(async context => {
      const body = context.document.body;
      const paragraphs = body.paragraphs;
      paragraphs.load('items');
      await context.sync();

      paragraphs.items.forEach(p => p.load('text'));
      await context.sync();

      let convertedCount = 0;

      for (const para of paragraphs.items) {
        const text = para.text.trim();
        if (!text) continue;

        const converted = isSwapped
          ? PahawhConverter.toRPA(text)
          : PahawhConverter.toPahawh(text, 'plain');

        const paraRange = para.getRange();
        paraRange.insertText(converted, Word.InsertLocation.replace);

        para.font.name = isSwapped ? RPA_FONT : PAHAWH_FONT;
        para.font.size = isSwapped ? 11 : 13;

        convertedCount++;
      }

      await context.sync();

      const direction = isSwapped ? 'RPA' : 'Pahawh Unicode';
      showStatus(
        `✓ Converted entire document — ${convertedCount} paragraph${convertedCount !== 1 ? 's' : ''} to ${direction}.`,
        'success'
      );
    });

  } catch (err) {
    showStatus('Conversion failed: ' + err.message, 'error');
  } finally {
    setButtonsDisabled(false);
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function showStatus(message, type = 'info') {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = `status visible ${type}`;
}

function hideStatus() {
  const el = document.getElementById('status');
  el.className = 'status';
}

function clearPreview() {
  document.getElementById('previewBox').textContent = '';
  document.getElementById('previewWrap').classList.remove('visible');
  document.getElementById('leegRow').classList.remove('visible');
}

function setButtonsDisabled(disabled) {
  document.getElementById('btnConvert').disabled = disabled;
  document.getElementById('btnPreview').disabled = disabled;

  if (disabled) {
    document.getElementById('btnConvert').textContent = 'Converting…';
  } else {
    document.getElementById('btnConvert').textContent = 'Convert Selection';
  }
}
