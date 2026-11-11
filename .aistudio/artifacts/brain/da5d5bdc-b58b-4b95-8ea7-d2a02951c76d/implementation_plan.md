# OneDay Share Your Streak — Portrait Ratio Update (4:5)

## Summary of Changes

### 1. Exact Portrait Dimensions (4:5)
- **Width**: `960 px`
- **Height**: `1200 px`
- **Aspect Ratio**: `4:5` (`960 / 1200 = 0.8`).
- **CSS Aspect Ratio**: `aspect-ratio: 4 / 5` declared on both the card component and preview container.
- **Export Resolution**: Exactly `960 × 1200 px` for both PNG downloads and native JPEG shares.

### 2. Card Design & Vertical Composition
- **Top Section**:
  - Official OneDay logo at top-left.
  - Brand name `ONEDAY` with `"BUILD YOUR SYSTEM"` uppercase descriptor beneath.
  - Authenticated user's actual display name capsule with verified checkmark at top-right.
- **Main Section**:
  - Centered `"MY PROGRESS"` accent heading label.
  - Hero streak display: Fire emoji 🔥 alongside prominent numerical streak value in bold display typography.
  - `"DAY STREAK"` uppercase label with tracking.
  - Dedicated habit name pill badge (`HABIT: [Habit Name]`).
  - Natural, deterministic achievement sentence (`"[User] has been doing [Habit] for [X] days."`).
- **Bottom Section**:
  - Official `#ShareYourStreak` hashtag in bold white at bottom-left.
  - OneDay monolith icon with `OneDay · oneday.app` anchor at bottom-right.

### 3. Sharing and Export Pipelines
- **Native Share**: Genuine JPEG (`image/jpeg`, quality 0.95, filename `.jpg`, 960 × 1200 px) shared via Web Share API files-only payload for Instagram compatibility, with automatic caption copy.
- **High-Resolution Download**: Lossless PNG (`image/png`, filename `.png`, 960 × 1200 px).
