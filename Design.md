# ResidentIQ Design System

A structured, typographic, and functional design system tailored for institutional hostel seat allocation.

## Design Principles

1. **Clarity over Decoration**: Every element serves an informational or operational purpose. No arbitrary doodles or unnecessary ornamentation.
2. **Typographic Hierarchy**: High-contrast, clean sans-serif typography for content with monospace accents for identifiers, roll numbers, and dates.
3. **Information Density**: Structured grids with balanced negative space that allow students and wardens to process status updates at a glance.
4. **Immediate Feedback**: Clear status indicators for room availability (Available, Locked in Cart, Booked).

---

## Color Palette

- **Primary Red** (`#D82C2C`) — Accent buttons, critical alerts, occupied/booked seat indicators
- **Charcoal Black** (`#1A1A1A`) — Primary text, dark backgrounds, high-emphasis headers
- **Pure White** (`#FFFFFF`) — Base background, card surfaces
- **Light Grey** (`#F2F2F2`) — Secondary surfaces, neutral badge backgrounds, borders
- **Border / Muted Grey** (`#E5E7EB` / `#A9B2B1`) — Grid lines, subtext, subtle borders
- **Accent Blue** (`#0033A0`) — In-cart hold indicators, informational badges
- **Success Green** (`#22C55E`) — Confirmed allocations, active window indicators

---

## Typography

- **Headings & Body**: Helvetica Neue / Inter / Sans-serif (`font-sans`)
  - Clean, legible, neutral tone.
  - Scale: H1 `2.5rem` / `3rem`, H2 `1.5rem` / `1.75rem`, Body `1rem` / `0.9375rem`.
- **Identifiers & Codes**: JetBrains Mono (`font-mono`)
  - Roll numbers, room numbers, dates, status badges, and table headers.

---

## Layout & Components

- **Grid System**: 12-column responsive grid with a 1480px max-width container.
- **Buttons**:
  - Primary: Solid `#D82C2C` with white text, 8px border radius, subtle hover lift.
  - Secondary: `#1A1A1A` outline with transparent background.
- **Cards**: White background with 1px `rgba(26,26,26,0.12)` border and rounded 8px corners.
- **Tables**: Monospaced uppercase headers on `#F2F2F2`, clear division lines, hover row highlights.
- **Badges**: Monospace uppercase pill or rounded tags for status, roll numbers, and years.
