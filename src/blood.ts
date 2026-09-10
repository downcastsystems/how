import * as THREE from 'three';

const MAX_DROPS = 180, MAX_STAINS = 56;
type Drop = { p: THREE.Vector3; v: THREE.Vector3; life: number; size: number };
type Stain = { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>; life: number };

/** Bounded cosmetic effects. No collision or damage logic lives in this class. */
export class BloodEffects {
  private drops: Drop[] = [];
  private stains: Stain[] = [];
  private mesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private texture: THREE.Texture;
  private plane = new THREE.PlaneGeometry(1, 1);
  constructor(private scene: THREE.Scene, stainTexture = makeSplatterTexture()) {
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshStandardMaterial({ color: 0x820b08, roughness: 0.38 }), MAX_DROPS);
    this.mesh.name = 'blood-droplets';
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(this.mesh);
    this.texture = stainTexture;
  }
  splatter(x: number, z: number, dx: number, dz: number, fatal = false, heavy = false, y = 1.4) {
    const magnitude = Math.hypot(dx, dz) || 1; dx /= magnitude; dz /= magnitude;
    const amount = fatal ? 28 : heavy ? 19 : 11;
    for (let i = 0; i < amount; i++) {
      if (this.drops.length >= MAX_DROPS) this.drops.shift();
      const speed = 2 + Math.random() * (heavy ? 5 : 3);
      this.drops.push({ p: new THREE.Vector3(x, y, z), v: new THREE.Vector3(dx * speed + (Math.random() - 0.5) * 3, 1 + Math.random() * 3.5, dz * speed + (Math.random() - 0.5) * 3), life: 1.2, size: 0.025 + Math.random() * 0.045 });
    }
    this.stain(x + dx * 0.4, z + dz * 0.4, fatal ? 1.8 : heavy ? 1.25 : 0.7);
  }
  private stain(x: number, z: number, size: number) {
    if (Math.hypot(x, z) > 18.8) return;
    if (this.stains.length >= MAX_STAINS) this.removeStain(this.stains.shift()!);
    const material = new THREE.MeshStandardMaterial({ color: 0x620b09, map: this.texture, transparent: true, depthWrite: false, roughness: 0.52, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(this.plane, material); mesh.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2); mesh.position.set(x, 0.032, z); mesh.scale.set(size, size * (0.6 + Math.random() * 0.5), 1); mesh.receiveShadow = true;
    this.scene.add(mesh); this.stains.push({ mesh, life: 24 });
  }
  update(dt: number) {
    for (const drop of this.drops) { drop.life -= dt; drop.v.y -= 16 * dt; drop.p.addScaledVector(drop.v, dt); }
    this.drops = this.drops.filter(drop => drop.life > 0 && drop.p.y > 0.04);
    this.mesh.count = this.drops.length;
    this.drops.forEach((drop, i) => { this.dummy.position.copy(drop.p); this.dummy.scale.set(drop.size, drop.size * 2.5, drop.size); this.dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), drop.v.clone().normalize()); this.dummy.updateMatrix(); this.mesh.setMatrixAt(i, this.dummy.matrix); });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.stains = this.stains.filter(stain => { stain.life -= dt; stain.mesh.material.opacity = Math.min(0.86, Math.max(0, stain.life / 6)); if (stain.life <= 0) { this.removeStain(stain); return false; } return true; });
  }
  private removeStain(stain: Stain) { this.scene.remove(stain.mesh); stain.mesh.material.dispose(); }
  reset() { this.drops = []; this.mesh.count = 0; this.stains.forEach(stain => this.removeStain(stain)); this.stains = []; }
}

function makeSplatterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    let seed = 19; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 55; i++) {
      const a = random() * Math.PI * 2, distance = Math.pow(random(), 1.7) * 48;
      ctx.beginPath(); ctx.ellipse(64 + Math.cos(a) * distance, 64 + Math.sin(a) * distance, 1 + random() * (distance < 20 ? 14 : 4), 1 + random() * 5, a, 0, Math.PI * 2); ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}
