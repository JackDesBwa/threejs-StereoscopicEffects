import { defineConfig } from 'vite';
import path from 'path';

const useRepoLib = !!process.env.VITE_REPOLIB
console.log('Using StereoscopicEffects from local repo:', useRepoLib);

export default defineConfig({
  resolve: {
		preserveSymlinks: true,
    alias: {
      'threejs-stereoscopiceffects': useRepoLib
        ? path.resolve(__dirname, '../src/StereoscopicEffects.js')
        : path.resolve(__dirname, 'node_modules/threejs-stereoscopiceffects'),
      'three/addons': path.resolve(__dirname, 'node_modules/three/examples/jsm'),
      'three': path.resolve(__dirname, 'node_modules/three'),
    },
  },
});
