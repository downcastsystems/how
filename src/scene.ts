import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Combat, Enemy, gates } from './combat';
import { surfaceMaterial } from './materials';
import { torsoGeometry } from './anatomy';
import { BloodEffects } from './blood';

const gold = 0xb28b50, stone = 0x536362, dark = 0x202e32;
const mat = (color: number, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const metal = mat(0xb7c5c6, 0.27, 0.8), bronze = mat(gold, 0.4, 0.68), obsidian = mat(dark, 0.74, 0.2);
const skin = surfaceMaterial('skin', 0xe7d2bb), skinLight = surfaceMaterial('skin', 0xf1ddc8), cloth = surfaceMaterial('leather', 0x756c65), red = surfaceMaterial('leather', 0xc2a095), hair = mat(0x252c2b), gray = mat(0x8e9690);
const characterIron = surfaceMaterial('iron', 0xa8afb2);
const sphere = new THREE.SphereGeometry(1, 24, 18), box = new THREE.BoxGeometry(1, 1, 1);
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, pos = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geometry, material); m.position.set(...pos as [number, number, number]); m.scale.set(...scale as [number, number, number]); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function ell(parent: THREE.Object3D, material: THREE.Material, pos: number[], scale: number[]) { return mesh(parent, sphere, material, pos, scale); }
function cube(parent: THREE.Object3D, material: THREE.Material, pos: number[], scale: number[]) { return mesh(parent, box, material, pos, scale); }
function cyl(parent: THREE.Object3D, material: THREE.Material, pos: number[], rt: number, rb: number, h: number, sides = 12) { return mesh(parent, new THREE.CylinderGeometry(rt, rb, h, sides), material, pos); }
function torus(parent: THREE.Object3D, material: THREE.Material, radius: number, tube: number, pos: number[], arc = Math.PI * 2) { return mesh(parent, new THREE.TorusGeometry(radius, tube, 6, 64, arc), material, pos); }
function pivot(parent: THREE.Object3D, x: number, y: number, z: number) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function seeded(seed = 4) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

export type Actor = { root: THREE.Group; body: THREE.Group; leftArm: THREE.Group; rightArm: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group; swords: THREE.Group[]; axe: THREE.Group; materials: THREE.MeshStandardMaterial[]; warning?: THREE.Mesh; health?: THREE.Mesh };
function sword(parent: THREE.Object3D) {
  const g = pivot(parent, 0, -0.85, 0);
  cyl(g, cloth, [0, 0, 0.09], 0.065, 0.065, 0.35);
  cube(g, bronze, [0, -0.14, 0.15], [0.44, 0.1, 0.2]);
  const blade = new THREE.Shape(); blade.moveTo(-0.10, 0); blade.lineTo(-0.12, -0.92); blade.lineTo(0, -1.48); blade.lineTo(0.16, -1.08); blade.lineTo(0.14, 0); blade.closePath();
  mesh(g, new THREE.ExtrudeGeometry(blade, { depth: 0.065, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1, steps: 1 }), metal, [0, -0.2, 0.11]);
  cube(g, bronze, [0, -0.58, 0.185], [0.024, 0.7, 0.025]); return g;
}
export function makeHoward(): Actor {
  const root = new THREE.Group(), body = pivot(root, 0, 1.54, 0);
  mesh(body, torsoGeometry(), skin);
  cyl(body, skin, [0, 1.19, 0], 0.19, 0.28, 0.32);
  const head = pivot(body, 0, 1.54, 0.015);
  ell(head, skinLight, [0, 0, 0], [0.295, 0.40, 0.275]);
  ell(head, skin, [0, -0.2, 0.07], [0.235, 0.19, 0.21]);
  ell(head, skinLight, [0, 0.0, 0.29], [0.072, 0.1, 0.09]);
  for (const s of [-1, 1]) {
    ell(head, skin, [s * 0.31, -0.015, 0], [0.062, 0.115, 0.08]);
    ell(head, gray, [s * 0.275, 0.115, -0.005], [0.028, 0.21, 0.20]);
    cube(head, hair, [s * 0.14, 0.1, 0.285], [0.19, 0.032, 0.035]);
    const rim = new THREE.Shape(); rim.moveTo(-0.105, -0.062); rim.lineTo(0.105, -0.062); rim.lineTo(0.105, 0.066); rim.lineTo(-0.105, 0.066); rim.closePath();
    const hole = new THREE.Path(); hole.moveTo(-0.085, -0.043); hole.lineTo(-0.085, 0.047); hole.lineTo(0.085, 0.047); hole.lineTo(0.085, -0.043); hole.closePath(); rim.holes.push(hole);
    mesh(head, new THREE.ShapeGeometry(rim), hair, [s * 0.14, 0.025, 0.297]);
    ell(head, hair, [s * 0.14, 0.018, 0.296], [0.028, 0.02, 0.008]);
    cube(head, hair, [s * 0.26, 0.055, 0.15], [0.018, 0.018, 0.3]);
    cube(head, skin, [s * 0.17, -0.09, 0.269], [0.11, 0.012, 0.017]);
  }
  cube(head, hair, [0, 0.037, 0.309], [0.072, 0.02, 0.02]);
  cube(head, hair, [0, -0.197, 0.289], [0.13, 0.012, 0.012]);
  ell(head, gray, [0, -0.285, 0.232], [0.11, 0.049, 0.021]);
  ell(head, hair, [0, 0.25, -0.04], [0.32, 0.2, 0.29]);
  for (let i = 0; i < 6; i++) { const lock = ell(head, i === 0 ? gray : hair, [-0.2 + i * 0.078, 0.34, -0.01], [0.075, 0.05, 0.25]); lock.rotation.z = -0.22; }
  // A crossed leather harness and bronze fastening.
  const strap = cube(body, red, [0, 0.55, 0.334], [0.14, 1.12, 0.058]); strap.rotation.z = -0.65;
  ell(body, bronze, [0.04, 0.61, 0.386], [0.1, 0.1, 0.025]);
  cyl(body, cloth, [0, -0.08, 0], 0.43, 0.47, 0.49);
  cyl(body, red, [0, 0.08, 0], 0.47, 0.47, 0.17);
  cube(body, bronze, [0, 0.08, 0.46], [0.25, 0.16, 0.04]);
  const skirt = cube(body, red, [0, -0.38, 0.4], [0.44, 0.55, 0.065]); skirt.rotation.x = -0.08;
  cube(body, bronze, [0, -0.65, 0.43], [0.4, 0.045, 0.07]);
  const limbs: THREE.Group[] = [], swords: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const leg = pivot(root, s * 0.29, 1.28, 0); limbs.push(leg);
    ell(leg, cloth, [0, -0.24, 0], [0.25, 0.4, 0.24]);
    ell(leg, skin, [0, -0.66, 0], [0.185, 0.38, 0.18]);
    cyl(leg, characterIron, [0, -0.86, 0], 0.19, 0.16, 0.42);
    cyl(leg, bronze, [0, -0.65, 0], 0.198, 0.198, 0.055);
    ell(leg, obsidian, [0, -1.13, 0.11], [0.205, 0.14, 0.33]);
    const arm = pivot(body, s * 0.7, 0.84, 0); limbs.push(arm);
    ell(arm, skinLight, [0, -0.06, 0], [0.235, 0.29, 0.24]);
    ell(arm, skin, [s * 0.05, -0.34, 0], [0.205, 0.35, 0.195]);
    ell(arm, skinLight, [s * 0.05, -0.28, 0.09], [0.175, 0.26, 0.105]);
    ell(arm, skin, [0, -0.65, 0.03], [0.17, 0.3, 0.17]);
    cyl(arm, characterIron, [0, -0.68, 0.03], 0.18, 0.145, 0.27);
    cyl(arm, bronze, [0, -0.56, 0.03], 0.185, 0.185, 0.045);
    ell(arm, skinLight, [0, -0.91, 0.04], [0.145, 0.18, 0.13]);
    swords.push(sword(arm)); arm.rotation.z = s * 0.12;
  }
  const axe = pivot(limbs[3], 0, -0.85, 0);
  cyl(axe, cloth, [0, -0.28, 0.13], 0.055, 0.065, 2.4);
  cyl(axe, bronze, [0, -1.15, 0.13], 0.08, 0.08, 0.5);
  const blade = new THREE.Shape(); blade.moveTo(0, -0.9); blade.lineTo(0.62, -0.75); blade.lineTo(0.95, -1.15); blade.lineTo(0.84, -1.7); blade.lineTo(0.3, -1.58); blade.lineTo(0, -1.38); blade.closePath();
  mesh(axe, new THREE.ExtrudeGeometry(blade, { depth: 0.14, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.025, bevelSegments: 1, steps: 1 }), metal, [0, 0, 0.06]);
  const backBlade = mesh(axe, new THREE.ExtrudeGeometry(blade, { depth: 0.14, bevelEnabled: false }), bronze, [0, 0, 0.06]); backBlade.scale.x = -0.72;
  axe.visible = false;
  return { root, body, leftLeg: limbs[0], leftArm: limbs[1], rightLeg: limbs[2], rightArm: limbs[3], swords, axe, materials: [] };
}
function makeEnemy(kind: Enemy['kind']): Actor {
  const root = new THREE.Group(), body = pivot(root, 0, 1.06, 0), brute = kind === 'brute';
  const flesh = surfaceMaterial('hide', brute ? 0xc2aaa0 : 0xb3c7b8), armor = surfaceMaterial('iron', 0x949e98), bone = mat(0xaaa18a);
  const glow = new THREE.MeshBasicMaterial({ color: 0xffab63 });
  mesh(body, torsoGeometry(true), flesh, [0, 0, 0], [0.84, 0.93, 0.92]);
  ell(body, armor, [0, 0.68, -0.15], [0.47, 0.29, 0.24]);
  ell(body, flesh, [0, 1.03, 0.14], [0.25, 0.3, 0.24]);
  ell(body, flesh, [0, 0.91, 0.25], [0.20, 0.16, 0.15]);
  ell(body, obsidian, [0, 0.93, 0.365], [0.13, 0.057, 0.018]);
  for (let tooth = 0; tooth < 6; tooth++) {
    const fang = mesh(body, new THREE.ConeGeometry(0.022, 0.075, 5), bone, [(tooth - 2.5) * 0.038, 0.948, 0.388]); fang.rotation.x = Math.PI;
  }
  for (const side of [-1, 1]) {
    const brow = ell(body, flesh, [side * 0.125, 1.13, 0.29], [0.135, 0.075, 0.1]); brow.rotation.z = side * 0.23;
    ell(body, flesh, [side * 0.19, 1.0, 0.26], [0.095, 0.13, 0.08]);
  }
  for (const s of [-1, 1]) {
    ell(body, glow, [s * 0.115, 1.06, 0.347], [0.065, 0.035, 0.025]);
    const horn = mesh(body, new THREE.ConeGeometry(0.095, 0.55, 7), bone, [s * 0.25, 1.44, 0.1]); horn.rotation.z = -s * 0.45;
    const spike = mesh(body, new THREE.ConeGeometry(0.12, 0.4, 5), bone, [s * 0.54, 0.96, 0]); spike.rotation.z = -s * 0.6;
  }
  cube(body, armor, [0, -0.04, 0], [0.64, 0.27, 0.4]);
  const limbs: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const leg = pivot(root, s * 0.26, 0.94, 0); limbs.push(leg);
    ell(leg, flesh, [0, -0.37, 0], [0.17, 0.43, 0.17]);
    ell(leg, armor, [0, -0.68, 0.045], [0.18, 0.24, 0.19]);
    ell(leg, armor, [0, -0.86, 0.15], [0.19, 0.12, 0.3]);
    const arm = pivot(body, s * 0.52, 0.7, 0); limbs.push(arm);
    ell(arm, flesh, [0, -0.38, 0], [0.16, 0.46, 0.16]);
    ell(arm, armor, [0, -0.72, 0.08], [0.17, 0.2, 0.17]);
    for (let f = 0; f < 3; f++) mesh(arm, new THREE.ConeGeometry(0.035, 0.48, 5), bone, [(f - 1) * 0.08, -0.96, 0.14]).rotation.x = Math.PI;
  }
  if (brute) { root.scale.setScalar(1.45); cyl(limbs[3], bronze, [0, -0.7, 0.35], 0.07, 0.07, 1.7); cube(limbs[3], armor, [0, -1.3, 0.35], [0.6, 0.48, 0.5]); }
  const warning = mesh(root, new THREE.RingGeometry(0.9, 1.0, 48), new THREE.MeshBasicMaterial({ color: 0xff6542, transparent: true, opacity: 0.8, side: THREE.DoubleSide }), [0, 0.025, 0]); warning.rotation.x = -Math.PI / 2; warning.visible = false;
  const health = cube(root, new THREE.MeshBasicMaterial({ color: 0xd39a71 }), [0, 2.6, 0], [0.9, 0.045, 0.04]); health.visible = false;
  return { root, body, leftLeg: limbs[0], leftArm: limbs[1], rightLeg: limbs[2], rightArm: limbs[3], swords: [], axe: new THREE.Group(), materials: [flesh, armor], warning, health };
}

type Effect = { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; max: number; ring?: boolean };
export class World {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 220);
  renderer: THREE.WebGLRenderer;
  howard = makeHoward();
  actors = new Map<number, Actor>();
  effects: Effect[] = [];
  portals: THREE.Group[] = [];
  fire: THREE.Mesh[] = [];
  slash: THREE.Mesh;
  dust: THREE.Points;
  blood: BloodEffects;
  shake = 0;
  highQuality = true;
  private random = seeded(7);
  private cameraLook = new THREE.Vector3();
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.1;
    this.scene.background = new THREE.Color(0x657d7c); this.scene.fog = new THREE.FogExp2(0x617c7a, 0.019);
    this.scene.add(new THREE.HemisphereLight(0xc0d9da, 0x24302d, 2));
    const sun = new THREE.DirectionalLight(0xffdcaa, 3.8); sun.position.set(-18, 30, -20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -26; sun.shadow.camera.right = 26; sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26; sun.shadow.normalBias = 0.045; this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xa0d3d8, 2.0); rim.position.set(8, 12, 15); this.scene.add(rim);
    this.buildArena(); this.scene.add(this.howard.root);
    this.blood = new BloodEffects(this.scene);
    this.slash = mesh(this.scene, new THREE.RingGeometry(1.7, 2.9, 56, 1, 0, Math.PI * 1.45), new THREE.MeshBasicMaterial({ color: 0xffd99a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    const pts = new Float32Array(360 * 3);
    for (let i = 0; i < 360; i++) { pts[i * 3] = (this.random() - 0.5) * 65; pts[i * 3 + 1] = this.random() * 18; pts[i * 3 + 2] = (this.random() - 0.5) * 65; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    this.dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd4c89a, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false })); this.scene.add(this.dust);
    this.camera.position.set(7.8, 4.7, 13); this.cameraLook.set(-1.2, 1.7, 3.5);
    addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); });
  }
  private tileTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#434f4f'; ctx.fillRect(0, 0, 1024, 1024);
    const rng = seeded(30);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const v = 62 + Math.floor(rng() * 24); ctx.fillStyle = `rgb(${v},${v + 10},${v + 9})`; ctx.fillRect(x * 128 + 3, y * 128 + 3, 122, 122);
      ctx.strokeStyle = '#a4ada320'; ctx.lineWidth = 2; ctx.strokeRect(x * 128 + 5, y * 128 + 5, 118, 118);
      ctx.strokeStyle = '#242f3144'; ctx.beginPath(); ctx.moveTo(x * 128 + rng() * 100, y * 128); ctx.lineTo(x * 128 + rng() * 100, y * 128 + 45); ctx.lineTo(x * 128 + rng() * 100, y * 128 + 80); ctx.stroke();
    }
    for (let i = 0; i < 40000; i++) { const v = rng() > 0.5 ? 180 : 15; ctx.fillStyle = `rgba(${v},${v},${v},0.07)`; ctx.fillRect(rng() * 1024, rng() * 1024, 1 + rng() * 3, 1 + rng() * 3); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); return t;
  }
  private buildArena() {
    const staticRoot = new THREE.Group(); this.scene.add(staticRoot);
    const rock = mat(stone), trim = mat(0x7c8477), roof = mat(0x263c3c), tile = this.tileTexture();
    const floor = new THREE.MeshStandardMaterial({ map: tile, roughness: 0.94, bumpMap: tile, bumpScale: 0.06 });
    mesh(staticRoot, new THREE.CircleGeometry(20, 96).rotateX(-Math.PI / 2), floor);
    cyl(staticRoot, rock, [0, -0.6, 0], 20, 20.5, 1.2, 96);
    cyl(staticRoot, obsidian, [0, -1.6, 0], 20.5, 22, 1.1, 96);
    for (const r of [5.1, 5.4, 10.5, 17.9, 19.5]) { const ring = torus(staticRoot, bronze, r, r === 5.4 ? 0.025 : 0.055, [0, 0.018, 0]); ring.rotation.x = Math.PI / 2; }
    const emblem = new THREE.Group(); staticRoot.add(emblem);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, deco = cube(emblem, bronze, [Math.sin(a) * 4.25, 0.022, Math.cos(a) * 4.25], [0.07, 0.025, 0.65]); deco.rotation.y = a;
      const fret = cube(emblem, bronze, [Math.sin(a) * 5.75, 0.023, Math.cos(a) * 5.75], [0.4, 0.025, 0.04]); fret.rotation.y = a;
    }
    const inner = torus(staticRoot, bronze, 2.2, 0.033, [0, 0.025, 0]); inner.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, spoke = cube(staticRoot, bronze, [Math.sin(a) * 1.2, 0.025, Math.cos(a) * 1.2], [0.06, 0.026, 2.1]); spoke.rotation.y = a; }
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2;
      const wall = pivot(staticRoot, Math.sin(a) * 19.5, 0, Math.cos(a) * 19.5); wall.rotation.y = a;
      cube(wall, rock, [0, 0.5, 0], [2.35, 1, 0.7]); cube(wall, trim, [0, 1.03, 0], [2.45, 0.18, 0.95]);
      if (i % 3 === 0) { cube(wall, rock, [0, 1, 0], [0.65, 2, 0.75]); cube(wall, bronze, [0, 1.93, 0], [0.8, 0.12, 0.9]); }
    }
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i], portal = pivot(this.scene, g.x, 0, g.z); portal.rotation.y = Math.atan2(-g.x, -g.z);
      const frame = pivot(staticRoot, g.x, 0, g.z); frame.rotation.y = portal.rotation.y;
      cube(frame, obsidian, [0, 0.13, 0], [4.6, 0.26, 2]);
      for (const s of [-1, 1]) {
        cube(frame, rock, [s * 1.6, 2.3, 0], [0.65, 4.6, 0.7]); cube(frame, bronze, [s * 1.6, 0.5, 0], [0.8, 0.18, 0.85]);
        cube(frame, bronze, [s * 1.6, 3.9, 0], [0.8, 0.15, 0.9]); cube(frame, bronze, [s * 1.6, 2.2, 0.36], [0.12, 1.8, 0.035]);
      }
      cube(frame, rock, [0, 4.4, 0], [4.6, 0.46, 1]); cube(frame, bronze, [0, 4.15, 0.54], [2, 0.13, 0.08]);
      const cap = mesh(frame, new THREE.CylinderGeometry(0, 3, 0.9, 4), roof, [0, 4.97, 0], [1, 1, 0.45]); cap.rotation.y = Math.PI / 4;
      const portalMat = new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false, uniforms: { time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: `varying vec2 vUv; uniform float time; void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float sw=sin(r*23.-time*2.8+atan(p.y,p.x)*4.);float edge=pow(clamp(r,0.,1.),4.);float a=smoothstep(1.,.88,r)*(.38+edge*.6);vec3 col=mix(vec3(.14,.025,.02),vec3(1.,.38,.12),edge*.75+sw*.12);gl_FragColor=vec4(col,a);}` });
      mesh(portal, new THREE.PlaneGeometry(2.6, 3.7), portalMat, [0, 2.1, 0.02]);
      const light = new THREE.PointLight(0xff652a, 10, 7, 2); light.position.set(0, 2, 1); portal.add(light); this.portals.push(portal);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) / 8 * Math.PI * 2, x = Math.sin(a) * 17.4, z = Math.cos(a) * 17.4;
      cyl(staticRoot, obsidian, [x, 0.7, z], 0.28, 0.52, 1.4); cyl(staticRoot, bronze, [x, 1.5, z], 0.58, 0.26, 0.4);
      const flame = mesh(this.scene, new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffbe67 }), [x, 1.95, z], [0.7, 1.8, 0.7]); this.fire.push(flame);
      const glow = new THREE.PointLight(0xffa64a, 6, 6, 2); glow.position.set(x, 2.3, z); this.scene.add(glow);
    }
    // Temple beyond the north wall, framed by layered mountain silhouettes.
    for (const s of [-1, 1]) for (let j = 0; j < 4; j++) {
      const col = pivot(staticRoot, s * (9 + j * 4), 0, -27 - j);
      cyl(col, rock, [0, 4, 0], 0.6, 0.8, 8); cube(col, trim, [0, 0.2, 0], [2, 0.4, 2]); cube(col, bronze, [0, 7.2, 0], [1.4, 0.16, 1.4]);
      cube(col, roof, [0, 8.3, 0], [4.6, 0.65, 2.3]);
    }
    for (let level = 0; level < 3; level++) {
      const y = level * 4 + 1, w = 9 - level * 1.8;
      cube(staticRoot, obsidian, [0, y + 1.5, -30], [w * 1.5, 3.5, 7]);
      for (const s of [-1, 1]) cube(staticRoot, red, [s * (w * 0.6), y + 1.5, -25.9], [0.55, 4.2, 0.55]);
      const top = mesh(staticRoot, new THREE.CylinderGeometry(0.2, w, 2.2, 4), roof, [0, y + 4, -30], [1, 1, 0.7]); top.rotation.y = Math.PI / 4;
      cube(staticRoot, bronze, [0, y + 3, -25], [w * 1.9, 0.09, 0.15]);
      for (const s of [-1, 1]) { const tip = cube(staticRoot, roof, [s * w * 0.95, y + 3.1, -29], [1.7, 0.35, 6]); tip.rotation.z = s * 0.26; }
    }
    const mountainMat = mat(0x405c5e);
    for (let i = 0; i < 38; i++) {
      const a = i / 38 * Math.PI * 2, radius = 65 + this.random() * 35, h = 16 + this.random() * 40;
      const geometry = new THREE.ConeGeometry(9 + this.random() * 15, h, 5, 3); const coords = geometry.attributes.position;
      for (let j = 0; j < coords.count; j++) coords.setX(j, coords.getX(j) + Math.sin(coords.getY(j) * 0.4 + i) * 2); geometry.computeVertexNormals();
      mesh(staticRoot, geometry, mountainMat, [Math.sin(a) * radius, h / 2 - 12, Math.cos(a) * radius]);
    }
    // Batch the stationary architecture by material to keep draw calls low.
    staticRoot.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    staticRoot.traverse(o => { if (o instanceof THREE.Mesh && !Array.isArray(o.material)) { const g = o.geometry.clone().applyMatrix4(o.matrixWorld); if (g.index) { const unindexed = g.toNonIndexed(); g.dispose(); const arr = batches.get(o.material) ?? []; arr.push(unindexed); batches.set(o.material, arr); } else { const arr = batches.get(o.material) ?? []; arr.push(g); batches.set(o.material, arr); } } });
    this.scene.remove(staticRoot);
    for (const [material, geos] of batches) { const merged = mergeGeometries(geos); if (merged) { const m = mesh(this.scene, merged, material); m.castShadow = material !== floor; } for (const g of geos) g.dispose(); }
  }
  setQuality(high: boolean) { this.highQuality = high; this.renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 1.7 : 1)); this.renderer.shadowMap.enabled = high; this.scene.traverse(o => { if (o instanceof THREE.Mesh) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => { m.needsUpdate = true; }); } }); }
  burst(x: number, z: number, color: number, count = 12, heavy = false) {
    for (let i = 0; i < count && this.effects.length < 200; i++) {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
      const particle = mesh(this.scene, box, material, [x, 0.8, z], [0.06, 0.06, 0.22]);
      const v = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 1, (Math.random() - 0.5) * 8);
      const life = 0.3 + Math.random() * 0.4; this.effects.push({ mesh: particle, velocity: v, life, max: life });
    }
    if (heavy) {
      const ring = mesh(this.scene, new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), [x, 0.08, z]); ring.rotation.x = -Math.PI / 2;
      this.effects.push({ mesh: ring, velocity: new THREE.Vector3(), life: 0.45, max: 0.45, ring: true });
    }
  }
  reset() { this.blood.reset(); for (const actor of this.actors.values()) this.removeActor(actor); this.actors.clear(); for (const e of this.effects) this.removeEffect(e); this.effects = []; }
  private removeActor(a: Actor) { this.scene.remove(a.root); const gs = new Set<THREE.BufferGeometry>(), ms = new Set<THREE.Material>(); a.root.traverse(o => { if (o instanceof THREE.Mesh) { if (o.geometry !== sphere && o.geometry !== box) gs.add(o.geometry); if (Array.isArray(o.material)) o.material.forEach(m => ms.add(m)); else ms.add(o.material); } }); gs.forEach(g => g.dispose()); ms.forEach(m => { if (![metal, bronze, obsidian, skin, skinLight, cloth, red, hair, gray, characterIron].includes(m as THREE.MeshStandardMaterial)) m.dispose(); }); }
  private removeEffect(e: Effect) { this.scene.remove(e.mesh); if (e.mesh.geometry !== box) e.mesh.geometry.dispose(); (e.mesh.material as THREE.Material).dispose(); }
  update(game: Combat, dt: number, time: number, menu: boolean) {
    const p = game.player, hero = this.howard;
    hero.root.position.set(p.x, p.y, p.z); hero.root.rotation.y = menu ? 0.34 : p.angle;
    const run = p.moving && !menu && !p.attack ? Math.sin(time * 12) : Math.sin(time * 1.8) * 0.035;
    hero.leftLeg.rotation.x = run * 0.68; hero.rightLeg.rotation.x = -run * 0.68;
    hero.body.position.y = 1.54 + (p.moving && !menu ? Math.abs(run) * 0.08 : Math.sin(time * 2) * 0.018);
    hero.body.rotation.set(-Math.sin(p.hurtTime / 0.35 * Math.PI) * 0.22, 0, 0); hero.root.rotation.x = 0;
    hero.leftArm.rotation.set(-run * 0.25 - 0.05, 0, -0.14); hero.rightArm.rotation.set(run * 0.25 - 0.05, 0, 0.14);
    hero.axe.visible = p.attack?.kind === 'heavy'; hero.swords.forEach(s => { s.visible = !hero.axe.visible; });
    if (p.y > 0.1) { hero.leftLeg.rotation.x = -0.7; hero.rightLeg.rotation.x = 0.65; hero.leftArm.rotation.x = -0.5; hero.rightArm.rotation.x = -0.5; }
    if (p.dodgeTime > 0) {
      const t = 1 - p.dodgeTime / 0.46;
      hero.body.rotation.x = -t * Math.PI * 2; hero.body.position.y = 1.05;
      hero.leftLeg.rotation.x = -0.9; hero.rightLeg.rotation.x = -0.9; hero.leftArm.rotation.x = -1.7; hero.rightArm.rotation.x = -1.7;
      hero.root.position.y = Math.sin(t * Math.PI) * 0.35;
    }
    const a = p.attack;
    (this.slash.material as THREE.MeshBasicMaterial).opacity = 0;
    if (a) {
      const t = a.time / a.duration;
      if (a.kind === 'slash') {
        const swing = Math.sin(t * Math.PI), sign = a.stage === 2 ? -1 : 1;
        hero.body.rotation.y = (t - 0.5) * 2.4 * sign;
        hero.leftArm.rotation.set(-1.0, swing * 1.4 * sign, -0.5 - swing * 0.65);
        hero.rightArm.rotation.set(-0.8, -swing * 1.5 * sign, 0.5 + swing * 0.65);
        this.slash.position.set(p.x, p.y + 1.4, p.z); this.slash.rotation.set(-Math.PI / 2 + 0.12, 0, -p.angle + t * 4 * sign);
        this.slash.scale.setScalar(a.stage === 3 ? 1.2 : 1); (this.slash.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.75;
      } else {
        const lift = t < 0.45 ? t / 0.45 : Math.max(0, 1 - (t - 0.45) / 0.18);
        hero.rightArm.rotation.x = -lift * 3.0 - 0.5; hero.leftArm.rotation.x = -lift * 2.9 - 0.4;
        hero.rightArm.rotation.z = -0.24; hero.leftArm.rotation.z = -0.35; hero.body.rotation.x = t > 0.48 ? 0.4 * Math.sin(t * Math.PI) : -0.15;
      }
    }
    const alive = new Set(game.enemies.map(e => e.id));
    for (const [id, actor] of this.actors) if (!alive.has(id)) { this.removeActor(actor); this.actors.delete(id); }
    for (const e of game.enemies) {
      let actor = this.actors.get(e.id);
      if (!actor) { actor = makeEnemy(e.kind); this.actors.set(e.id, actor); this.scene.add(actor.root); }
      const scale = e.kind === 'brute' ? 1.45 : 1, emerge = e.state === 'spawn' ? Math.max(0.05, 1 - e.timer / 0.85) : 1;
      actor.root.scale.set(scale, scale * emerge, scale); actor.root.position.set(e.x, 0, e.z); actor.root.rotation.y = e.angle;
      const stride = e.state === 'chase' && e.stun <= 0 ? Math.sin(time * 9 + e.id) : 0;
      actor.leftLeg.rotation.x = stride * 0.6; actor.rightLeg.rotation.x = -stride * 0.6;
      actor.body.rotation.x = 0.17 - Math.sin(Math.min(1, (e.recoil ?? 0) / 0.4) * Math.PI) * 0.55; actor.body.position.y = 1.06 + Math.abs(stride) * 0.055;
      actor.leftArm.rotation.x = -stride * 0.5; actor.rightArm.rotation.x = stride * 0.5;
      if (e.state === 'windup') { actor.leftArm.rotation.x = -2.1; actor.rightArm.rotation.x = -2.1; actor.body.rotation.x = -0.2; }
      if (e.state === 'recover') { actor.leftArm.rotation.x = -0.85; actor.rightArm.rotation.x = -0.85; actor.body.rotation.x = 0.45; }
      actor.warning!.visible = e.state === 'windup'; actor.warning!.scale.setScalar(1.25 + Math.sin(time * 20) * 0.12);
      actor.health!.visible = e.hp < e.maxHp; actor.health!.scale.x = Math.max(0.01, e.hp / e.maxHp) * 0.9;
      for (const m of actor.materials) { m.emissive.setHex(e.flash > 0 ? 0xffa36b : e.state === 'windup' ? 0x8e2413 : 0); m.emissiveIntensity = e.flash > 0 ? 1 : 0.3; }
    }
    for (const portal of this.portals) portal.traverse(o => { if (o instanceof THREE.Mesh && o.material instanceof THREE.ShaderMaterial) o.material.uniforms.time.value = time; });
    this.fire.forEach((f, i) => { f.scale.y = 1.8 + Math.sin(time * 12 + i * 2) * 0.3; f.scale.x = 0.65 + Math.sin(time * 9 + i) * 0.12; });
    this.dust.rotation.y = time * 0.009;
    this.blood.update(dt);
    for (const e of this.effects) {
      e.life -= dt;
      if (e.ring) e.mesh.scale.setScalar(1 + (1 - e.life / e.max) * 4.5);
      else { e.velocity.y -= dt * 15; e.mesh.position.addScaledVector(e.velocity, dt); e.mesh.rotation.x += dt * 8; }
      (e.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, e.life / e.max);
    }
    this.effects = this.effects.filter(e => { if (e.life <= 0) { this.removeEffect(e); return false; } return true; });
    const target = menu ? new THREE.Vector3(7.8, 4.7, 13) : new THREE.Vector3(p.x * 0.65, 18.5, p.z * 0.65 + 22);
    const look = menu ? new THREE.Vector3(-1.2, 1.7, 3.5) : new THREE.Vector3(p.x * 0.65, 0, p.z * 0.65 - 1.5);
    this.camera.position.lerp(target, 1 - Math.exp(-dt * 4)); this.cameraLook.lerp(look, 1 - Math.exp(-dt * 5));
    this.shake = Math.max(0, this.shake - dt * 1.7); this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.3;
    this.camera.lookAt(this.cameraLook); this.renderer.render(this.scene, this.camera);
  }
}
