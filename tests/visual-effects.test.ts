import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { BloodEffects } from '../src/blood';
import { torsoGeometry } from '../src/anatomy';

describe('visual resource limits', () => {
  it('bounds blood instances and stains even during a long crowded battle', () => {
    const scene = new THREE.Scene(), blood = new BloodEffects(scene, new THREE.Texture());
    for (let i = 0; i < 500; i++) blood.splatter(0, 0, 1, 0, true);
    blood.update(0.01);
    const drops = scene.getObjectByName('blood-droplets') as THREE.InstancedMesh;
    expect(drops.count).toBeLessThanOrEqual(180);
    expect(scene.children.length).toBeLessThanOrEqual(57);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < drops.count; i++) { drops.getMatrixAt(i, matrix); expect(matrix.elements.every(Number.isFinite)).toBe(true); }
    for (let i = 0; i < 2500; i++) blood.update(0.01);
    expect(drops.count).toBe(0); expect(scene.children.length).toBe(1);
  });
  it('restart removes stains and particles without disposing shared render objects', () => {
    const scene = new THREE.Scene(), blood = new BloodEffects(scene, new THREE.Texture());
    blood.splatter(0, 0, 0, 0); blood.update(0.01); blood.reset();
    expect(scene.children).toHaveLength(1);
    expect((scene.children[0] as THREE.InstancedMesh).count).toBe(0);
    blood.splatter(0, 0, 0, 1); blood.update(0.01);
    expect((scene.children[0] as THREE.InstancedMesh).count).toBeGreaterThan(0);
  });
  it('continuous torso has finite vertices, UVs within bounds, and outward normals', () => {
    for (const monster of [false, true]) {
      const geometry = torsoGeometry(monster);
      const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), uv = geometry.getAttribute('uv');
      expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
      expect(Array.from(uv.array).every(v => v >= 0 && v <= 1)).toBe(true);
      // The front seam is at positive Z; its normal must face toward the viewer.
      expect(n.getZ(20 * 57)).toBeGreaterThan(0.5);
      geometry.dispose();
    }
  });
});
