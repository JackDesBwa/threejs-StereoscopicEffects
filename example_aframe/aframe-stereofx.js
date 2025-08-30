import { StereoscopicEffects } from 'threejs-stereoscopiceffects'

if (!AFRAME) console.error("Component attempted to register before AFRAME was available.");

AFRAME.registerSystem('stereofx', {
	schema: { type: 'int', default: 20 },

  init: function () {
		this.sfx = new StereoscopicEffects({
			renderer: this.el.renderer,
			defaultEffect: this.data,
			inject: true,
		});
  },

	update: function(o) {
		if (o !== undefined) this.sfx.setEffect(this.data);
	},
});

AFRAME.registerComponent('cam-focus', {
	dependencies: ['camera'],
	schema: { type: 'number', default: 2, },
	update: function (_) {
		const camera = this.el.getObject3D('camera');
		camera.focus = this.data;
	}
});
