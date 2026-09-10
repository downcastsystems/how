import * as THREE from 'three';

const gaussian = (v: number, center: number, width: number) => Math.exp(-(((v - center) / width) ** 2));
/** Continuous torso surface: chest, rib cage, obliques and abdomen share normals. */
export function torsoGeometry(monster = false): THREE.BufferGeometry {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const rows = 40, segments = 56;
  for (let row = 0; row <= rows; row++) {
    const v = row / rows, y = -0.24 + v * 1.37;
    const width = 0.38 + 0.28 * gaussian(y, 0.70, 0.43) - 0.13 * gaussian(y, 1.15, 0.13);
    const depth = 0.23 + 0.08 * gaussian(y, 0.63, 0.48);
    for (let col = 0; col <= segments; col++) {
      const u = col / segments, a = u * Math.PI * 2;
      const x = Math.sin(a) * width, front = Math.max(0, Math.cos(a));
      let z = Math.cos(a) * depth;
      z += Math.pow(front, 4) * (0.13 * gaussian(Math.abs(x), 0.29, 0.24) * gaussian(y, 0.73, 0.19));
      for (const h of [0.08, 0.27, 0.45]) z += Math.pow(front, 9) * 0.029 * gaussian(y, h, 0.065) * gaussian(Math.abs(x), 0.13, 0.13);
      z -= Math.pow(front, 8) * 0.017 * gaussian(x, 0, 0.025);
      if (monster) z += Math.sin(y * 35) * Math.pow(front, 3) * 0.012;
      positions.push(x, y, z); uv.push(u, v);
      if (row < rows && col < segments) { const i = row * (segments + 1) + col; indices.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
