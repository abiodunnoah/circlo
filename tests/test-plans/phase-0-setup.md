# Phase 0 — Setup Verification Checklist

## Project Structure
- [ ] `src/assets/` exists
- [ ] `src/components/common/` exists
- [ ] `src/components/groups/` exists
- [ ] `src/components/contributions/` exists
- [ ] `src/composables/` exists
- [ ] `src/firebase/` exists with `index.js`
- [ ] All view directories exist under `src/views/`
- [ ] `tests/unit/stores/` and `tests/unit/composables/` exist
- [ ] `tests/test-plans/` exists

## Configuration
- [ ] `index.html` has `<title>Circlo</title>` and `lang="en"`
- [ ] `.env.example` exists with all 6 VITE_FIREBASE_* variables
- [ ] `vitest.config.js` exists and is configured

## Router
- [ ] All 12 routes defined: Landing, Login, Register, Dashboard, GroupList, CreateGroup, GroupDetail, Contributions, Notifications, Reports, Profile, NotFound
- [ ] Navigation guard redirects unauthenticated users to Landing
- [ ] Navigation guard redirects authenticated users on Landing to Dashboard

## Build
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
