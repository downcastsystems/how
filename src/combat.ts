export type Vec2 = { x: number; z: number };
export type Input = { x: number; z: number; jump: boolean; slash: boolean; heavy: boolean; dodge: boolean };
export type Attack = { kind: 'slash' | 'heavy'; time: number; duration: number; hit: boolean; aerial: boolean; stage: number };
export type Enemy = Vec2 & { id: number; hp: number; maxHp: number; kind: 'hound' | 'brute'; speed: number; damage: number; angle: number; timer: number; state: 'spawn' | 'chase' | 'windup' | 'recover'; stun: number; flash: number; spawnGate: number };
export type GameEvent = { type: 'spawn' | 'hit' | 'kill' | 'hurt' | 'attack' | 'dodge' | 'jump' | 'land' | 'wave' | 'clear' | 'death'; x: number; z: number; value?: number; heavy?: boolean };
export const ARENA_RADIUS = 18;
export const gates: Vec2[] = [{ x: -12, z: -12 }, { x: 12, z: -12 }, { x: -15, z: 8 }, { x: 15, z: 8 }];
export const length = (v: Vec2) => Math.hypot(v.x, v.z);
export function normalize(v: Vec2): Vec2 { const l = length(v); return l > 0.001 ? { x: v.x / l, z: v.z / l } : { x: 0, z: 0 }; }
export function constrain(v: Vec2, radius = ARENA_RADIUS): void { const l = length(v); if (l > radius) { v.x *= radius / l; v.z *= radius / l; } }
export function waveConfig(wave: number) { return { count: 4 + wave * 2, health: 40 + (wave - 1) * 10, damage: 8 + (wave - 1) * 2, speed: Math.min(4.6, 2.1 + wave * 0.09) }; }
export function safestDirection(player: Vec2, enemies: Vec2[], facing: number): Vec2 {
  let best = { x: Math.sin(facing), z: Math.cos(facing) }, score = -Infinity;
  for (let i = 0; i < 32; i++) {
    const angle = i * Math.PI / 16;
    const dir = { x: Math.sin(angle), z: Math.cos(angle) };
    const end = { x: player.x + dir.x * 5.8, z: player.z + dir.z * 5.8 };
    constrain(end);
    const travel = Math.hypot(end.x - player.x, end.z - player.z);
    const clearance = enemies.length ? Math.min(...enemies.map(e => Math.hypot(end.x - e.x, end.z - e.z))) : ARENA_RADIUS - length(end);
    const s = clearance + travel * 0.2;
    if (s > score) { score = s; best = dir; }
  }
  return best;
}
export function inAttackCone(origin: Vec2, target: Vec2, angle: number, range: number, halfArc: number) {
  const dx = target.x - origin.x, dz = target.z - origin.z;
  const dist = Math.hypot(dx, dz);
  return dist <= range && (dist < 0.7 || (dx * Math.sin(angle) + dz * Math.cos(angle)) / dist >= Math.cos(halfArc));
}

export class Combat {
  player = { x: 0, z: 4, y: 0, vy: 0, angle: Math.PI, hp: 100, invulnerable: 0, dodgeTime: 0, dodgeCooldown: 0, dodgeDir: { x: 0, z: -1 }, attack: null as Attack | null, moving: false };
  enemies: Enemy[] = [];
  events: GameEvent[] = [];
  wave = 0; kills = 0; combo = 0; comboTimer = 0; waveKills = 0; remaining = 0; waveTotal = 0;
  nextWave = 1.2; spawnTimer = 0; elapsed = 0; dead = false;
  private nextId = 0;
  private chain = 0;
  private chainTimer = 0;
  private buffered: 'slash' | 'heavy' | null = null;
  emit(type: GameEvent['type'], x = this.player.x, z = this.player.z, value?: number, heavy?: boolean) { this.events.push({ type, x, z, value, heavy }); }
  update(dt: number, input: Input) {
    if (this.dead) return;
    dt = Math.min(dt, 0.05);
    this.elapsed += dt;
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
    this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0;
    this.chainTimer -= dt; if (this.chainTimer <= 0) this.chain = 0;
    const move = normalize({ x: input.x, z: input.z });
    p.moving = length(move) > 0;
    if (input.dodge && p.dodgeCooldown <= 0 && p.y < 0.1) {
      p.dodgeDir = p.moving ? move : safestDirection(p, this.enemies, p.angle);
      p.angle = Math.atan2(p.dodgeDir.x, p.dodgeDir.z);
      p.dodgeTime = 0.46; p.dodgeCooldown = 0.72; p.invulnerable = 0.5; p.attack = null; this.buffered = null;
      this.emit('dodge');
    }
    if (p.dodgeTime > 0) {
      p.dodgeTime = Math.max(0, p.dodgeTime - dt);
      p.x += p.dodgeDir.x * 13 * dt; p.z += p.dodgeDir.z * 13 * dt;
    } else {
      if (input.jump && p.y === 0 && !p.attack) { p.vy = 10.8; this.emit('jump'); }
      if (p.moving && !p.attack) p.angle = Math.atan2(move.x, move.z);
      const speed = p.attack ? (p.attack.kind === 'heavy' ? 1.1 : 3.2) : 7.2;
      p.x += move.x * speed * dt; p.z += move.z * speed * dt;
      const request = input.heavy ? 'heavy' : input.slash ? 'slash' : null;
      if (request) {
        if (!p.attack) this.startAttack(request, p.moving);
        else if (p.attack.time > p.attack.duration * 0.35) this.buffered = request;
      }
    }
    constrain(p);
    if (p.y > 0 || p.vy > 0) {
      p.vy -= 25 * dt; p.y = Math.max(0, p.y + p.vy * dt);
      if (p.y === 0) { p.vy = 0; this.emit('land'); }
    }
    const a = p.attack;
    if (a) {
      a.time += dt;
      if (!a.hit && a.time >= (a.kind === 'heavy' ? 0.43 : 0.105)) { a.hit = true; this.resolveAttack(a); }
      if (a.time >= a.duration) { p.attack = null; if (this.buffered) { const b = this.buffered; this.buffered = null; this.startAttack(b, p.moving); } }
    }
    this.updateWaves(dt);
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt);
      e.stun = Math.max(0, e.stun - dt);
      if (e.stun > 0) continue;
      e.timer -= dt;
      const dx = p.x - e.x, dz = p.z - e.z, distance = Math.hypot(dx, dz);
      if (e.state === 'spawn') { if (e.timer <= 0) e.state = 'chase'; continue; }
      if (e.state === 'chase') {
        e.angle = Math.atan2(dx, dz);
        if (distance < (e.kind === 'brute' ? 2.4 : 1.9)) { e.state = 'windup'; e.timer = e.kind === 'brute' ? 1.05 : 0.72; }
        else { e.x += dx / distance * e.speed * dt; e.z += dz / distance * e.speed * dt; }
      } else if (e.state === 'windup' && e.timer <= 0) {
        if (inAttackCone(e, p, e.angle, e.kind === 'brute' ? 3.2 : 2.6, 1.0) && p.y < 1.25 && p.invulnerable <= 0) {
          p.hp = Math.max(0, p.hp - e.damage); p.invulnerable = 0.65; this.combo = 0;
          this.emit('hurt', p.x, p.z, e.damage);
          if (!p.hp) { this.dead = true; this.emit('death'); return; }
        }
        e.state = 'recover'; e.timer = 0.8;
      } else if (e.state === 'recover' && e.timer <= 0) e.state = 'chase';
      constrain(e, ARENA_RADIUS - 0.3);
    }
    // Soft separation keeps crowds legible without locking the player in place.
    for (let i = 0; i < this.enemies.length; i++) for (let j = i + 1; j < this.enemies.length; j++) {
      const a = this.enemies[i], b = this.enemies[j], dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz);
      if (d < 1.05 && d > 0.001) { const force = (1.05 - d) * Math.min(dt * 4, 0.5); a.x += dx / d * force; a.z += dz / d * force; b.x -= dx / d * force; b.z -= dz / d * force; }
    }
    for (const e of this.enemies) constrain(e, ARENA_RADIUS - 0.3);
  }
  private startAttack(kind: 'slash' | 'heavy', moving: boolean) {
    const p = this.player;
    if (!moving) {
      const target = this.enemies.filter(e => e.state !== 'spawn').sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
      if (target && Math.hypot(target.x - p.x, target.z - p.z) < 6) p.angle = Math.atan2(target.x - p.x, target.z - p.z);
    }
    this.chain = kind === 'slash' ? this.chain % 3 + 1 : 0; this.chainTimer = 1.25;
    p.attack = { kind, time: 0, duration: kind === 'heavy' ? 0.9 : 0.33, hit: false, aerial: p.y > 0.15 || p.vy > 0, stage: this.chain };
    this.emit('attack', p.x, p.z, this.chain, kind === 'heavy');
  }
  private resolveAttack(a: Attack) {
    const p = this.player, heavy = a.kind === 'heavy';
    const range = heavy ? 4.6 : a.aerial ? 3.8 : 3.3;
    const arc = a.stage === 3 || a.aerial ? Math.PI : heavy ? 1.05 : 1.8;
    let struck = false;
    for (const e of this.enemies) {
      if (e.state === 'spawn' || !inAttackCone(p, e, p.angle, range, arc)) continue;
      const damage = heavy ? 65 : a.stage === 3 ? 32 : 24;
      e.hp -= damage; e.flash = 0.16; e.stun = heavy ? 0.85 : 0.32; e.state = 'chase';
      const away = normalize({ x: e.x - p.x, z: e.z - p.z }); e.x += away.x * (heavy ? 2.4 : 0.45); e.z += away.z * (heavy ? 2.4 : 0.45); constrain(e);
      this.combo++; this.comboTimer = 3; struck = true; this.emit('hit', e.x, e.z, damage, heavy);
      if (e.hp <= 0) { this.kills++; this.waveKills++; if (this.kills % 4 === 0) p.hp = Math.min(100, p.hp + 4); this.emit('kill', e.x, e.z, e.id, heavy); }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    if (heavy && !struck) this.emit('land', p.x + Math.sin(p.angle) * 2.5, p.z + Math.cos(p.angle) * 2.5, 0, true);
  }
  private updateWaves(dt: number) {
    if (this.nextWave > 0) {
      this.nextWave -= dt;
      if (this.nextWave <= 0) { this.wave++; const c = waveConfig(this.wave); this.remaining = c.count; this.waveTotal = c.count; this.waveKills = 0; this.spawnTimer = 0; this.emit('wave', 0, 0, this.wave); }
      return;
    }
    this.spawnTimer -= dt;
    if (this.remaining > 0 && this.spawnTimer <= 0 && this.enemies.length < 32) {
      const id = this.nextId++, gate = id % gates.length, c = waveConfig(this.wave), brute = this.wave >= 3 && id % 4 === 0;
      const pos = gates[gate], hp = c.health * (brute ? 2.1 : 1);
      this.enemies.push({ x: pos.x * 0.91, z: pos.z * 0.91, id, hp, maxHp: hp, kind: brute ? 'brute' : 'hound', speed: c.speed * (brute ? 0.7 : 1), damage: c.damage * (brute ? 1.7 : 1), angle: 0, timer: 0.85, state: 'spawn', stun: 0, flash: 0, spawnGate: gate });
      this.remaining--; this.spawnTimer = Math.max(0.3, 0.85 - this.wave * 0.04); this.emit('spawn', pos.x, pos.z, gate);
    }
    if (!this.remaining && !this.enemies.length) { this.nextWave = 4; this.player.hp = Math.min(100, this.player.hp + 22); this.emit('clear'); }
  }
}

export const idleInput = (): Input => ({ x: 0, z: 0, jump: false, slash: false, heavy: false, dodge: false });
export function gamepadInput(pad: Pick<Gamepad, 'axes' | 'buttons'>): Input {
  const x = pad.axes[0] || 0, z = pad.axes[1] || 0, magnitude = Math.hypot(x, z);
  const press = (i: number) => pad.buttons[i]?.pressed ?? false;
  return { x: magnitude > 0.2 ? x : 0, z: magnitude > 0.2 ? z : 0, jump: press(0), dodge: press(1), slash: press(2), heavy: press(3) };
}
