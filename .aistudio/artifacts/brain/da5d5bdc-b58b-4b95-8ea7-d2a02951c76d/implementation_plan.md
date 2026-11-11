# OneDay Share Your Streak Card Ratio Update (5:4 Landscape)

## Implementation Summary

### 1. Canvas Dimensions & Aspect Ratio
- **Canvas Resolution**: Exactly `1200 × 960 px` (Width × Height).
- **Aspect Ratio**: Exactly `5:4` (`1200 / 960 = 1.25`).
- **CSS Aspect Ratio**: `aspect-ratio: 5 / 4` declared on both the card and preview wrapper container.
- **Export Dimensions**: Both the Web Share API (`navigator.share`) and `Download High-Res PNG` generate and export image files at `1200 × 960 px`.

### 2. Card Layout Composition (1200 × 960)
- **Top Section**:
  - OneDay official logo (`54px`) at top-left.
  - Brand name `ONEDAY` with `"BUILD YOUR SYSTEM"` uppercase descriptor beneath.
  - Authenticated user's actual display name capsule with verified checkmark at top-right.
- **Main Section**:
  - Centered `"MY PROGRESS"` glowing accent heading label.
  - Hero streak display: Fire emoji 🔥 alongside prominent numerical streak value in bold display typography.
  - `"DAY STREAK"` uppercase label with tracking.
  - Dedicated habit name pill badge (`HABIT: [Habit Name]`).
  - Natural, deterministic achievement sentence (`"[User] has been doing [Habit] for [X] days."`).
- **Bottom Section**:
  - Official `#ShareYourStreak` hashtag in bold white at bottom-left.
  - OneDay monolith icon with `OneDay · oneday.app` anchor at bottom-right.

### 3. Responsive Preview & Export Pipeline
- **Preview Scaling**: Proportional auto-scaling inside the modal using container measurement (`aspect-[5/4]`) to scale the `1200 × 960` canvas cleanly across mobile devices (e.g. 360px–420px widths) and desktop screens without stretching or distortion.
- **Export Handlers**:
  - `handleDownloadImage`: Generates PNG via `toBlob` at `1200 × 960 px` and downloads with filename `OneDay-Streak-[habit]-[streak]days-5x4.png`.
  - `handleNativeShare`: Generates PNG via `toBlob` at `1200 × 960 px`, packages as a `File`, and triggers the native OS share sheet with caption and hashtag.
- **Fallbacks**: Preserved automatic download and clipboard copy fallback modal for browsers without native file share support.
