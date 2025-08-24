import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const useRepoLib = !!process.env.VITE_REPOLIB
console.log('Using StereoscopicEffects from local repo:', useRepoLib);

const conf = defineConfig({
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

const pem = ['key', 'cert'].map(s => path.resolve(__dirname, s + '.pem'));
const useHttps = pem.reduce((acc, file) => acc && fs.existsSync(file), true);
console.log('Using HTTPS:', useHttps);
if (useHttps) {
	Object.assign(conf, defineConfig({
		server: {
			https: {
				key: pem[0],
				cert: pem[1],
			},
		}
	}));
}

export default conf;
