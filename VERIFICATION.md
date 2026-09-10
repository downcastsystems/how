# Verification

Verified September 10, 2026.

## Automated checks

- 16 combat tests pass with Vitest 4.1.11.
- TypeScript strict checking and Vite production build pass.
- Dependency audit reports zero known vulnerabilities.
- The Mac launcher's shell syntax was checked.

Combat coverage includes growing waves, the active-enemy limit, forward hit cones, damage applied once per attack, kill accounting, axe windup, aerial attacks, safe and directed dodges, invulnerability, arena boundaries, wave healing, death/reset, three-hit combos, buffered attacks, and standard Xbox button mapping.

## Browser acceptance review

- Inspected the title screen and live arena visually in the Codex browser. Howard, swords, gates, architecture, floor, shadows, particles, and HUD render.
- Enter starts the run. First-wave gates spawn six enemies.
- Keyboard axe attacks killed enemies and incremented the kill and hit-combo counters.
- Cleared wave one with six kills. Wave two began with eight total enemies.
- Verified jumping, aerial slash, and neutral dodge through the live combat HUD.
- Escape pauses and resumes; restart resets health and the run state.
- Observed the defeat screen with kill count, wave, survival time, and restart button.
- No browser console errors or warnings appeared during the checks.
- Review fixed a stale health display at defeat, kept crowd separation inside arena bounds, and preserved the best score when restarting mid-run.

## Remaining limitations

No physical Xbox controller was available for a hardware playtest. Button mapping and stick dead-zone logic have automated coverage. This is a procedural-art prototype, not a production animation or likeness pass. The Three.js bundle exceeds Vite's default 500 KB advisory threshold before compression; it is about 143 KB gzipped and the build succeeds.
