# Copper grains exhibit asset

`dist/copper-grains.glb` contains five deliberately magnified, faceted copper particles and one 2.7 second translation clip, `CopperGrainsJoin`. It is an original Crazy Lab illustration. The particle shapes and motion are authored in `tools/build-copper-grains.mjs`, with no external meshes or textures. The motion illustrates particles joining to make a conductive track during the Powder Exhibition electronics demonstration. It represents an explanatory model of the change.

To regenerate the 3,620-byte glTF 2.0 binary, run `node tools/build-copper-grains.mjs` from the project. The viewer loads it through Three.js `GLTFLoader` and plays the embedded clip through `AnimationMixer`, synchronized to the **Light the LED** action. Reduced-motion mode shows the final pose. The existing circuit illustration stays usable if the model is unavailable.

The local `dist/vendor/GLTFLoader.js`, `dist/vendor/BufferGeometryUtils.js`, and `dist/vendor/SkeletonUtils.js` come from Three.js r186. The import paths point to the site's local modules. They are covered by `dist/vendor/LICENSE-THREE.txt`, the Three.js MIT license. [GLTFLoader source](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/loaders/GLTFLoader.js) · [Utility module source](https://github.com/mrdoob/three.js/tree/r186/examples/jsm/utils)
