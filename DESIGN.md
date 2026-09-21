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
| `inverse` (`#ffffff`) | Text on filled/branded surfaces |
| `overlay` | Modal scrim |
| `avatar-1-bg`…`avatar-8-fg` | Deterministic avatar identity colors (theme-aware) |

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
- Authenticated mobile content gets `pb-24` so it clears the tab bar

**Mobile rules:** wrap tables in `TableWrap`; add `truncate` (fixed-width cells) or
`break-words` (user-generated names/emails) to prevent horizontal overflow; use
`min-h-[calc(100dvh-…)]` for full-height shells; header action rows use `flex-wrap gap-2`.

## Components (`src/components/common/`)

| Component | Notes |
|-----------|-------|
| `AppAlert` | Inline banner — `variant`: `danger`/`warning`/`info`/`success`, optional `title` + `action-label` |
| `AppAvatar` | Initials + deterministic color; `size`: `sm`/`md`/`lg`/`xl` |
| `AppButton` | `variant`: `primary`/`secondary`/`danger`/`success`/`warning`/`accent`/`outline`/`outline-danger`/`ghost`; `size`: `xs`/`sm`/`md`/`lg`; `block`, `loading`, `disabled` |
| `AppCard` | Card surface; `padding` (default `p-5`), `hover`. Extra layout classes fall through |
| `AppInput` | Label + control + error/hint; `as`: `input`/`select`/`textarea`; `#trailing` slot (e.g. password eye). Unlisted attrs (`autocomplete`, `minlength`…) pass to the control, `class` to the wrapper |
| `AppTabs` | Segmented control — `v-model`, `tabs` (strings or `{ label, value, badge }`) |
| `AppConfirm` | Confirm dialog built on `AppModal` + `AppButton`; `variant`, `confirm-label`, `loading` |
| `TableWrap` | Guarantees `overflow-x-auto` for tables |
| `AppProgress` | `value`/`max`, `variant`, `size`, `label`, `show-value` |
| `AppStat` | Metric card with icon chip; `interactive` for clickable |
| `AppStatusBadge` | Icon + label status chip |
| `PayoutTimeline` | Visual payout order (used in Group Detail → Schedule) |
| `AppModal`, `AppToast`, `AppEmpty`, `AppSkeleton`, `AppBackButton` | Primitives (`AppModal` exposes a `#footer` slot) |

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

- **Focus:** a global `:where(:focus-visible)` outline (in `main.css`) gives every control a
  visible ring. Components that define their own ring (`AppButton`, `AppInput`) opt out via
  `focus:outline-none`, so there is never a double indicator.
- **Icon-only buttons** require an `aria-label`.
- **Clickable cards/rows:** use a real `<button>`/`<RouterLink>` where content allows; for
  block-content cards use `role="button"` + `tabindex="0"` + `@keydown.enter` **and**
  `@keydown.space.prevent` (see the group cards in `DashboardView`/`GroupListView`).
- Progress bars expose `role="progressbar"` + `aria-valuenow/min/max`.
- Active navigation uses `aria-current="page"`.
- **Tap targets:** keep interactive controls ≥ 44px on mobile (icon-only buttons get ≥ 32px
  via padding; WCAG 2.5.8 minimum is 24px).
- **Page transitions** use `<Transition name="page">` (fade + 4px rise); neutralized
  automatically under `prefers-reduced-motion`.

## Verification

Run `npm run lint`, `npm run build`, and `npm test` before shipping UI changes.
