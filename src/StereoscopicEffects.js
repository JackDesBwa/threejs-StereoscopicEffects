let T = undefined;

const simpleVertexShader = `
	varying vec2 vUv;
	void main() {
		vUv = vec2(uv.x, uv.y);
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const commonFragH = `
	uniform sampler2D tl;
	uniform sampler2D tr;
	varying vec2 vUv;
	vec4 c(sampler2D t, vec2 uv) { return sRGBTransferOETF(texture2D(t, uv)); }
	vec4 c(sampler2D t) { return c(t, vUv); }
`;

const makeMultiRender = function(sr, obj, material) {
	const _plane = new T.Mesh(new T.PlaneGeometry(2, 2), material);
	const _mixscene = new T.Scene();
	_mixscene.add(_plane);

	obj.render = function(scene) {
		const r = sr.r;
		const originalRenderTarget = r.getRenderTarget();


		r.setRenderTarget(sr.bufferL);
		r.clear();
		r.render(scene, sr.stereoCamera.cameraL);

		r.setRenderTarget(sr.bufferR);
		r.clear();
		r.render(scene, sr.stereoCamera.cameraR);

		r.setRenderTarget(null);
		r.render(_mixscene, sr.orthoCamera);

		r.setRenderTarget(originalRenderTarget);
	};

	obj.dispose = function () {
		_plane.geometry.dispose();
		material.dispose();
	};
}

const SideBySideStereoEffect = function(sr, cross, squeeze, tab) {
	const _sz = new T.Vector2();
	sr.stereoCamera.aspect = squeeze ? 1 : (tab ? 2 : 0.5);

	this.render = function(scene) {
		const r = sr.r;
		const cl = sr.stereoCamera.cameraL, cr = sr.stereoCamera.cameraR;
		r.getSize(_sz);
		r.setScissorTest(true);
		let w = _sz.width, h = _sz.height;

		if (tab) {
			h /= 2;

			r.setScissor(0, 0, w, h);
			r.setViewport(0, 0, w, h);
			r.render(scene, cross ? cl : cr);

			r.setScissor(0, h, w, h);
			r.setViewport(0, h, w, h);
			r.render(scene, cross ? cr : cl);

		} else {
			w /= 2;

			r.setScissor(0, 0, w, h);
			r.setViewport(0, 0, w, h);
			r.render(scene, cross ? cr : cl);

			r.setScissor(w, 0, w, h);
			r.setViewport(w, 0, w, h);
			r.render(scene, cross ? cl : cr);
		}

		r.setScissorTest(false);
	};

	this.dispose = function () {
		const r = sr.r;
		r.getSize(_sz);
		r.setScissor(0, 0, _sz.width, _sz.height);
		r.setViewport(0, 0, _sz.width, _sz.height);
		sr.stereoCamera.aspect = 1;
	};
};

const InterleavedStereoEffect = function (sr, dir) {
	const _material = new T.ShaderMaterial({
		uniforms: {
			"tl": { value: sr.bufferL.texture },
			"tr": { value: sr.bufferR.texture },
			"inv": { value: ((dir & 1) == 1) ^ ((dir & 2) == 0) },
			"dir": { value: ((dir & 2) == 2) },
			"checkboard": { value: dir >= 4 }
		},
		vertexShader: simpleVertexShader,
		fragmentShader: commonFragH + `
			uniform bool dir;
			uniform bool inv;
			uniform bool checkboard;

			void main() {
				vec2 uv = vUv;
				float coord = gl_FragCoord.y;
				if (dir) coord = gl_FragCoord.x;
				if (checkboard) coord = mod(gl_FragCoord.x, 2.0) + mod(gl_FragCoord.y, 2.0);
				if (inv) coord += 1.0;
				if ((mod(coord, 2.0)) >= 1.0) {
					gl_FragColor = c(tr);
				} else {
					gl_FragColor = c(tl);
				}
			}`
	});

	makeMultiRender(sr, this, _material);
};

const MirroredStereoEffect = function (sr, dir) {
	const _material = new T.ShaderMaterial({
		uniforms: {
			"tl": { value: sr.bufferL.texture },
			"tr": { value: sr.bufferR.texture },
			"invl": { value: ((dir & 1) == 1) },
			"invr": { value: ((dir & 2) == 2) },
		},
		vertexShader: simpleVertexShader,
		fragmentShader: commonFragH + `
			uniform bool invl;
			uniform bool invr;

			void main() {
				vec2 uv = vec2(vUv.x, vUv.y);
				if (uv.x <= 0.5) {
					uv.x = uv.x + 0.25;
					if (invl) uv.x = 1.0 - uv.x;
					gl_FragColor = c(tl, uv);
				} else {
					uv.x = uv.x - 0.25;
					if (invr) uv.x = 1.0 - uv.x;
					gl_FragColor = c(tr, uv);
				}
			}`
	});

	makeMultiRender(sr, this, _material);
};

const AnaglyphStereoEffect = function (sr, method) {
	const _material = new T.ShaderMaterial({
		uniforms: {
			"tl": { value: sr.bufferL.texture },
			"tr": { value: sr.bufferR.texture },
			"ml": { value: null },
			"mr": { value: null }
		},
		vertexShader: simpleVertexShader,
		fragmentShader: commonFragH + `
			uniform mat3 ml;
			uniform mat3 mr;

			void main() {
				vec4 cl = c(tl);
				vec4 cr = c(tr);
				vec3 c = ml * cl.rgb + mr * cr.rgb;
				gl_FragColor = vec4(
						c.r, c.g, c.b,
						max(cl.a, cr.a)
				);
			}`
	});

	makeMultiRender(sr, this, _material);

	const getMatrices = m => {
		const M = function(a) {
			return new T.Matrix3().fromArray(a).transpose()
		};
		switch (m) {
			case 0: // Grey RC
				return [
					M([ 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 0 ]),
					M([ 0, 0, 0, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114 ])
				];
			case 1: // HalfColors RC
				return [
					M([ 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 0 ]),
					M([ 0, 0, 0, 0, 1, 0, 0, 0, 1 ])
				];
			case 2: // FullColors RC
				return [
					M([ 1, 0, 0, 0, 0, 0, 0, 0, 0 ]),
					M([ 0, 0, 0, 0, 1, 0, 0, 0, 1 ])
				];
			case 3: // Dubois RC
				return [
					M([
						+0.456, +0.500, +0.176,
						-0.040, -0.038, -0.016,
						-0.015, -0.021, -0.005
					]),
					M([
						-0.043, -0.088, -0.002,
						+0.378, +0.734, -0.018,
						-0.072, -0.113, +1.226
					])
				];
			case 4: // Grey YB
				return [
					M([ 0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0, 0, 0 ]),
					M([ 0, 0, 0, 0, 0, 0, 0.299, 0.587, 0.114 ])
				];
			case 5: // HalfColors YB
				return [
					M([ 1, 0, 0, 0, 1, 0, 0, 0, 0 ]),
					M([ 0, 0, 0, 0, 0, 0, 0.299, 0.587, 0.114 ])
				];
			case 6: // FullColors YB
				return [
					M([ 1, 0, 0, 0, 1, 0, 0, 0, 0 ]),
					M([ 0, 0, 0, 0, 0, 0, 0, 0, 1 ])
				];
			case 7: // Dubois YB
				return [
					M([
						+1.062, -0.205, +0.299,
						-0.026, +0.908, +0.068,
						-0.038, -0.173, +0.022
					]),
					M([
						-0.016, -0.123, -0.017,
						+0.006, +0.062, -0.017,
						+0.094, +0.185, +0.911
					])
				];
			case 8: // Grey GM
				return [
					M([ 0, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0 ]),
					M([ 0.299, 0.587, 0.114, 0, 0, 0, 0.299, 0.587, 0.114 ])
				];
			case 9: // HalfColors GM
				return [
					M([ 0, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0 ]),
					M([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ])
				];
			case 10: // FullColors GM
				return [
					M([ 0, 0, 0, 0, 1, 0, 0, 0, 0 ]),
					M([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ])
				];
			case 11: // Dubois GM
				return [
					M([
						-0.062, -0.158, -0.039,
						+0.284, +0.668, +0.143,
						-0.015, -0.027, +0.021
					]),
					M([
						+0.529, +0.705, +0.024,
						-0.016, -0.015, -0.065,
						+0.009, +0.075, +0.937
					])
				];
		}
	}
	method = Number(method);
	if (method < 0 || method >= 12 || isNaN(method)) method = 1;
	const _matrices = getMatrices(method)
	_material.uniforms.ml.value = _matrices[0];
	_material.uniforms.mr.value = _matrices[1];
};

const SingleViewStereoEffect = function (sr, cross) {
	this.render = function(scene) {
		sr.r.render(scene, cross ? sr.stereoCamera.cameraR : sr.stereoCamera.cameraL);
	};
	this.dispose = function () { };
};

const StereoscopicEffectsRenderer = function(renderer) {
	this.r = renderer;
	this.stereoCamera = new T.StereoCamera();
	this.orthoCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	this.bufferL = new T.WebGLRenderTarget(
		renderer.width, renderer.height,
		{ minFilter: T.LinearFilter, magFilter: T.NearestFilter, format: T.RGBAFormat }
	);
	this.bufferR = this.bufferL.clone();
};

export const StereoscopicEffects = function (renderer, effect) {
	if (!T) throw new Error("StereoscopicEffects: no three.js provided");
	const sr = new StereoscopicEffectsRenderer(renderer);
	let _effect = new SingleViewStereoEffect(sr);

	this.setEyeSeparation = function(sep) { sr.stereoCamera.eyeSep = sep; };

	this.setSize = function(width, height) {
		renderer.setSize(width, height);
		const pixelRatio = renderer.getPixelRatio();
		sr.bufferL.setSize(width * pixelRatio, height * pixelRatio);
		sr.bufferR.setSize(width * pixelRatio, height * pixelRatio);
	};

	this.render = function(scene, camera) {
		if (('xr' in renderer) && renderer.xr.isPresenting) {
			renderer.render(scene, camera);
		} else {
			scene.updateMatrixWorld();
			if (camera.parent === null) camera.updateMatrixWorld();
			sr.stereoCamera.update(camera);
			if (renderer.autoClear) renderer.clear();
			_effect.render(scene);
		}
	}

	this.dispose = function () {
		_effect.dispose();
	};

	this.setEffect = function(effect) {
		effect = Number(effect);
		if (effect < 0 || isNaN(effect)) effect = 0;

		_effect.dispose();

		if (effect < 2) {
			_effect = new SingleViewStereoEffect(sr, effect);
			return;
		}
		effect -= 2;

		if (effect < 8) {
			_effect = new SideBySideStereoEffect(sr, effect & 1, effect & 2, effect & 4);
			return;
		}
		effect -= 8;

		if (effect < 6) {
			_effect = new InterleavedStereoEffect(sr, effect);
			return;
		}
		effect -= 6;

		if (effect < 3) {
			_effect = new MirroredStereoEffect(sr, effect+1);
			return;
		}
		effect -= 3;

		if (effect < 12) {
			_effect = new AnaglyphStereoEffect(sr, effect);
			return;
		}
		effect -= 12;

		_effect = new SideBySideStereoEffect(sr);
	}

	this.setEffect(effect);
};

StereoscopicEffects.setThreeJS = function(t) {
	T = t;
}

StereoscopicEffects.effectsList = function() {
	const ret = [];
	let cur_g = [];
	let v = -1;
	function g(n) {
		cur_g = new Array();
		ret.push({
			'category': n,
			'elements': cur_g,
		});
	}
	function o(n) {
		v += 1;
		cur_g.push({
			'name': n,
			'value': v,
		});
	}

	g("Single view");
	o("Single view left");
	o("Single view right");

	g("Side-by-Side");
	o("Parallel view");
	o("Cross view");
	o("Parallel anamorphic view");
	o("Cross anamorphic view");

	g("Top-and-Bottom");
	o("Top-Bottom view");
	o("Bottom-top view");
	o("Top-Bottom anamorphic view");
	o("Bottom-top anamorphic view");

	g("Interleaved");
	o("Interleaved lines 1");
	o("Interleaved lines 2");
	o("Interleaved columns 1");
	o("Interleaved columns 2");
	o("Checkerboard 1");
	o("Checkerboard 2");

	g("Mirrored");
	o("Mirrored left");
	o("Mirrored right");
	o("Mirrored both");

	g("Anaglyph");
	o("Anaglyph Red/Cyan Gray");
	o("Anaglyph Red/Cyan Half Colors");
	o("Anaglyph Red/Cyan Full Colors");
	o("Anaglyph Red/Cyan Dubois");
	o("Anaglyph Yellow/Blue Gray");
	o("Anaglyph Yellow/Blue Half Colors");
	o("Anaglyph Yellow/Blue Full Colors");
	o("Anaglyph Yellow/Blue Dubois");
	o("Anaglyph Green/Magenta Gray");
	o("Anaglyph Green/Magenta Half Colors");
	o("Anaglyph Green/Magenta Full Colors");
	o("Anaglyph Green/Magenta Dubois");

	return ret;
}

StereoscopicEffects.effectsListSelect = function(name) {
	const select = document.createElement("select");
	select.name = name || 'mode';
	StereoscopicEffects.effectsList().forEach(v => {
		const optgroup = document.createElement("optgroup");
		optgroup.label = v.category;
		select.appendChild(optgroup);
		v.elements.forEach(v => {
			const option = document.createElement("option");
			option.text = v.name;
			option.value = v.value;
			optgroup.appendChild(option);
		});
	});
	return select;
};
