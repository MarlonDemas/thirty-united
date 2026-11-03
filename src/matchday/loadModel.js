// Model loader: plain GLTFLoader (no meshopt decoder: the only model, street_lamp_01.gltf, has no EXT_meshopt_compression, and the decoder would need 'wasm-unsafe-eval') and shadows on every mesh.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createGLTFLoader() {
  return new GLTFLoader();
}

// Resolves to the glTF scene (Group) with castShadow/receiveShadow set. Use the full result via loader.loadAsync if you need animations.
export async function loadModel(url, { cast = true, receive = true } = {}) {
  const gltf = await createGLTFLoader().loadAsync(url);
  gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
  return gltf.scene;
}
