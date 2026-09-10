import { describe, it, expect } from 'vitest';
import { Combat, idleInput, waveConfig, safestDirection, inAttackCone, gamepadInput, ARENA_RADIUS, type Enemy } from '../src/combat';
const enemy = (x = 0, z = 2, hp = 100): Enemy => ({ id: 99, x, z, hp, maxHp: hp, kind: 'hound', speed: 0, damage: 10, angle: 0, timer: 99, state: 'chase', stun: 0, flash: 0, spawnGate: 0 });
function tick(game: Combat, seconds: number) { for (let i = 0; i < Math.round(seconds * 100); i++) game.update(0.01, idleInput()); }
function sandbox() { const g = new Combat(); g.nextWave = 999; return g; }

describe('Howard combat', () => {
  it('increases wave count, health and damage indefinitely', () => {
    for (let wave = 2; wave <= 100; wave++) { const previous = waveConfig(wave - 1), next = waveConfig(wave); expect(next.count).toBeGreaterThan(previous.count); expect(next.health).toBeGreaterThan(previous.health); expect(next.damage).toBeGreaterThan(previous.damage); }
  });
  it('starts a wave and keeps spawning without exceeding the active crowd limit', () => {
    const g = new Combat(); g.wave = 29; tick(g, 20); expect(g.wave).toBe(30); expect(g.enemies.length).toBeLessThanOrEqual(32); expect(g.remaining).toBeGreaterThan(0);
  });
  it('hits targets in the forward cone and excludes distant/rear targets', () => {
    expect(inAttackCone({ x: 0, z: 0 }, { x: 0, z: -2 }, Math.PI, 3, 1)).toBe(true);
    expect(inAttackCone({ x: 0, z: 0 }, { x: 0, z: 2 }, Math.PI, 3, 1)).toBe(false);
    expect(inAttackCone({ x: 0, z: 0 }, { x: 0, z: -4 }, Math.PI, 3, 1)).toBe(false);
  });
  it('deals damage only once per slash and counts a kill once', () => {
    const g = sandbox(); g.enemies = [enemy(0, 2, 20)]; g.update(0.01, { ...idleInput(), slash: true }); tick(g, 0.5);
    expect(g.kills).toBe(1); expect(g.enemies).toHaveLength(0); expect(g.events.filter(e => e.type === 'kill')).toHaveLength(1);
  });
  it('heavy attack winds up and deals more damage than a sword attack', () => {
    const g = sandbox(); g.enemies = [enemy(0, 1, 200)]; g.update(0.01, { ...idleInput(), heavy: true }); tick(g, 0.3); expect(g.enemies[0].hp).toBe(200); tick(g, 0.15); expect(g.enemies[0].hp).toBe(135);
  });
  it('allows an aerial sword attack and returns to the floor', () => {
    const g = sandbox(); g.enemies = [enemy(0, 2)]; g.update(0.01, { ...idleInput(), jump: true }); tick(g, 0.15); expect(g.player.y).toBeGreaterThan(0);
    g.update(0.01, { ...idleInput(), slash: true }); expect(g.player.attack?.aerial).toBe(true); tick(g, 0.2); expect(g.enemies[0].hp).toBeLessThan(100); tick(g, 1); expect(g.player.y).toBe(0);
  });
  it('neutral roll moves away from clustered monsters and respects arena bounds', () => {
    const p = { x: 0, z: 0 }, dir = safestDirection(p, [{ x: 0, z: -2 }, { x: 1, z: -2 }], Math.PI); expect(dir.z).toBeGreaterThan(0.8);
    const edge = safestDirection({ x: 17.9, z: 0 }, [{ x: 16, z: 0 }], 0); expect(Math.abs(edge.z)).toBeGreaterThan(0.5);
    const g = sandbox(); g.player.x = 17.9; g.update(0.01, { ...idleInput(), x: 1, dodge: true }); tick(g, 1); expect(Math.hypot(g.player.x, g.player.z)).toBeLessThanOrEqual(ARENA_RADIUS + 0.0001);
  });
  it('dodge grants invulnerability, respects cooldown, and cancels an attack', () => {
    const g = sandbox(); const e = enemy(0, 3); e.state = 'windup'; e.timer = 0; e.angle = 0; g.enemies = [e];
    g.update(0.01, { ...idleInput(), heavy: true }); g.update(0.01, { ...idleInput(), dodge: true });
    expect(g.player.attack).toBeNull(); expect(g.player.invulnerable).toBeGreaterThan(0); expect(g.player.hp).toBe(90);
    const cooldown = g.player.dodgeCooldown; g.update(0.01, { ...idleInput(), dodge: true }); expect(g.player.dodgeCooldown).toBeLessThan(cooldown);
  });
  it('enemy windup damage can be avoided by jumping or dodging', () => {
    for (const action of ['air', 'dodge', 'none']) {
      const g = sandbox(); const e = enemy(0, 3); e.state = 'windup'; e.timer = 0; e.angle = 0; g.enemies = [e];
      if (action === 'air') g.player.y = 2;
      g.update(0.01, { ...idleInput(), dodge: action === 'dodge' }); expect(g.player.hp).toBe(action === 'none' ? 90 : 100);
    }
  });
  it('clearing a wave heals and schedules a harder next wave', () => {
    const g = new Combat(); g.nextWave = 0; g.wave = 1; g.remaining = 0; g.player.hp = 50; tick(g, 0.01); expect(g.player.hp).toBe(72); expect(g.nextWave).toBe(4); tick(g, 4.1); expect(g.wave).toBe(2); expect(g.waveTotal).toBe(8);
  });
  it('death stops the simulation and a new run resets state', () => {
    const g = sandbox(); g.player.hp = 1; const e = enemy(0, 3); e.state = 'windup'; e.timer = 0; g.enemies = [e]; g.update(0.01, idleInput()); expect(g.dead).toBe(true); const elapsed = g.elapsed; tick(g, 1); expect(g.elapsed).toBe(elapsed); expect(new Combat().player.hp).toBe(100);
  });
  it('maps Xbox A/B/X/Y and filters stick drift', () => {
    const pad = { axes: [0.1, -0.05], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 0 || i === 2 } as GamepadButton)) };
    expect(gamepadInput(pad)).toEqual({ x: 0, z: 0, jump: true, dodge: false, slash: true, heavy: false });
    pad.axes = [-0.8, 0.4]; pad.buttons[1].pressed = true; pad.buttons[3].pressed = true; expect(gamepadInput(pad)).toMatchObject({ x: -0.8, z: 0.4, dodge: true, heavy: true });
  });
  it('chains three sword attacks into a spinning finisher', () => {
    const g = sandbox();
    for (let stage = 1; stage <= 3; stage++) {
      g.update(0.01, { ...idleInput(), slash: true });
      expect(g.player.attack?.stage).toBe(stage);
      tick(g, 0.34);
    }
  });
  it('one slash does not repeatedly damage a surviving enemy', () => {
    const g = sandbox(); g.enemies = [enemy(0, 2, 200)];
    g.update(0.01, { ...idleInput(), slash: true }); tick(g, 0.5);
    expect(g.enemies[0].hp).toBe(176);
    expect(g.events.filter(e => e.type === 'hit')).toHaveLength(1);
  });
  it('explicit directional dodge overrides the automatic escape choice', () => {
    const g = sandbox(); g.enemies = [enemy(0, 1)];
    g.update(0.01, { ...idleInput(), x: -1, dodge: true });
    expect(g.player.dodgeDir).toEqual({ x: -1, z: 0 });
    tick(g, 0.45); expect(g.player.x).toBeLessThan(-5);
  });
  it('a buffered attack executes once after recovery', () => {
    const g = sandbox(); g.update(0.01, { ...idleInput(), slash: true });
    tick(g, 0.2); g.update(0.01, { ...idleInput(), heavy: true });
    tick(g, 0.15); expect(g.player.attack?.kind).toBe('heavy');
    tick(g, 1.1); expect(g.player.attack).toBeNull();
    expect(g.events.filter(e => e.type === 'attack')).toHaveLength(2);
  });

});
