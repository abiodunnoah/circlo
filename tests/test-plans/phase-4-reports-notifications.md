# Phase 4 — Reports, Notifications, Security & Auth/UX Verification Checklist

## Reports
- [ ] Navbar shows "Reports" link only for admins (members do not see it)
- [ ] /reports defaults to the first group the admin manages; group selector switches groups
- [ ] Cycle selector lists all cycles from `groups/{g}/cycles` docs (not hard-coded)
- [ ] Summary cards show: total collected (excludes voided), total expected (approved, not left, joined by that cycle), recipients confirmed
- [ ] Per-cycle table shows: cycle number, recipient, collected amount, paid/total counts, "Complete" badge when all paid
- [ ] Bar chart plots collected vs expected per cycle; doughnut shows collected share
- [ ] "Export PDF" downloads a readable report (jsPDF + autotable) with group name and per-cycle rows
- [ ] Non-admin visiting /reports directly sees the admin-only notice
- [ ] Cycle 1 after a fresh group's first "Start New Cycle" appears in reports with correct recipient

## Notifications
- [ ] Mark a contribution as paid → the member receives a "paid" notification
- [ ] Start a new cycle → recipient gets "your_turn", all members get "new_cycle"
- [ ] Approve a join request → the member gets an "approved" notification
- [ ] NotificationsView lists real notifications newest-first, with All/Unread filters
- [ ] Unread badge in navbar shows count and updates live (onSnapshot)
- [ ] Clicking a notification marks it read and navigates to the group
- [ ] "Mark all as read" commits a batch and clears the badge
- [ ] Notifications created by others are not visible (query filters by current user)

## Security Rules (deployed, not emulated — Java not available)
- [ ] `firestore.rules` deploy succeeds
- [ ] Only admins can create/update groups; members can only self-create `pending` member docs (+`pendingCount` increment)
- [ ] Notifications create only for self or admin-of-group with a valid type in `['paid','your_turn','new_cycle','approved']`
- [ ] Users can only read/write their own `users/{uid}` doc
- [ ] Note: manual re-enable of Firestore test mode if the 30-day window lapses

## Auth & UX
- [ ] /forgot-password sends a reset email; shows "check your inbox" without leaking account existence
- [ ] Login page has a "Forgot your password?" link that preserves the invite `?invite=` query
- [ ] After registration, a verification email is sent and the account is created regardless
- [ ] Unverified users see an amber banner on the Dashboard with "Resend email" and "I've verified" buttons
- [ ] "I've verified" refreshes the user and confirms; banner disappears once verified
- [ ] All monetary values render via `formatNaira` (₦ with thousands separators) on Dashboard, Group List, Group Detail, Contributions, and Reports
- [ ] Invite modal has a "Share on WhatsApp" button that opens wa.me with the invite link pre-filled
- [ ] AppModal: Escape closes, backdrop click closes, focus moves into the dialog and returns to the trigger on close (tested with keyboard)

## Unit Tests
- [ ] `npm test` passes — contributions.spec asserts the `paid` notification write; notifications.spec covers subscribe/markAsRead/markAllAsRead/createNotification; reports.spec covers buildCycleRows (voids excluded, left/late members excluded, recipient fallback, sorting)
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds (chunk-size warning for ReportsView is expected — jsPDF + Chart.js; code-split later if needed)