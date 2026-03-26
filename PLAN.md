# Fix LIVE Rounds Not Showing for Friends

## Problem
When you start a round, friends can't see it under their LIVE header because the round data isn't being saved correctly for the live system to find it.

## Fixes

**1. Save round with correct "active" status** ✅
- Round is created with `is_completed: false`, live system filters by `is_completed = false`
- Removed `sensors_active` column reference that was blocking inserts

**2. Fix hole score lookup** ✅
- Live system correctly queries `hole_scores` table by `round_id`

**3. Mark round as "completed" properly** ✅
- `completeRound()` sets `is_completed: true` so it disappears from LIVE feeds

**4. Speed up live updates** ✅
- Polling interval is 10 seconds
- Refreshes immediately on profile screen mount

**5. Pass setup data (sensors, hole option) to round creation** ✅
- `hole_option` is passed and saved to the round
