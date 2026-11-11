# OneDay Share Your Streak — Instagram File Compatibility Fix

## Summary of Fixes

### 1. Genuine JPEG Encoding for Native Sharing
- **MIME Type**: `image/jpeg`
- **Filename**: `oneday-streak-[habit]-[streak]days.jpg`
- **Encoding**: Genuine JPEG encoding via `toJpeg` from `html-to-image` with `quality: 0.95`.
- **Dimensions**: Preserves the exact 5:4 aspect ratio (`1200 × 960 px`).

### 2. Web Share API Optimization for Instagram
- **Files Only Payload**: `navigator.share` is invoked with `{ files: [file] }` only (omitting text/title) to eliminate the "Unsupported file type" error reported by Instagram Direct and Instagram Stories on Android/iOS.
- **Clipboard Caption Copy**: Automatically copies the full caption (`"[sentence]" — Consistency looks good on you. #ShareYourStreak`) to the clipboard so users can instantly paste it into Instagram or WhatsApp.
- **Cancellation Handling**: Gracefully catches and ignores `AbortError` when users intentionally cancel the native share sheet.

### 3. Dual Export Pipelines Maintained
- **Native Share (`Share Card`)**: Generates and shares `image/jpeg` (`.jpg`).
- **Download High-Res PNG (`Download PNG`)**: Retains the lossless PNG download pipeline (`image/png`, `.png`).

### 4. Verification
- TypeScript linter and Vite build passed with zero errors.
- Canvas dimensions verified at `1200 × 960 px` (5:4 aspect ratio).
