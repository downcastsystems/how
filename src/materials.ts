import * as THREE from 'three';
import atlasUrl from './assets/warrior-materials-v1.png';

export type Surface = 'skin' | 'hide' | 'leather' | 'iron';
const quadrants: Record<Surface, [number, number]> = { skin: [0, 0.5], hide: [0.5, 0.5], leather: [0, 0], iron: [0.5, 0] };
const maps = new Map<Surface, { color: THREE.Texture; bump: THREE.Texture }>();
THREE.Cache.enabled = true;

export function surfaceMaterial(surface: Surface, tint = 0xffffff): THREE.MeshStandardMaterial {
  let textures = maps.get(surface);
  if (!textures) {
    // Each material samples one quadrant, inset to avoid neighbouring atlas pixels.
    const color = new THREE.TextureLoader().load(atlasUrl, loaded => { bump.image = loaded.image; bump.needsUpdate = true; }, undefined, () => {
      const status = document.getElementById('asset-status');
      if (status) { status.hidden = false; status.textContent = 'Texture could not load. Reload to retry; the game remains playable.'; }
    });
    const bump = new THREE.Texture();
    for (const texture of [color, bump]) {
      texture.repeat.set(0.48, 0.48);
      const [x, y] = quadrants[surface]; texture.offset.set(x + 0.01, y + 0.01);
      texture.anisotropy = 4;
    }
    color.colorSpace = THREE.SRGBColorSpace;
    bump.colorSpace = THREE.NoColorSpace;
    textures = { color, bump }; maps.set(surface, textures);
  }
  const material = new THREE.MeshStandardMaterial({
    color: tint, map: textures.color, bumpMap: textures.bump,
    bumpScale: { skin: 0.0025, hide: 0.065, leather: 0.025, iron: 0.018 }[surface],
    roughness: { skin: 0.72, hide: 0.86, leather: 0.79, iron: 0.53 }[surface],
    metalness: surface === 'iron' ? 0.78 : 0,
  });
  if (surface === 'skin') {
    // Keep pore colour variation subtle at whole-character scale.
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
        THREE.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',
          'diffuseColor *= vec4(mix(vec3(0.63, 0.40, 0.28), sampledDiffuseColor.rgb, 0.38), sampledDiffuseColor.a);'));
    };
    material.customProgramCacheKey = () => 'how-mature-skin-v1';
  }
  return material;
}
