# Circlo Design System

Reference for UI work. Keep new screens consistent with the tokens and components below.

## Positioning

**"Trust-first community savings."** Circlo digitizes Ajo / Esusu / ROSCA groups. The UI
prioritizes transparency (who paid, who receives next, the full payout order), warmth (not
cold banking), and clarity. **Mobile-first** — design phone layouts first, then scale up.

## Design tokens

Defined in `src/assets/main.css` under `@theme` (Tailwind v4).

| Token group | Purpose |
|-------------|---------|
| `primary-*` (emerald) | Brand, trust, financial health, primary actions |
| `accent-*` (amber) | The "pot", highlights, secondary emphasis |
| `success-*` / `warning-*` / `danger-*` / `info-*` | Semantic status |
| `surface` (`#f7f5f2` / `#0f172a`) | Warm app background |
| `card` (`#ffffff` / `#1e293b`) | Card/panel background |
| `line` (`#e8e3db` / `#334155`) | Borders |
| `line-subtle` (`#f1ede8` / `#1e293b`) | Subtle borders, hover states |
| `fg` / `fg-2` / `fg-3` / `fg-4` | Text hierarchy (primary → faint) |
| `muted` (`#64748b` / `#94a3b8`) | Secondary text |

**Rule:** never use raw Tailwind palette colors (`red-500`, `amber-100`, …) for status. Use the
semantic tokens so meaning stays consistent and themable.

## Typography

- Font: **Inter** (`--font-sans`)
- Scale: `text-xs` labels/meta · `text-sm` body · `text-lg` section titles · `text-2xl` page
  titles · `text-3xl`/`text-4xl` hero figures
- **Money is always `tabular-nums`** so columns align.

## Layout conventions

- Page shell: `max-w-*` + `px-4 sm:px-6 py-8`
- Cards: `bg-card rounded-xl border border-line shadow-sm`
- Navigation: desktop top nav; **mobile fixed bottom tab bar** (5 primary items) with a
  hamburger for secondary items (Join Requests, Reports) and logout
- Authenticated mobile content gets `pb-20` so it clears the tab bar

## Components (`src/components/common/`)

| Component | Notes |
|-----------|-------|
| `AppAlert` | Inline banner — `variant`: `danger`/`warning`/`info`/`success`, optional `title` + `action-label` |
| `AppAvatar` | Initials + deterministic color; `size`: `sm`/`md`/`lg`/`xl` |
| `AppButton` | `variant`: `primary`/`secondary`/`danger`/`success`/`ghost`/`accent`; `loading` |
| `AppProgress` | `value`/`max`, `variant`, `size`, `label`, `show-value` |
| `AppStat` | Metric card with icon chip; `interactive` for clickable |
| `AppStatusBadge` | Icon + label status chip |
| `PayoutTimeline` | Visual payout order (used in Group Detail → Schedule) |
| `AppCard`, `AppInput`, `AppModal`, `AppToast`, `AppEmpty`, `AppSkeleton`, `AppBackButton` | Primitives |

## Status vocabulary (`AppStatusBadge`)

| `status` | Meaning | Color |
|----------|---------|-------|
| `paid`, `received` | Paid / received the pot | success |
| `next` | Up next in the payout order | info |
| `pending` | Awaiting approval / unpaid | warning |
| `owing`, `rejected`, `left` | Owing, declined, left | danger |
| `active` | Admin / active | primary |
| `default` | Neutral | slate |

## Conventions

- **Money:** `formatNaira()` from `@/utils/format` + `tabular-nums`.
- **Avatars:** always `AppAvatar` (never hand-rolled initials).
- **Status:** always `AppStatusBadge` (never ad-hoc color chips).
- **Errors/notices:** always `AppAlert` (never raw red boxes).
- **Icons:** `@lucide/vue` — the only exception is the WhatsApp brand mark (no brand icons in Lucide).
- **Motion:** respect `prefers-reduced-motion` (handled globally in `main.css`).

## Dark mode

System-preference default with manual toggle (Sun/Moon icon in navbar). Persisted in
`localStorage` under `circlo-theme`. FOUC prevention script in `index.html`.

- Toggle: `useTheme()` composable (`src/composables/useTheme.js`)
- HTML class: `.dark` on `<html>` element
- **Always use semantic tokens** (`bg-card`, `text-fg`, `border-line`) — never raw `slate-*`
- Status tints (`-50`, `-100`) are overridden in `.dark` for dark-friendly backgrounds
- `bg-white` → `bg-card`, `text-slate-*` → `text-fg*`, `border-slate-*` → `border-line*`

## Accessibility

- Icon-only buttons require an `aria-label`.
- Progress bars expose `role="progressbar"` + `aria-valuenow/min/max`.
- Active navigation uses `aria-current="page"`.
- Keep mobile tap targets ≥ 44px.

## Verification

Run `npm run lint`, `npm run build`, and `npm test` before shipping UI changes.
