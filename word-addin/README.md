# Pahawh Converter — Word Add-in

Convert Hmong RPA text to Pahawh Hmong Unicode script directly inside Microsoft Word — and back. Works with Microsoft 365 and Word 2016 or later on Windows and Mac.

**Repo:** https://github.com/pahawh-platform/pahawh-hmong-converter/tree/main/word-addin
**Live task pane:** https://pahawh-platform.github.io/pahawh-hmong-converter/word-addin/taskpane.html

---

## What it does

- Opens as a sidebar (task pane) inside Word
- **Convert Selection** — select any RPA text, click the button, and it is replaced with Pahawh Unicode with the correct font applied automatically
- **Preview** — see the conversion before committing it to the document
- **Convert Entire Document** — converts all paragraphs in one pass (with confirmation)
- **Two-way** — toggle between RPA→Pahawh and Pahawh→RPA
- **Moob Leeg** auto-detection — the `aa` and `ndl` patterns are handled automatically
- Preserves paragraph structure — each paragraph is converted individually

---

## Files

```
word-addin/
├── manifest.xml          ← Tells Word about the add-in (name, permissions, location)
├── taskpane.html         ← The sidebar UI
├── taskpane.js           ← Office API calls and UI logic
├── commands.html         ← Required stub for ribbon commands
└── pahawh-converter.js   ← Conversion library (same as the web version)
```

---

## Hosting the add-in files

The add-in files must be served over **HTTPS**. The GitHub repo URL is for browsing code only — it does not serve files. You need one of the options below.

### Option A — GitHub Pages ✓ already live

GitHub Pages is enabled and the add-in files are live at:

```
https://pahawh-platform.github.io/pahawh-hmong-converter/word-addin/taskpane.html
https://pahawh-platform.github.io/pahawh-hmong-converter/word-addin/taskpane.js
https://pahawh-platform.github.io/pahawh-hmong-converter/word-addin/pahawh-converter.js
https://pahawh-platform.github.io/pahawh-hmong-converter/word-addin/commands.html
```

These are the URLs already written into `manifest.xml` — no changes needed.

### Option B — Local development server

For local testing only. Run a static HTTPS server from inside the `word-addin` folder:

```bash
# Install a trusted local HTTPS certificate first (one-time setup)
npm install -g office-addin-dev-certs
office-addin-dev-certs install

# Then serve the folder
npx serve .
```

Update the manifest URLs to `https://localhost:3000/...` while testing locally, and revert to the GitHub Pages URLs before deploying.

---

## How to install (sideloading)

Sideloading installs the add-in directly from your manifest file without going through the Microsoft AppSource store. This works for personal use and organisational deployment.

> **GitHub Pages is already live** — the manifest URLs are working and you can sideload immediately.

### Mac

1. Find your Word add-ins folder:
   ```
   ~/Library/Containers/com.microsoft.Word/Data/Documents/wef/
   ```
   Create the `wef` folder if it does not exist.
2. Download `manifest.xml` from the repo and copy it into that folder.
3. Restart Word.
4. Go to **Insert → Add-ins → My Add-ins** and select Pahawh Converter.

### Windows

1. Create a shared folder on your computer, e.g. `C:\PahawhAddin\`
2. Put `manifest.xml` in that folder.
3. Open the Registry editor (`regedit`) and go to:
   ```
   HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs
   ```
4. Create a new key under `TrustedCatalogs` with any name.
5. Inside it, add two string values:
   - `Url` → `C:\PahawhAddin\` (the folder path)
   - `Flags` → `1`
6. Restart Word.
7. Go to **Insert → Get Add-ins → My Organization** and select Pahawh Converter.

### Microsoft 365 Admin Center (for organisations)

An admin can upload `manifest.xml` through **Microsoft 365 Admin Center → Settings → Integrated apps**. The add-in then appears automatically for all users in the organisation without any manual installation steps.

---

## Updating the manifest

The manifest is pre-configured to work with GitHub Pages out of the box. The only field you should change before publishing publicly is the `<Id>` — generate a unique GUID at https://www.guidgenerator.com/ to avoid conflicts with other add-ins.

| Field | Default value | When to change |
|---|---|---|
| `<Id>` | Placeholder GUID | Before any public or AppSource release |
| `<SourceLocation>` | GitHub Pages URL | Only if hosting elsewhere |
| `<bt:Url id="Taskpane.Url">` | GitHub Pages URL | Only if hosting elsewhere |
| `<bt:Url id="Commands.Url">` | GitHub Pages URL | Only if hosting elsewhere |
| All `<bt:Image>` entries | GitHub Pages asset URLs | When you add your own icons |

---

## Font

The add-in sets the font to **Noto Sans Pahawh Hmong** on converted text. This font must be installed on the user's computer for the Pahawh characters to display correctly in the Word document itself.

Download and install free from Google Fonts:
https://fonts.google.com/noto/specimen/Noto+Sans+Pahawh+Hmong

The task pane sidebar loads the font from Google Fonts automatically, so the preview always renders correctly even without a local install.

---

## Publishing to Microsoft AppSource

To make the add-in available to anyone via **Insert → Get Add-ins**:

1. Create a Partner Center account at https://partner.microsoft.com
2. Submit `manifest.xml` and your GitHub Pages URL through the Office Store submission process
3. Microsoft reviews the submission — typically 3–5 business days
4. Once approved it appears in the Office Add-ins store for all Word users

---

## License

MIT License — Copyright (c) 2025 Vao Her & Pahawh Platform
