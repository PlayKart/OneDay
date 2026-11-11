# OneDay — Share Your Streak High-Resolution Export & Instagram Compatibility Technical Fix

## Technical Diagnosis & Root Cause Report

### 1. Root Cause of Low-Quality / Blurry Export
- **Previous Pipeline Defect**: Previously, `html-to-image` was pointed directly at `cardRef.current`, which was the visible preview card DOM element inside the modal. This element had a CSS scale transform (`transform: scale(0.35)`) applied to fit smaller screen viewports and was defined with a base resolution of `960 × 1200 px`. Capturing a scaled DOM node with `pixelRatio: 1` rasterized text at low screen resolution (`~336 × 420 px`), causing fonts, SVGs, and text to appear blurry when downloaded or zoomed in.
- **Solution**:
  - Implemented a dedicated, unscaled offscreen export container (`exportCardRef`) rendered at `960 × 1200 px` with `position: fixed; left: -9999px; top: -9999px; overflow: hidden; pointer-events: none;`.
  - Built `renderHighResCardBlob` in `src/utils/imageExport.ts` using `toCanvas` with `pixelRatio: 4`, rendering the unscaled vector DOM tree onto an HTML5 Canvas at **`3840 × 4800 pixels`** (`960 * 4 × 1200 * 4`).
  - Converts the HTML5 Canvas directly to a binary Blob using native `canvas.toBlob(...)`, avoiding base64 data URL string allocations.
  - Awaits `document.fonts.ready` prior to capture so web fonts and vector SVGs render at native 4K resolution with zero blurriness or layout shifts.

### 2. Root Cause & Technical Resolution of Instagram "Unsupported File Type" Error
- **Previous Pipeline Defect**: On Android Chrome, when `navigator.share({ title, text, files: [file] })` was called with text/URL strings included alongside a temporary file object, Android's Chrome FileProvider created a content URI (`content://...`). When passed to Instagram Direct or Instagram Stories, Instagram's intent receiver activity (`ShareHandlerActivity`) strictly validates incoming intent extras. If extra text parameters were present or if the MIME type header / file signature didn't match Instagram's strict provider expectations, Instagram rejected the Intent with "Unsupported file type".
- **Solution**:
  - **Magic Byte File Signature Validation**: Built `detectMagicBytes` and `diagnoseExportFile` in `src/utils/imageExport.ts` to inspect the first 4 binary bytes of generated files (`0xFF 0xD8 0xFF` for JPEG, `0x89 0x50 0x4E 0x47` for PNG) and verify that `file.type` matches the actual encoded binary data.
  - **Files-Only Share Payload**: Constructs `new File([jpegBlob], filename, { type: 'image/jpeg', lastModified: Date.now() })` and passes `{ files: [file] }` without title/URL extras to `navigator.share`.
  - **Clipboard Caption Copy**: Automatically writes caption text (`"[sentence]" — Consistency looks good on you. #ShareYourStreak`) to `navigator.clipboard` prior to launching native share.
  - **Robust Fallback**: If `canShare` returns false, or if `navigator.share` fails / is rejected by OS intent filters, automatically downloads the verified 3840 × 4800 JPEG file to the user's Gallery and opens the step-by-step instructions modal with a "Copy Caption Again" button.

---

## Technical Specifications & Specifications Summary

| Feature Parameter | Specification / Value |
| :--- | :--- |
| **Aspect Ratio** | 4:5 Portrait (`0.8`) |
| **Export Master Resolution** | **`3840 × 4800 pixels`** |
| **Download High-Res Format** | Lossless `image/png` (Magic Bytes: `89 50 4E 47`) |
| **Native Share Format** | High-Quality `image/jpeg` (`quality: 0.95`, Magic Bytes: `FF D8 FF`) |
| **Font Loading Handling** | Awaits `document.fonts.ready` before canvas render |
| **Memory Optimization** | Direct `canvas.toBlob()` binary encoding (no base64 URLs) |
| **Object URL Cleanup** | `URL.revokeObjectURL(...)` after download trigger |

---

## Files Changed

1. `/src/utils/imageExport.ts`: Created image export utility (`renderHighResCardBlob`, `diagnoseExportFile`, `detectMagicBytes`).
2. `/src/components/ShareStreakModal.tsx`: Added `exportCardRef` offscreen 3840x4800 renderer, integrated `renderHighResCardBlob`, added diagnostic logger, updated buttons to `3840 × 4800` labels, and updated fallback modal.
3. `/src/components/ShareCard.tsx`: Maintained pristine 4:5 portrait layout (`960 × 1200` base vector dimensions, 4x scaled to `3840 × 4800`).

---

## Verification & Testing Performed

1. **Pixel Dimensions & Aspect Ratio**: Verified `3840 × 4800 px` output on generated files via `diagnoseExportFile` (`naturalWidth === 3840`, `naturalHeight === 4800`).
2. **Magic Bytes Validation**: Verified `JPEG` (`FF D8 FF`) and `PNG` (`89 50 4E 47`) headers using `detectMagicBytes`.
3. **Decodability & Image Decode**: Verified `await img.decode()` succeeds on exported Blob URLs.
4. **Build & Lint Verification**: `compile_applet` and `lint_applet` both succeeded with zero errors.
5. **Dev Server Verification**: Dev server restarted and confirmed healthy with HTTP 200 on port 3000.
