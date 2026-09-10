# Howard of War

An original 3D arena survival prototype inspired by PS2 action games. Play as Howard, a muscular Chinese warrior around 50, with glasses, graying hair, two swords, and an oversized axe.

## Play

Double-click **Play HowardOfWar.command**, then open **http://127.0.0.1:5173**. Leave the Terminal window open while playing. The launcher opens the browser automatically. If macOS prevents opening the command file, use the terminal commands below.

```sh
git clone https://github.com/downcastsystems/how.git
cd how
npm ci
npm run dev
```

Node.js 22.12 or newer is needed for a fresh installation. Chrome or Edge with hardware acceleration is recommended. The game needs WebGL 2. Sound starts after you enter the arena.

| Action | Keyboard | Xbox controller |
| --- | --- | --- |
| Move | WASD or arrows | Left stick |
| Jump | Space | A |
| Quick sword attack | J | X |
| Heavy axe slam | K | Y |
| Dodge roll | Shift or L | B |
| Pause/resume | Escape or P | Menu |
| Start/restart after defeat | Enter | A or Menu |

Tap attacks in succession to chain them. Three successive sword attacks finish with a broad spinning hit. Jump, then press either attack for an aerial strike. The axe has a longer windup, more damage, and knockback. Attack without movement to turn toward a nearby enemy automatically.

Dodge with a direction to roll that way. Dodge with no direction to choose a landing point as far as possible from the nearest monster, inside the arena. Rolls briefly prevent damage. Glowing red rings warn of enemy attacks. Jump above a strike or roll clear before it lands.

## Arena rules

- Four permanent gates summon demons. Gates cannot be destroyed.
- Wave one has six demons. Every new wave adds two enemies and raises their health and damage.
- Brutes arrive from wave three. They have more health and slower, stronger attacks.
- At most 32 demons are active at once; the rest of that wave keep arriving as space opens.
- Clearing a wave restores 22 health and grants a four-second break. Every fourth kill restores four health.
- Kill count, hit combo, health, and wave status appear on the HUD. The best kill count stays in this browser.
- Switching away or disconnecting an active controller pauses the game.
- Sound and graphics-quality buttons remain available at the bottom right.

## Technology and assets

Three.js renders the scene. TypeScript implements combat, waves, input, and animation. Vite provides local development and a static production build. Web Audio synthesizes sound effects. Controllers use the browser's standard Gamepad API layout.

The models, architecture, texture, particles, and animations are original procedural assets. No commercial game assets or external game template were used. Howard is a stylized interpretation of the supplied reference, not a photorealistic likeness. Fonts ship locally, so normal play makes no third-party asset requests.

## Checks and builds

```sh
npm test
npm run build
npm run preview
```

The production build is in `dist/`. Serve that folder with a static web server. Opening `index.html` directly from the filesystem will not work.

Combat tests cover wave escalation, spawning limits, hit cones, single-hit accounting, axe windup, aerial attacks, safe dodge, arena bounds, invulnerability, healing, death/reset, and Xbox mapping. See `VERIFICATION.md` for the browser review.

## Prototype limits

Single-player, one arena, two enemy types, and procedural animation. No progression, save slots, camera rotation, or touch controls. A physical Xbox controller still needs a hardware check; automated tests exercise the standard button mapping. Supported controllers must report a standard mapping in the browser. Low graphics mode disables shadows and reduces render resolution.

Engine references: [Three.js renderer](https://threejs.org/docs/pages/WebGLRenderer.html) and [browser Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API).

## Live website

Play at https://downcastsystems.com/how/ . `npm run build:site` builds the game
with asset URLs rooted at `/how/`. The Downcastsystems.com repository owns the
Cloudflare deployment and copies this output into its `public/how` directory.
From that repository, run `npm run deploy:how` to test, build, sync, and deploy.

Hosting must send `Cache-Control: public, max-age=0, must-revalidate, no-transform`
on `/how/*` to prevent the Cloudflare JavaScript Detections injection that
previously disrupted Xbox Edge controls in One Big Sky. The site also sends
`Permissions-Policy: gamepad=(self)`. Its deploy checks verify both domains,
redirects, exact HTML, script-injection absence, and all game asset contents.
