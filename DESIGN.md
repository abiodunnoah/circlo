# Circlo Design System

Reference for UI work. Keep new screens consistent with the tokens and components below.
Visual source of truth: `docs/design-reference.png`.

## Positioning

**"Save together. Stay accountable."** Circlo digitizes Nigerian Ajo / Esusu / ROSCA groups —
premium fintech, community savings, visual accountability. Warm, clean, trustworthy. Mobile-first.

## Design tokens

Defined in `src/assets/main.css` under `@theme` (Tailwind v4). Blue brand + navy dark.

### Brand
`primary-*` (Circlo blue `#3155e7`; dark `#4f6fff`). `accent-*` is **mapped to the brand blue**
(the old amber accent is retired — amber survives only as `warning`).

### Semantic layout tokens
| Token | Light | Dark |
|---|---|---|
| `surface` | `#f7f8fc` | `#0b1020` |
| `card` | `#ffffff` | `#111827` |
| `card-soft` | `#f9fafb` | `#182033` |
| `line` | `#eaecf0` | `#293548` |
| `line-subtle` | `#f2f4f7` | `#1f2937` |
| `line-strong` | `#d0d5dd` | `#384766` |
| `fg` / `fg-2` / `fg-3` / `fg-4` | `#101828` / `#475467` / `#667085` / `#98a2b3` | `#f9fafb` / `#cbd5e1` / `#94a3b8` / `#64748b` |
| `muted` | `#667085` | `#94a3b8` |
| `inverse` | `#ffffff` | `#ffffff` |
| `overlay` | `rgba(0,0,0,.4)` | `rgba(0,0,0,.6)` |
| `avatar-1-bg`…`avatar-8-fg` | identity colors | dark variants |

### Status
`success` `#16a36a` · `warning` `#f59e0b` · `danger` `#dc4b4b` · `info` (brand blue).
Each has `-50/-100/-200` tint backgrounds and `-500/-600/-700/-800` shades, with dark overrides.

**Rule:** never use raw Tailwind palette colors for status — use the semantic tokens.

## Typography

Inter. Page title `text-2xl` (24/700) · section `text-lg` (18/600) · card heading `15–17/600` ·
body `text-sm`/`text-base` · metadata `text-xs`. **Money is always `tabular-nums`.**

## App shell

- **Desktop (lg+):** `AppSidebar` (256px) + `AppTopbar` + content. Sidebar: logo, primary nav
  (Dashboard, My Groups, Contributions, Rotation, Reports, Notifications, Profile), user footer
  (avatar, name, theme control, logout).
- **Mobile:** `AppTopbar` + `AppMobileNav` (5 items: Home, Groups, Contributions, Alerts, Profile).
- **Public pages:** `AppNavbar` (marketing navbar).
- `AppLayout` picks the shell from `route.meta.requiresAuth` and owns real-time subscriptions.

## Components (`src/components/common/`)

| Component | Notes |
|-----------|-------|
| `AppButton` | `variant`: primary/secondary/danger/success/warning/accent/outline/outline-danger/ghost; `size`: xs/sm/md/lg; `block`, `loading` |
| `AppCard` | `padding`, `hover` |
| `AppInput` | `as`: input/select/textarea; `#trailing` slot |
| `AppSelect` / `AppTextarea` / `AppDateInput` | thin wrappers over `AppInput` |
| `AppPageHeader` | title, subtitle, icon, `#actions` |
| `AppMoney` | `formatNaira` + `tabular-nums`; `size`, `muted` |
| `AppAvatar` / `AppAvatarGroup` | initials avatars; group collapses to `+N` |
| `AppProgress` / `AppProgressRing` | linear / circular progress (both expose `role=progressbar`) |
| `AppTabs` | `variant`: segmented / underline; `tabs` support `badge` |
| `AppStatusBadge` | icon + label status chip (never color alone) |
| `AppAlert` | danger/warning/info/success banner |
| `AppDropdown` | trigger + menu, outside-click/Esc close |
| `AppDrawer` | bottom sheet on mobile, centered dialog on desktop |
| `AppModal` | dialog with `#footer` slot |
| `AppConfirm` | confirm dialog (Modal + Buttons) |
| `AppErrorState` | icon, message, retry |
| `AppEmpty` | empty state with CTA |
| `AppSkeleton` / `AppLoadingSpinner` | loading |
| `AppToast` | toast container/host |
| `AppThemeToggle` | `variant`: icon / segmented (Light·Dark·System) |
| `AppLogo` | mark/full wordmark |
| `AppIconButton` | icon-only button with optional `badge` |
| `TableWrap` | `overflow-x-auto` table shell |
| `PayoutTimeline` | visual payout order |

## Status vocabulary

`paid`/`received` → success · `next` → info · `pending`/`unpaid` → warning ·
`owing`/`rejected`/`left` → danger · `active` → success/primary · `void` → neutral.
**Unpaid is amber (warning), never red** — it does not block the cycle.

## Theme

Light / Dark / **System** (`useTheme` composable; persisted in `localStorage` as `circlo-theme`;
FOUC guard in `index.html`). Use semantic tokens only — no raw `slate-*`/`bg-white`.

## Mobile rules

Wrap tables in `TableWrap`; use `truncate`/`break-words` to prevent overflow; `100dvh` shells;
`flex-wrap gap-2` header rows; content clears the bottom nav (`pb-24`).

## Accessibility

Global `:where(:focus-visible)` ring; icon-only buttons need `aria-label`; `role=progressbar`;
`aria-current="page"` on nav; status uses icon + text; targets ≥ 24px (mobile ~40px).

## Verification

`npm run lint`, `npm run build`, `npm test` (component + store + rules) before shipping.
