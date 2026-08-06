# Phase 1 — Auth + Groups Verification Checklist

## Setup
- [ ] `npm run dev` starts and loads the Landing page
- [ ] Navigate to `/dashboard` while logged out → redirected to Landing
- [ ] Navigate to `/groups` while logged out → redirected to Landing

## Registration
- [ ] Register with name, valid email, password ≥ 6 chars → redirected to Dashboard
- [ ] Register with an existing email → error "An account with this email already exists"
- [ ] Register with weak password → error "Password must be at least 6 characters"
- [ ] After registering, a `users/{uid}` doc exists in Firestore with displayName, email, createdAt

## Login / Logout
- [ ] Login with correct credentials → redirected to Dashboard
- [ ] Login with wrong password → error "Invalid email or password"
- [ ] Clicking Logout in navbar → returns to Landing
- [ ] Refresh the page while logged in → session persists (still on Dashboard)

## Group Creation
- [ ] Navigate to Create Group (Dashboard → Create your first group, or Groups → Create Group)
- [ ] Fill name, amount, frequency, start date → group created → redirected to Group Detail
- [ ] Group detail shows: name, amount, frequency, cycle 0, 1 member (you, admin)
- [ ] You appear in the member list with order 1 and "(admin)" label

## Invite Link Flow (Not Logged In)
- [ ] Admin clicks "Copy Invite Link" → modal shows link with `?invite=<code>`
- [ ] Open link in incognito/private window (logged out)
- [ ] Join page shows "Join <group name>" with account prompts
- [ ] Click "Create an Account" → Register page preserves the invite param in URL
- [ ] Complete registration → redirect back to Join page → "Join Request Sent!"

## Invite Link Flow (Already Logged In)
- [ ] While logged in, paste invite link directly in the browser
- [ ] Join page immediately shows "Join Request Sent!" (no auth screens)
- [ ] Joining the same group again → "You're Already a Member"
- [ ] Admin clicking their own invite link → error "You are already the admin of this group"

## Admin Approval
- [ ] Admin opens Group Detail → Pending tab shows the new member request
- [ ] Click Approve → member disappears from Pending, appears in Members with next rotation order
- [ ] Group totalMembers increments by 1
- [ ] Click Reject on another request → member not added

## Member View
- [ ] Login as the newly approved member
- [ ] Dashboard shows the group in their list
- [ ] Group Detail shows rotation order and "Next" badge if they're first unpaid

## Member Removal (Between Cycles)
- [ ] As admin on a group at cycle 0 (before first cycle starts) → Remove buttons visible
- [ ] Remove a member → confirmation modal → member marked as left, totalMembers decrements
- [ ] Removed member no longer appears in Members list

## Toast Notifications
- [ ] Group created → success toast appears
- [ ] Member approved → success toast
- [ ] Invalid action → error toast
