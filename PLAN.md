# Fix LIVE Rounds Not Showing for Friends

## Problem
When you start a round, friends can't see it under their LIVE header because the round data isn't being saved correctly for the live system to find it.

## Fixes

**1. Save round with correct "active" status**
- When a round is created, mark it as `status: 'active'` so the live system can find it
- Also save extra info: which holes option (9/18), whether sensors are on, and course details

**2. Fix hole score lookup**
- The live system is looking in the wrong place for hole scores — fix it to look in the correct table where scores are actually saved

**3. Mark round as "completed" properly**
- When a round ends, update the status from `active` to `completed` so it disappears from friends' LIVE feeds

**4. Speed up live updates**
- Reduce the refresh interval from 30 seconds to 10 seconds so friends see updates faster
- Also refresh immediately when you open the profile screen

**5. Pass setup data (sensors, hole option) to round creation**
- Save whether sensors are active and which hole option was selected so friends see accurate info on the LIVE card
