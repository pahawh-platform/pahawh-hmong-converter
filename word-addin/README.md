# Pahawh Converter — Word Add-in

Convert Hmong RPA text to Pahawh Hmong Unicode script directly inside Microsoft Word — and back. Works with Microsoft 365 and Word 2016 or later on Windows and Mac.

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
pahawh-word-addin/
├── manifest.xml          ← Tells Word about the add-in (name, permissions, location)
├── taskpane.html         ← The sidebar UI
├── taskpane.js           ← Office API calls and UI logic
├── commands.html         ← Required stub for ribbon commands
└── pahawh-converter.js   ← Conversion library (same as the web version)
```

---

## How to install (sideloading for testing)

Sideloading lets you install the add-in directly from your local files without going through the Microsoft AppSource store. This is the standard way to test and use a custom add-in.

### Option A — Sideload from a shared network folder (Windows)

1. Put the `pahawh-word-addin` folder somewhere on your computer or a network share.
2. Edit `manifest.xml` — change all the `https://pahawh-platform.github.io/...` URLs to point to wherever you are hosting the files (see Hosting below).
3. Open the Windows Registry editor (`regedit`) and navigate to:
   ```
   HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs
   ```
4. Create a new key (folder) under `TrustedCatalogs` with any name.
5. Inside it, create two string values:
   - `Url` → the path to your shared folder, e.g. `\\MyComputer\Shared\pahawh-word-addin`
   - `Flags` → `1`
6. Restart Word.
7. Go to **Insert → Get Add-ins → My Organization** and you will see Pahawh Converter listed.

### Option B — Sideload on Mac

1. Find your Word add-ins folder:
   ```
   ~/Library/Containers/com.microsoft.Word/Data/Documents/wef/
   ```
   Create the `wef` folder if it does not exist.
2. Copy `manifest.xml` into that folder.
3. Restart Word.
4. Go to **Insert → Add-ins → My Add-ins** and select Pahawh Converter.

### Option C — Sideload via Microsoft 365 Admin Center (for organisations)

If you are deploying to multiple users in an organisation, an admin can upload `manifest.xml` through the Microsoft 365 Admin Center under **Settings → Integrated apps**. The add-in then appears automatically for all users in the organisation.

---

## Hosting the add-in files

The add-in files (`taskpane.html`, `taskpane.js`, `pahawh-converter.js`, `commands.html`) must be served over HTTPS. The manifest URLs must point to wherever these files are hosted.

### Option A — GitHub Pages (free, recommended)

If the files are in a `word-addin/` folder in the `pahawh-hmong-converter` GitHub repo with GitHub Pages enabled, the URLs are already correct in the manifest:

```
https://pahawh-platform.github.io/pahawh-hmong-converter/word-addin/taskpane.html
```

This is the simplest option and requires no extra setup beyond what you already have for the web converter.

### Option B — Local development server

For local testing, run any static file server from the `pahawh-word-addin` folder. For example with Node.js:

```bash
npx serve .
# or
npx http-server . --ssl
```

Office add-ins require HTTPS even locally. The easiest way to get a trusted local HTTPS certificate for development is:

```bash
npm install -g office-addin-dev-certs
office-addin-dev-certs install
```

Then update the manifest URLs to `https://localhost:3000/...` while testing.

---

## Updating the manifest for your own deployment

Before using the add-in, update these values in `manifest.xml`:

| Field | What to change |
|---|---|
| `<Id>` | Generate a new GUID at https://www.guidgenerator.com/ |
| `<SourceLocation>` | URL of your hosted `taskpane.html` |
| `<bt:Url id="Taskpane.Url">` | Same URL as above |
| `<bt:Url id="Commands.Url">` | URL of your hosted `commands.html` |
| All `<bt:Image>` entries | URLs of your icon images (16×16, 32×32, 80×80 PNG) |

---

## Font

The add-in sets the font to **Noto Sans Pahawh Hmong** on converted text. This font must be installed on the user's computer for the Pahawh characters to display correctly in the Word document.

Download and install it free from Google Fonts:
https://fonts.google.com/noto/specimen/Noto+Sans+Pahawh+Hmong

The task pane sidebar loads the font from Google Fonts automatically, so the preview always renders correctly even if the font is not installed locally.

---

## Publishing to Microsoft AppSource

To make the add-in available to anyone with a Microsoft account:

1. Create a Partner Center account at https://partner.microsoft.com
2. Submit `manifest.xml` and your hosted add-in URL through the Office Store submission process
3. Microsoft reviews the submission — typically 3–5 business days
4. Once approved it appears in **Insert → Get Add-ins** for all Word users

---

## License

MIT License — Copyright (c) 2025 Vao Her & Pahawh Platform
