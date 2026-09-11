# Live Captions — Brand Guide

Reference for visual identity, theming, and icon usage across the app.

## Product

| Field | Value |
|-------|-------|
| **Name** | Live Captions |
| **Tagline** | Open app → Start captions → Read |
| **Purpose** | Mobile-first real-time captions for in-person conversations |
| **Audience** | Deaf and hard-of-hearing users; accessibility is the product |

### Voice

- **Calm and direct** — short sentences, no jargon
- **High clarity** — say what happens, not what we built
- **Privacy-forward** — no account, no stored audio or transcripts

## Logo / mark

The brand mark is the Lucide **`Captions`** icon (rounded frame with two text lines).

- Use the same glyph for favicon, apple-touch icon, and in-app header
- Do **not** redraw or alter the icon geometry — use Lucide as-is
- On branded tiles (favicon, app icon): teal background `#115E59`, white icon
- In the header: icon uses `currentColor` at 20×20 beside the wordmark
- **Clear space:** at least the height of the icon on all sides

## Color tokens

Colors are defined as CSS custom properties in [`apps/web/src/styles/globals.css`](../apps/web/src/styles/globals.css). Always prefer tokens over hardcoded hex in components.

### Light (default)

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#ffffff` | Page background |
| `--color-text` | `#1A1A1A` | Primary text |
| `--color-text-muted` | `#5f6368` | History captions |
| `--color-accent` | `#115E59` | Brand, focus rings, listening indicator |
| `--color-live` | `#DC2626` | Start / Stop control |
| `--color-error` | `#B91C1C` | Errors |
| `--color-error-bg` | `rgba(185, 28, 28, 0.1)` | Error banner background |
| `--color-error-border` | `rgba(185, 28, 28, 0.45)` | Error banner border |
| `--color-error-text` | `#B91C1C` | Error banner text |
| `--color-status` | `#15803D` | Success / good latency |

### Dark

| Token | Value |
|-------|-------|
| `--color-bg` | `#000000` |
| `--color-text` | `#ffffff` |
| `--color-accent` | `#2DD4BF` |
| `--color-live` | `#DC2626` |
| `--color-error` | `#F87171` |
| `--color-status` | `#4ADE80` |

### High contrast

| Token | Value |
|-------|-------|
| `--color-bg` | `#000000` |
| `--color-text` | `#ffffff` |
| `--color-accent` | `#FFFF00` |
| `--color-live` | `#FF0000` |
| `--color-error` | `#FF6B6B` |
| `--color-status` | `#FFFF00` |

### Caption surface rule

**Do not tint the caption canvas.** Captions stay maximum contrast (black on white or white on black). Brand color is for chrome, focus, and the mark only.

## Typography

| Role | Font | Weights |
|------|------|---------|
| UI + captions | [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible) | 400, 700 |
| Fallback | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | — |

- **Chrome** (header, settings, controls): 400 regular; use 700 only where emphasis is needed
- **Active / interim captions**: 700 bold, tight tracking
- **History captions**: 400 regular, muted color

Atkinson Hyperlegible has no 500 weight — avoid `font-medium` for brand-critical UI; map to 400 or 700.

## Icons

**Library:** [Lucide](https://lucide.dev/) via `lucide-react` only. No mixed icon libraries or one-off SVGs in feature code.

| Use | Lucide icon | Notes |
|-----|-------------|-------|
| Brand mark / favicon | `Captions` | Same glyph everywhere |
| Settings | `Settings` | Header gear |
| Start captioning | `Play` | Filled on large control |
| Stop captioning | `Square` | Filled on large control |
| Close settings | `X` | 44×44 touch target |

**Not icons:** A− / A+ text-size controls stay as typography (clearer for this audience).

**Listening indicator:** CSS waveform bars, colored with `--color-accent` (not a Lucide icon).

Import through [`apps/web/src/components/icons.tsx`](../apps/web/src/components/icons.tsx) wrappers so `strokeWidth`, `aria-hidden`, and sizes stay consistent.

## Assets

| File | Purpose |
|------|---------|
| `apps/web/public/favicon.svg` | Browser tab icon (SVG, theme-aware) |
| `apps/web/public/apple-touch-icon.png` | iOS Add to Home Screen (180×180) |
| `apps/web/public/site.webmanifest` | PWA metadata (no service worker) |

### HTML wiring ([`apps/web/index.html`](../apps/web/index.html))

- `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
- `<link rel="manifest" href="/site.webmanifest" />`
- `<meta name="theme-color" />` — updated at runtime by theme preference

## Accessibility constraints

- Minimum **44×44px** touch targets on interactive controls
- **Focus ring:** 2px solid `var(--color-accent)`, 2px offset (`:focus-visible`)
- **Caption contrast:** never compromise for brand color
- Icons decorative in labeled buttons: `aria-hidden="true"`
- Standalone icon buttons: descriptive `aria-label`

## Lucide attribution

Icons from [Lucide](https://lucide.dev/) (ISC License). See [Lucide license](https://github.com/lucide-icons/lucide/blob/main/LICENSE).
