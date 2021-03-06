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
				{ find: 'threejs-StereoscopicEffects', replacement: './node_modules/threejs-stereoscopiceffects/src/StereoscopicEffects.js' },
				{ find: 'three', replacement: './node_modules/three/build/three.module.js' }
			]
		})
	]
}
