# Character material atlas

Asset: `src/assets/warrior-materials-v1.png`.

Created with the built-in image-generation tool. The generated source is 1254 ×
1254 pixels. It is an original surface-material atlas, not a copied God of War
texture and not a UV-unwrapped portrait. The four quadrants contain mature human
skin, demon hide, aged leather, and forged iron. Runtime materials sample inset
regions to avoid bleeding across boundaries. Colour maps use sRGB; bump maps use
non-colour data. Skin colour contrast and bump strength are reduced in the shader
so pores do not dominate at whole-character scale. Textures are shared across
monsters and are bundled under the Vite base path, including `/how/` production.

The continuous torso mesh replaces overlapping chest/abdomen spheres. Monster
faces have brows, cheekbones, jaws, and teeth. Limbs and facial proportions remain
procedural; realistic textures do not turn these into a fully sculpted character.
Three.js supports PBR materials, normal/bump maps and skinned models, so an engine
migration is not necessary for a later higher-fidelity character pass.

Reference: https://threejs.org/docs/pages/MeshStandardMaterial.html

## Generation prompt

Create a production-ready 2048x2048 pixel square PBR BASE COLOR MATERIAL TEXTURE
ATLAS for an original realistic dark fantasy action video game. EXACT layout:
four square quadrants, perfectly equal 1024x1024 each, no border, no gaps, NO text
or labels. Top left: medium warm tan human skin of a mature East Asian male
warrior, closeup surface only, very fine pores, slight age mottling, faint healed
fine scars, subtle veins, no hair, no body parts or features. Top right: realistic
desaturated gray olive demon hide, leathery uneven pores, fine branching scars,
darker creases, subtle bruised reddish patches, no scales larger than a
fingernail, no eyes or body parts. Bottom left: aged dark oxblood brown leather,
detailed supple fine leather grain, fine abrasion, natural worn variation, no
seams or stitching and no objects. Bottom right: worn dark gray forged iron, fine
scratches and hammer grain, subtle warm oxidation, no objects or symbols. Each
quadrant is an independently seamless repeating flat tile, material fills all
pixels. Color photography realism but absolutely flat diffuse evenly lit albedo
with no cast shadows, no specular highlights, no vignette, no perspective. The
image is the texture itself, not a preview sphere, render, presentation sheet,
character portrait or UV wireframe. Fine subtle surface detail rather than
coarse noise.

The output dimensions differ from the requested dimensions. The runtime uses
normalised UVs, so this does not affect the atlas layout.
