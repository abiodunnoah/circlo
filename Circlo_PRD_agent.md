# Circlo — Product Requirements Document
**Version:** 1.2
**Date:** July 2025
**Author:** Noah
**Status:** Active

---

## 1. Product Overview

Circlo is a web application that digitizes the management of Ajo and Esusu — traditional Nigerian rotating savings groups (ROSCAs). It provides group admins with tools to create and manage savings groups, track member contributions, control member access, and monitor rotation cycles — while giving members visibility into their own contribution history and group progress.

Circlo is built as a progressive-web-app-ready application targeting Nigerians who run or participate in informal savings groups and want a reliable, transparent digital record of their activity.

---

## 2. Problem Statement

Ajo/Esusu groups are typically managed through paper records, WhatsApp chats, or spreadsheets. This leads to:

- Disputes over contribution records and rotation order
- No single source of truth for group admins and members
- Difficulty tracking who has received the pot and who is next
- Manual, error-prone payment tracking with no audit trail
- No transparency for members about group finances

---

## 3. Goals & Success Metrics

### Goals
- Provide a reliable digital ledger for Ajo/Esusu groups
- Give group admins full control over membership and contribution tracking
- Give members visibility into their contributions and rotation status
- Replace paper/WhatsApp-based tracking with a structured, transparent system

### Success Metrics (v1)
- Admin can create a group and manage members end-to-end without confusion
- All contributions for a cycle are accurately tracked and reflected in reports
- Members can log in and see their own contribution history
- PDF export of group report is accurate and readable

---

## 4. Target Users

### 4.1 Group Admin
The person who organizes the Ajo group. Responsible for creating the group, generating invite links, approving members, marking contributions as paid, managing the rotation cycle, and removing members between cycles.

### 4.2 Group Member
A participant in the savings group. Can view their contribution history, see who has received the pot, and track the current cycle progress.

---

## 5. Features & Requirements

### 5.1 Landing Page
- Hero section with app name, tagline, and "Get Started" CTA (→ Register)
- How it works — 3-step explainer
- Feature highlights section
- Footer with credits
- Unauthenticated users always land here first
- Authenticated users are redirected directly to the Dashboard

### 5.2 Authentication
- Register with email and password
- Confirm password field on registration — validates passwords match on submit before calling Firebase
- Show/hide password toggle on both Login and Register password fields
- Login / Logout
- Firebase Auth as the auth provider
- Protected routes — unauthenticated users redirected to Landing page
- Invite link preserves groupId through the auth flow (register or login)
- Already-logged-in user clicking an invite link → join request created immediately (no re-auth)

### 5.3 Group Management
- Admin can create a new group with: name, contribution amount, frequency (weekly/monthly), start date
- Admin can view all groups they manage
- Admin can view group details: members, cycle progress, contributions
- Member can view all groups they belong to (approved only)
- Group detail shows rotation order, who has received, who is next

### 5.4 Member Management
- Admin generates a unique invite link per group and shares it (e.g. via WhatsApp)
- Member clicks the invite link — the link carries the groupId as a URL parameter
- If the member has no account → taken to Registration page (groupId preserved)
- If the member already has an account but is logged out → taken to Login page (groupId preserved)
- If the member is already logged in → pending join request is created immediately
- After authenticating, a join request is automatically created with status: "pending"
- Admin sees all pending requests on the group dashboard and approves or rejects
- Only approved members appear in rotation and contribution tracking
- On approval, the member immediately sees the group in their dashboard
- No mid-cycle member exits once a cycle is active

### 5.4.1 Member Access Flow (Step by Step)
```
Step 1 → Admin generates invite link from group dashboard
Step 2 → Admin shares link via WhatsApp or any channel
Step 3 → Member clicks the link
Step 4 → ┌─ Not logged in → Register or Login page (groupId preserved)
         └─ Logged in     → Join request auto-created immediately
Step 5 → After auth (if was logged out): join request auto-created with status "pending"
Step 6 → Admin sees pending request on group dashboard → Approves or Rejects
Step 7 → On approval: member sees the group in their dashboard immediately
```

### 5.5 Cycle Management
- A **cycle** is a single payout round: every eligible member contributes and one designated member receives the pot
- A **rotation** is the full set of cycles covering every eligible member once
- Admin manually starts each cycle via a "Start New Cycle" button on the group detail page
- The first cycle begins when the admin triggers it (not automatically on startDate)
- When a new cycle starts:
  - `currentCycle` increments by 1
  - `currentCycleStartDate` records the timestamp
  - The next unreceived eligible member (lowest `rotationOrder`) becomes `currentCycleRecipientId`
  - Members approved since the last cycle enter the rotation at the next rotation boundary
- "Start New Cycle" is gated on the current cycle's recipient having been marked as paid
- When every eligible member has received once (rotation concludes):
  - `rotation` increments
  - All eligible members' `hasReceived` resets to `false`
  - `joinedCycle` is reset to the new cycle so mid-rotation joins become eligible
- Member removal is only allowed between rotations
- Dashboard shows rotation progress: "X of Y members have received the pot this rotation"

### 5.6 Contribution Tracking
- Admin manually marks a member as paid for a given cycle — **any** eligible member, one record per member per cycle
- System records: userId, cycle number, amount, date paid, markedBy (adminId)
- Receiving the pot is a separate fact, tracked via `hasReceived` on the member doc and set by **Confirm Payout** (the current cycle recipient only)
- Admin can see at a glance who has paid and who has not per cycle
- Members can see their own full contribution history ("My Contributions")
- Wrongly-marked payments are soft-voided (`status: "void"`) — the record is preserved for audit but excluded from totals
- "Start New Cycle" gates on the recipient having had their payout confirmed; unpaid dues from other members surface as a non-blocking amber warning (a single late payer must not freeze the group — 35% of ROSCA members default at least once)

### 5.7 Rotation Tracking
- Admin sets rotation order when approving members (sequential 1, 2, 3...)
- The rotation order is a fixed sequence that repeats each rotation
- System tracks who has received the pot (`hasReceived: true`) across cycles within a rotation
- Dashboard shows who is next in rotation — the member with the lowest `rotationOrder` whose `hasReceived` is still `false`
- When every eligible member has received, a new rotation begins and `hasReceived` resets

### 5.8 Dashboard
- Overview of all groups (separate admin and member views)
- Active cycle progress per group
- Quick stats: total contributed (real sum of the user's paid records), next payout recipient, members paid this cycle

### 5.9 Notifications (In-App)
- Contribution marked as paid → notify the member
- It is your turn to receive the pot → notify the member
- New cycle started → notify all group members
- Join request approved → notify the member
- Dedicated Notifications page with read/unread states (unread badge in the navbar)
- Admin-only writes via `createNotification`; rules restrict to admin-of-group or self

### 5.10 Reports
- Per-group contribution summary by cycle
- Who has paid / not paid per cycle
- Full rotation history
- Export report to PDF using jsPDF

### 5.11 Member Exit (Opt-Out)
- Members can only exit between cycles (after a cycle ends, before the next begins)
- Exit is admin-controlled: the admin removes the member via a "Remove" button in the member list
- The "Remove" button only appears during the between-cycle window
- When a member is removed:
  - Their member record is preserved with `status: "left"` and `leftAt` timestamp (for audit trail)
  - Remaining members' `rotationOrder` auto-shifts up to fill the gap
  - `totalMembers` decrements
  - Past contribution history is retained in reports
- Member-initiated "request to leave" feature is deferred to v2

### 5.12 Profile Page
- User can update their display name
- View all groups they belong to
- Basic account info display

### 5.13 404 Page
- Friendly "page not found" screen for unmatched routes
- Link back to Dashboard or Landing

---

## 6. Technical Stack

| Layer | Tool |
|---|---|
| Frontend | Vue 3 + Composition API |
| Routing | Vue Router |
| State Management | Pinia |
| Backend / Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Charts | Chart.js |
| PDF Export | jsPDF |
| Payments (Stretch) | Paystack API |
| Hosting (Stretch) | Firebase Hosting / Vercel |
| Build Tool | Vite |
| Language | JavaScript (no TypeScript) |
| Linting | ESLint + Prettier + Oxlint |
| Unit Testing | Vitest + Vue Test Utils |
| E2E Testing | Playwright (Phase 4, optional) |
| Local Emulation | Firebase Emulator Suite |

---

## 7. Firestore Data Model

### `users/{userId}`
```
displayName   string
email         string
createdAt     timestamp
```

### `groups/{groupId}`
```
name                string
adminId             string (userId)
contributionAmount  number
frequency           "weekly" | "monthly"
startDate           timestamp
totalMembers        number
currentCycle        number — current payout round (a cycle = one payout; a rotation = N cycles)
currentCycleStartDate timestamp  — when the current cycle was started
currentCycleRecipientId string — member id designated to receive the pot this cycle
rotation            number — increments each time a full rotation concludes
status              "active" | "completed"
inviteCode          string
createdAt           timestamp
```

### `groups/{groupId}/members/{memberId}`
```
userId        string — populated after member registers or logs in via invite link
displayName   string
email         string
rotationOrder number — set by admin at time of approval
hasReceived   boolean
status        "pending" | "approved" | "rejected" | "left"
joinedAt      timestamp — when member submitted join request
approvedAt    timestamp — when admin approved the request
leftAt        timestamp — when admin removed the member between cycles
```

### `groups/{groupId}/contributions/{contributionId}`
```
userId      string
cycle       number
amount      number — snapshotted from the group at marking time
paidAt      timestamp
markedBy    string (adminId)
status      "paid" | "void" — void keeps the record for audit but excludes it from totals
voidedBy    string (adminId) — set when voided
voidedAt    timestamp — set when voided
```
Contribution doc ids are deterministic (`{cycle}_{userId}`) so double-clicks cannot create duplicates.

### `notifications/{notificationId}`
```
userId      string
groupId     string
type        "paid" | "your_turn" | "new_cycle" | "approved"
message     string
read        boolean
createdAt   timestamp
```

### `groups/{groupId}/cycles/{cycle}` (added Phase 4)
```
cycle          number — cycle number within the current rotation
recipientId    string — member id who receives the pot this cycle
recipientName  string — displayName snapshotted for history
rotation       number — rotation this cycle belonged to
startedAt      timestamp — when the cycle started
receivedAt     timestamp — set when the payout is confirmed (added on confirmPayout, merge-safe)
receivedBy     string — adminId that confirmed the payout
```
One doc per cycle, written in `startNewCycle`; `receivedAt`/`receivedBy` stamped in `confirmPayout` via `setDoc(..., { merge: true })`. This powers rotation history in Reports.

---

## 8. Folder Structure

```
circlo/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/               # fonts, icons, images
│   ├── components/
│   │   ├── common/           # buttons, modals, loaders, badges, toast
│   │   ├── groups/           # group cards, group list items
│   │   └── contributions/    # contribution table, status badge
│   ├── composables/          # reusable logic (useAuth, useGroup, useContribution, useCycle, useAsync)
│   ├── firebase/
│   │   └── index.js          # firebase init + exports (auth, db)
│   ├── router/
│   │   └── index.js          # all routes + navigation guards
│   ├── stores/
│   │   ├── auth.js           # user session, login, logout, register
│   │   ├── groups.js         # group CRUD, member management, cycle management
│   │   ├── contributions.js  # contribution tracking
│   │   └── notifications.js  # in-app notifications
│   ├── views/
│   │   ├── LandingView.vue
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── dashboard/
│   │   │   └── DashboardView.vue
│   │   ├── groups/
│   │   │   ├── GroupListView.vue
│   │   │   ├── GroupDetailView.vue
│   │   │   └── CreateGroupView.vue
│   │   ├── contributions/
│   │   │   └── ContributionsView.vue
│   │   ├── notifications/
│   │   │   └── NotificationsView.vue
│   │   ├── profile/
│   │   │   └── ProfileView.vue
│   │   ├── reports/
│   │   │   └── ReportsView.vue
│   │   └── NotFoundView.vue
│   ├── App.vue
│   └── main.js
├── tests/
│   ├── unit/                 # Vitest tests for stores and composables
│   │   ├── stores/
│   │   └── composables/
│   └── e2e/                  # Playwright tests (Phase 4)
├── test-plans/               # Manual testing checklists per phase
│   ├── phase-0-setup.md
│   ├── phase-1-auth-groups.md
│   └── phase-2-contributions.md
├── .env                      # Firebase config keys (never commit this)
├── .env.example              # Template showing required env variables
├── firebase.json             # Firebase project config (hosting, emulators)
├── vitest.config.js          # Vitest configuration
├── index.html
└── vite.config.js
```

---

## 9. Build Phases

### Phase 0 — Setup & Landing ← CURRENT PHASE
- [ ] Scaffold project with Vue 3, Vue Router, Pinia, ESLint, Prettier
- [ ] Install Firebase SDK and configure in `src/firebase/index.js`
- [ ] Set up folder structure as defined above
- [ ] Configure Vue Router with all routes and navigation guards
- [ ] Build LandingView.vue
- [ ] Build NotFoundView.vue (404)
- [ ] Fix index.html (title → "Circlo", lang → "en")
- [ ] Remove placeholder stores/counter.js
- [ ] Create .env.example with all VITE_FIREBASE_* keys
- [ ] Set up Firebase Emulator Suite (firebase.json)
- [ ] Enable Firestore test mode in Firebase console for development (30-day window, re-enable as needed)
- [ ] Install and configure Vitest + Vue Test Utils
- [ ] Write manual test checklist: Phase 0 setup verification

### Phase 1 — Auth + Groups
- [ ] Install Firebase SDK npm dependency
- [ ] Auth Pinia store — session persistence with onAuthStateChanged
- [ ] RegisterView — email/password registration (supports invite link flow)
- [ ] LoginView — email/password login
- [ ] Logout functionality
- [ ] Navigation guard — redirect unauthenticated users to Landing
- [ ] Toast notification system (common component)
- [ ] useAsync composable — reusable loading/error handling pattern
- [ ] CreateGroupView — admin creates a group
- [ ] GroupListView — admin and member views of their groups
- [ ] GroupDetailView — members list, cycle info, pending approvals
- [ ] Admin: approve / reject pending member requests
- [ ] Invite link generation (stored as inviteCode on group doc)
- [ ] Invite link join flow — auto-create pending member record after auth
- [ ] Already-logged-in invite handling — immediate join request
- [ ] Admin-initiated member removal (between cycles only)
- [ ] Rotations order auto-shift on member removal
- [ ] Vitest tests: auth store, group store, invite flow logic
- [ ] Manual test checklist: Phase 1 verification

### Phase 2 — Contributions + Rotation
- [x] Admin marks a member as paid for a cycle (any eligible member; N records per cycle)
- [x] ContributionsView — per-cycle payment status table (group Contributions tab)
- [x] Rotation order display — who has received, who is next
- [x] Cycle management: "Start New Cycle" button and logic
- [x] Cycle = one payout round; rotation = N cycles; hasReceived persists across cycles, resets on rotation
- [x] Payout gating: "Start New Cycle" requires the current recipient's payout confirmed
- [x] Amber warning when contributors have unpaid dues for the current cycle (non-blocking)
- [x] DashboardView — group overview, stats, next payout (real total contributed)
- [x] Contributions Pinia store (deterministic doc ids, soft-void, confirm-payout, my-contributions)
- [x] My Contributions page (per-member history)
- [x] Vitest tests: contribution store, rotation/cycle logic
- [ ] Manual test checklist: Phase 2 verification

### Phase 3 — Notifications + Reports
- [ ] In-app notifications (write to notifications collection on key events)
- [ ] NotificationsView — list with read/unread states
- [ ] Install Chart.js
- [ ] Install jsPDF
- [ ] ReportsView — contribution summary, paid/unpaid per cycle, rotation history
- [ ] PDF export using jsPDF
- [ ] Notifications Pinia store
- [ ] Manual test checklist: Phase 3 verification

### Phase 4 — Polish
- [ ] ProfileView — update display name, view groups
- [ ] Contribution history per member
- [ ] Refine invite link UX (WhatsApp share button, link formatting)
- [ ] Write `firestore.rules` with business-logic rules (admin-only writes, members see own groups, self-owned user doc, etc.)
- [ ] Create `firebase.json` (project config + emulator setup)
- [ ] Write Firestore rules tests with `@firebase/rules-unit-testing` (run against emulator)
- [ ] Deploy locked rules via `firebase deploy --only firestore:rules` — replaces test mode before production
- [ ] Install and configure Playwright for E2E smoke tests
- [ ] favicon
- [ ] Final manual QA pass
- [ ] Production readiness review

### Phase 5 — Stretch Goals
- [ ] Paystack payment integration
- [ ] PWA setup (manifest, service worker)
- [ ] Push notifications

### Phase 6 — v2 (Chit Fund Mode)
- [ ] Arrears tracker: "Collected but owing" badge (member `cyclesOwed`) + report integration — highest-value risk signal
- [ ] Multiple slots per member (pay 2×, collect 2×)
- [ ] Slot swapping between members (with admin confirmation)
- [ ] Auction/bidding mode (chit fund): winner bids lowest discount; surplus redistributed — addresses the "last position gets zero return" fairness gap
- [ ] Organizer fee/commission support
- [ ] Surety requirement for early winners (post-approval default protection)

---

## 10. Business Rules

1. Each group has exactly one admin — no co-admins in v1
2. A user can belong to multiple groups simultaneously
3. Members can only join a group via an admin-generated invite link — no open self-join
4. A member must have a registered Circlo account before a join request can be created
5. Join requests are auto-created after the member authenticates via the invite link (or immediately if already logged in)
6. Admin must explicitly approve every join request before the member gains group access
7. Once a cycle is active, no member can exit mid-cycle
8. Payment marking is manual by admin only — no auto-detection in v1
9. Rotation order is set by admin at the time of member approval and repeats each cycle
10. `userId` on the member record is only populated after the member registers or logs in
11. A new cycle can only be started by the admin — no auto-rotation
12. When a member is removed between cycles, rotation order auto-shifts for remaining members
13. Past contribution history is never deleted — preserved for audit and reports

---

## 11. Environment Variables

Create a `.env` file in the project root with the following Firebase config values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

All variables must be prefixed with `VITE_` to be accessible in Vue 3 + Vite.

---

## 12. Out of Scope (v1)

- Automatic payment detection or bank integration
- Multiple admins per group
- Member-initiated payment requests
- Member-initiated leave requests
- Real-time chat within groups
- Multi-currency support
- SMS notifications
- Dark mode

---

## 13. Testing Strategy

### 13.1 Firebase Emulator Suite
- Local emulators for Auth and Firestore used during all development
- Prevents hitting production APIs during testing
- Emulator dashboard provides real-time Firestore inspection

### 13.2 Unit Tests (Vitest + Vue Test Utils)
| Target | What to test |
|---|---|
| Pinia stores | State mutations, getters, actions in isolation (mocked Firebase) |
| Composables | Business logic: rotation shift, cycle transitions, invite code gen |
| Security rules | Firestore security rules tested against emulator |

Tests are written alongside features (per-phase), not deferred.

### 13.3 Manual Test Checklists
Located in `tests/test-plans/`. Each phase has a checklist of flows to verify manually. Examples:
- Auth flows (register, login, logout, redirects, invite-preserved auth)
- Group CRUD (create, view, join, approve, reject)
- Cycle management (start, end, member removal window)
- Contribution marking and rotation display

### 13.4 E2E Tests (Phase 4)
- Playwright for critical user journeys (register → create group → invite → approve → contribute → cycle)
- Runs against Firebase emulator

### 13.5 Test Plan by Phase

| Phase | Tests written |
|---|---|
| 0 | Vitest config + `tests/test-plans/phase-0-setup.md` |
| 1 | Vitest: auth store, group store, invite flow; Manual checklist |
| 2 | Vitest: contribution store, rotation/cycle logic; Manual checklist |
| 3 | Manual checklist: notifications, reports, PDF |
| 4 | Firestore rules tests (emulator), Playwright smoke tests; Final QA pass |

---

*Circlo PRD v1.2 — Built by Noah*
