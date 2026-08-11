# Phase 2 — Contributions + Rotation Verification Checklist

> Cycle = one payout round. A full rotation = N cycles (one per eligible member). `hasReceived` persists across cycles within a rotation and resets only when the rotation concludes.

## Cycle Start
- [ ] As admin, click "Start New Cycle" on a group at cycle 0 → confirmation modal
- [ ] Confirm → cycle becomes 1, and the first member in rotation order becomes the "next payout recipient"
- [ ] Confirm again → cycle increments to 2, and the next unreceived member becomes the recipient
- [ ] "Start New Cycle" is disabled while the current cycle's recipient has not had their payout confirmed

## Rotation Display
- [ ] Members list shows rotation order (1, 2, 3...) as assigned
- [ ] The current cycle's payout recipient shows the "Next" badge
- [ ] Members who have received in this rotation show "Received" badge (persists across cycles)
- [ ] After every eligible member has received once, a new rotation begins and all "Received" badges reset

## Contributions Tab
- [ ] Contributions tab shows a per-cycle payment table (member, status, amount, date paid)
- [ ] Admin clicks "Mark Paid" on ANY member's row → that member shows "Paid" (N records per cycle)
- [ ] The current cycle's recipient has a "Confirm Payout" button → clicking it marks them "Received" and re-enables "Start New Cycle"
- [ ] Marking a non-recipient as paid does NOT mark them as received
- [ ] While any contributor is unpaid, an amber warning shows: "X contributors haven't paid for this cycle yet" (does not block "Start New Cycle")
- [ ] Admin can "Void" a payment → record is kept but shows "Voided" (never hard-deleted)
- [ ] Non-admin members only see their own row in the table

## My Contributions Page
- [ ] /contributions lists the signed-in user's paid history across all their groups
- [ ] "Total Contributed" equals the sum of their non-voided contributions (matches real data)
- [ ] Clicking a row navigates to the group

## Member Removal Window
- [ ] While a rotation is active (not every eligible member has received), Remove buttons hidden
- [ ] After the rotation concludes (all received, next not started), Remove buttons visible again
- [ ] Removing a member auto-shifts remaining members' rotation orders

## Member Exit Between Rotations
- [ ] After rotation completes, admin removes a member → status "left", leftAt set
- [ ] Removed member's contribution history still preserved in Firestore

## Dashboard
- [ ] Dashboard "Total Contributed" reflects real contribution records
- [ ] Each group card shows the next payout recipient

## Notifications on Events (Phase 4 wiring)
- [ ] Contribution marked as paid → notify the member (deferred)
- [ ] New cycle started → all members notified (deferred)

## Reports
- [ ] Reports page shows group + cycle filters (Phase 4 wiring)
- [ ] PDF export produces a readable document (Phase 4 wiring)
