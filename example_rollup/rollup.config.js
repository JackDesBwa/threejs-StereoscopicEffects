import alias from '@rollup/plugin-alias';
export default {
	input: 'index.js',
	output: {
		file: 'stereo_example.js',
		format: 'esm',
	},
	plugins: [
		alias({
			entries: [
				{ find: 'threejs-stereoscopiceffects', replacement: './node_modules/threejs-stereoscopiceffects/src/StereoscopicEffects.js' },
				{ find: 'three/addons', replacement: './node_modules/three/examples/jsm' },
				{ find: 'three', replacement: './node_modules/three/build/three.module.js' }
			]
		})
	]
}
