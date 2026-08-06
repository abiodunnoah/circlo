# Phase 2 — Contributions + Rotation Verification Checklist

## Cycle Start
- [ ] As admin, click "Start New Cycle" on a group at cycle 0 → confirmation modal
- [ ] Confirm → cycle becomes 1, all members' hasReceived reset to false
- [ ] Confirm → "Start New Cycle" again on a fresh group (no members yet) → cycle increments

## Rotation Display
- [ ] Members list shows rotation order (1, 2, 3...) as assigned
- [ ] First unpaid member in order shows "Next" badge
- [ ] Members who have received show "Received" badge

## Marking Received
- [ ] As admin, select a member in "Mark received" dropdown → member shows "Received" badge
- [ ] "Next" badge advances to the next unpaid member
- [ ] After all members received, "Next" badge disappears

## Member Removal Window
- [ ] While a cycle is active (not all received), Remove buttons hidden
- [ ] After all members received (cycle complete, next not started), Remove buttons visible again
- [ ] Removing a member auto-shifts remaining members' rotation orders

## Member Exit Between Cycles
- [ ] After cycle completes, admin removes a member → status "left", leftAt set
- [ ] Removed member's contribution history still preserved in Firestore

## Notifications on Events (Phase 4 wiring)
- [ ] Member marked as received → "your_turn" notification for next member (deferred)
- [ ] New cycle started → all members notified (deferred)

## Reports
- [ ] Reports page shows group + cycle filters (Phase 4 wiring)
- [ ] PDF export produces a readable document (Phase 4 wiring)
