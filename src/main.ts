import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './style.css';
import { Combat, gamepadInput, idleInput, Input } from './combat';
import { World } from './scene';
import { Sound } from './audio';

const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const sound = new Sound();
let world: World;
try { world = new World(element<HTMLCanvasElement>('game')); }
catch (error) { element('menu').innerHTML = '<h1>Unable to start 3D.</h1><p>This game needs WebGL 2. Try Chrome or Edge with hardware acceleration enabled.</p>'; throw error; }
let game = new Combat(), mode: 'menu' | 'playing' | 'paused' | 'dead' = 'menu';
let best = 0;
try { best = Number(localStorage.getItem('howard-best') || 0) || 0; } catch { /* Storage may be unavailable in private contexts. */ }
const keys = new Set<string>(), presses = new Set<string>();
let previousPad = idleInput(), previousStart = false, previousA = false;
let announcementTime = 0, flashTime = 0, time = 0, last = performance.now(), hudTime = 0;
let connectedPad: Gamepad | undefined;
function saveBest() { if (game.kills > best) { best = game.kills; try { localStorage.setItem('howard-best', String(best)); } catch { /* The run remains playable without storage. */ } } }
function start() {
  saveBest(); sound.unlock(); world.reset(); game = new Combat(); mode = 'playing';
  keys.clear(); presses.clear(); announcementTime = 0; flashTime = 0;
  element('announcement').style.opacity = '0'; element('damage-flash').style.opacity = '0';
  element('menu').hidden = true; element('pause').hidden = true; element('death').hidden = true; element('hud').hidden = false;
  document.body.classList.add('playing'); updateHud();
}
function pause(value: boolean) {
  if (mode !== 'playing' && mode !== 'paused') return;
  mode = value ? 'paused' : 'playing'; element('pause').hidden = !value; keys.clear(); presses.clear();
  if (value) element('resume').focus();
}
function announce(title: string, subtitle: string) { element('announcement').innerHTML = `${title}<small>${subtitle}</small>`; announcementTime = 2.8; element('announcement').style.opacity = '1'; }
element('start').onclick = start; element('restart').onclick = start; element('restart-pause').onclick = start; element('resume').onclick = () => pause(false);
element('sound').onclick = () => { sound.unlock(); element('sound').textContent = sound.toggle() ? 'SOUND ON' : 'SOUND OFF'; };
element('quality').onclick = () => { world.setQuality(!world.highQuality); element('quality').textContent = world.highQuality ? 'QUALITY HIGH' : 'QUALITY LOW'; };
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat) {
    if (e.code === 'Escape' || e.code === 'KeyP') pause(mode !== 'paused');
    else if (e.code === 'Enter' && (mode === 'menu' || mode === 'dead')) { e.preventDefault(); start(); }
    else presses.add(e.code);
  }
  keys.add(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); presses.clear(); if (mode === 'playing') pause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'playing') pause(true); });
function controls(): Input {
  let pads: (Gamepad | null)[] = [];
  try { pads = Array.from(navigator.getGamepads?.() ?? []); } catch { /* Keyboard stays available if gamepad access is disabled. */ }
  const pad = pads.find(p => p?.connected && p.mapping === 'standard') ?? undefined;
  if (connectedPad && !pad && mode === 'playing') pause(true);
  connectedPad = pad;
  element('controller').textContent = pad ? 'GAMEPAD CONNECTED · LEFT STICK TO MOVE' : pads.some(Boolean) ? 'NONSTANDARD GAMEPAD · USE KEYBOARD OR AN XBOX-COMPATIBLE PAD' : 'KEYBOARD READY · CONNECT A GAMEPAD ANY TIME';
  const raw = pad ? gamepadInput(pad) : idleInput();
  const startPressed = pad?.buttons[9]?.pressed ?? false;
  if (startPressed && !previousStart) { if (mode === 'menu' || mode === 'dead') start(); else pause(mode !== 'paused'); }
  if (raw.jump && !previousA && (mode === 'menu' || mode === 'dead')) start();
  previousStart = startPressed; previousA = raw.jump;
  const down = (...codes: string[]) => codes.some(c => keys.has(c));
  const tapped = (...codes: string[]) => codes.some(c => presses.has(c));
  const input: Input = {
    x: (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0) + raw.x,
    z: (down('KeyS', 'ArrowDown') ? 1 : 0) - (down('KeyW', 'ArrowUp') ? 1 : 0) + raw.z,
    jump: tapped('Space') || raw.jump && !previousPad.jump,
    slash: tapped('KeyJ') || raw.slash && !previousPad.slash,
    heavy: tapped('KeyK') || raw.heavy && !previousPad.heavy,
    dodge: tapped('KeyL', 'ShiftLeft', 'ShiftRight') || raw.dodge && !previousPad.dodge,
  };
  previousPad = raw; presses.clear(); return input;
}
function updateHud() {
  element('health-bar').style.width = `${game.player.hp}%`;
  element('health-bar').style.background = game.player.hp < 30 ? 'linear-gradient(90deg,#8c4438,#db9271)' : '';
  element('health-text').textContent = `${Math.ceil(game.player.hp)} / 100`;
  element('wave').textContent = String(Math.max(1, game.wave)).padStart(2, '0');
  element('wave-state').textContent = game.nextWave > 0 ? game.wave ? `Next wave in ${Math.ceil(game.nextWave)}s · +22 health` : 'The gates awaken' : `${game.enemies.length} alive · ${game.remaining} approaching`;
  element('wave-progress').style.width = `${game.waveTotal ? game.waveKills / game.waveTotal * 100 : 0}%`;
  element('kills').textContent = String(game.kills); element('best').textContent = `BEST ${Math.max(best, game.kills)}`;
  element('combo').innerHTML = game.combo >= 2 ? `${game.combo} <small>${game.combo >= 15 ? 'UNSTOPPABLE' : game.combo >= 8 ? 'RELENTLESS' : 'HIT COMBO'}</small>` : '';
  element('stance').textContent = game.player.dodgeTime > 0 ? 'EVADING' : game.player.attack?.kind === 'heavy' ? 'IRON JUDGMENT' : game.player.y > 0 ? 'AIRBORNE' : 'TWIN BLADES';
}
function events() {
  for (const event of game.events) {
    const { x, z, type } = event;
    if (type === 'wave') { announce(`Wave ${String(event.value).padStart(2, '0')}`, event.value === 3 ? 'THE BRUTES HAVE ARRIVED' : 'THE GATES DEMAND MORE'); sound.play('wave'); }
    if (type === 'clear') { announce('A moment of peace.', '+22 HEALTH · THE NEXT WAVE APPROACHES'); sound.play('clear'); saveBest(); }
    if (type === 'hit') { world.burst(x, z, 0xffca82, event.heavy ? 18 : 8, event.heavy); world.shake = event.heavy ? 0.65 : 0.16; sound.play('hit'); }
    if (type === 'kill') { world.burst(x, z, 0xc6ae7e, 18); sound.play('kill'); }
    if (type === 'spawn') world.burst(x * 0.91, z * 0.91, 0xee8051, 12, true);
    if (type === 'attack') sound.play(event.heavy ? 'heavy' : 'slash');
    if (type === 'dodge' || type === 'jump') sound.play(type);
    if (type === 'land') { world.burst(x, z, 0xa6ad92, event.heavy ? 15 : 5, event.heavy); if (event.heavy) world.shake = 0.5; }
    if (type === 'hurt') { flashTime = 0.35; world.shake = 0.4; sound.play('hurt'); }
    if (type === 'death') { saveBest(); updateHud(); mode = 'dead'; element('death').hidden = false; element('death-stats').textContent = `${game.kills} demons slain · Wave ${game.wave} · ${Math.floor(game.elapsed / 60)}m ${Math.floor(game.elapsed % 60)}s survived`; element('restart').focus(); }
  }
  game.events = [];
}
function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  const input = controls();
  if (mode === 'playing') { time += dt; game.update(dt, input); events(); hudTime += dt; if (hudTime > 0.05) { updateHud(); hudTime = 0; } }
  else if (mode === 'menu') time += dt;
  if (mode === 'playing' || mode === 'menu') {
    announcementTime -= dt; if (announcementTime <= 0) element('announcement').style.opacity = '0';
    flashTime = Math.max(0, flashTime - dt); element('damage-flash').style.opacity = String(flashTime * 1.8);
  }
  world.update(game, mode === 'paused' ? 0 : dt, time, mode === 'menu');
}
requestAnimationFrame(frame);
// Read-only development telemetry supports browser acceptance checks.
if (import.meta.env.DEV) Object.defineProperty(window, '__HOWARD__', { get: () => ({ mode, wave: game.wave, kills: game.kills, hp: game.player.hp, player: { x: game.player.x, y: game.player.y, z: game.player.z, dodgeTime: game.player.dodgeTime, attack: game.player.attack?.kind }, enemies: game.enemies.map(e => ({ x: e.x, z: e.z, state: e.state })), drawCalls: world.renderer.info.render.calls, triangles: world.renderer.info.render.triangles }) });
