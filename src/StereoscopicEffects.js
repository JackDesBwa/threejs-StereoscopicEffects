let T = undefined;

export const SideBySideStereoEffect = function(renderer, strenderer, cross, squeeze, tab) {
	const _sz = new T.Vector2();
	let _cross, _tab;

	this.render = function(scene, camera) {
		renderer.getSize(_sz);
		renderer.setScissorTest(true);

		if (_tab) {
			_sz.height /= 2;

			renderer.setScissor(0, 0, _sz.width, _sz.height);
			renderer.setViewport(0, 0, _sz.width, _sz.height);
			renderer.render(scene, cross ? strenderer.stereoCamera.cameraL : strenderer.stereoCamera.cameraR);

			renderer.setScissor(0, _sz.height, _sz.width, _sz.height);
			renderer.setViewport(0, _sz.height, _sz.width, _sz.height);
			renderer.render(scene, _cross ? strenderer.stereoCamera.cameraR : strenderer.stereoCamera.cameraL);

		} else {
			_sz.width /= 2;

			renderer.setScissor(0, 0, _sz.width, _sz.height);
			renderer.setViewport(0, 0, _sz.width, _sz.height);
			renderer.render(scene, cross ? strenderer.stereoCamera.cameraR : strenderer.stereoCamera.cameraL);

			renderer.setScissor(_sz.width, 0, _sz.width, _sz.height);
			renderer.setViewport(_sz.width, 0, _sz.width, _sz.height);
			renderer.render(scene, _cross ? strenderer.stereoCamera.cameraL : strenderer.stereoCamera.cameraR);
		}

		renderer.setScissorTest(false);
	};

	this.dispose = function () {
		renderer.getSize(_sz);
		renderer.setScissor(0, 0, _sz.width, _sz.height);
		renderer.setViewport(0, 0, _sz.width, _sz.height);
		strenderer.stereoCamera.aspect = 1;
	};

	this.setFormat = function(cross, squeeze, tab) {
		_cross = cross;
		strenderer.stereoCamera.aspect = squeeze ? 1 : (tab ? 2 : 0.5);
		_tab = tab;
	}
	this.setFormat(cross, squeeze, tab);
};

export const InterleavedStereoEffect = function (renderer, strenderer, dir) {
	const _material = new T.ShaderMaterial({
		uniforms: {
			"tl": { value: strenderer.bufferL.texture },
			"tr": { value: strenderer.bufferR.texture },
			"inv": { value: ((dir & 1) == 1) ^ ((dir & 2) == 0) },
			"dir": { value: ((dir & 2) == 2) },
			"checkboard": { value: dir >= 4 }
		},
		vertexShader: [
			"varying vec2 vUv;",
			"void main() {",
			"	vUv = vec2(uv.x, uv.y);",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
			"}"
		].join("\n"),
		fragmentShader: [
			"uniform sampler2D tl;",
			"uniform sampler2D tr;",
			"uniform bool dir;",
			"uniform bool inv;",
			"uniform bool checkboard;",
			"varying vec2 vUv;",

			"void main() {",
			"	vec2 uv = vUv;",
			"	float coord = gl_FragCoord.y;",
			"	if (dir) coord = gl_FragCoord.x;",
			"	if (checkboard) coord = mod(gl_FragCoord.x, 2.0) + mod(gl_FragCoord.y, 2.0);",
			"	if (inv) coord += 1.0;",
			"	if ((mod(coord, 2.0)) >= 1.0) {",
			"		gl_FragColor = texture2D(tr, vUv);",
			"	} else {",
			"		gl_FragColor = texture2D(tl, vUv);",
			"	}",
			"}"
		].join("\n")
	});

	const _mesh = new T.Mesh(new T.PlaneGeometry(2, 2), _material);
	const _scene = new T.Scene();
	_scene.add(_mesh);

	this.render = function(scene, camera) {
		const originalRenderTarget = renderer.getRenderTarget();


		renderer.setRenderTarget(strenderer.bufferL);
		renderer.clear();
		renderer.render(scene, strenderer.stereoCamera.cameraL);

		renderer.setRenderTarget(strenderer.bufferR);
		renderer.clear();
		renderer.render(scene, strenderer.stereoCamera.cameraR);

		renderer.setRenderTarget(null);
		renderer.render(_scene, strenderer.orthoCamera);

		renderer.setRenderTarget(originalRenderTarget);
	};

	this.dispose = function () {
		_mesh.geometry.dispose();
		_material.dispose();
	};
};

export const MirroredStereoEffect = function (renderer, strenderer, dir) {
	const _material = new T.ShaderMaterial({
		uniforms: {
			"tl": { value: strenderer.bufferL.texture },
			"tr": { value: strenderer.bufferR.texture },
			"invl": { value: ((dir & 1) == 1) },
			"invr": { value: ((dir & 2) == 2) },
		},
		vertexShader: [
			"varying vec2 vUv;",
			"void main() {",
			"	vUv = vec2(uv.x, uv.y);",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
			"}"
		].join("\n"),
		fragmentShader: [
			"uniform sampler2D tl;",
			"uniform sampler2D tr;",
			"uniform bool invl;",
			"uniform bool invr;",
			"varying vec2 vUv;",

			"void main() {",
			"	vec2 uv = vec2(vUv.x, vUv.y);",
			"	if (uv.x <= 0.5) {",
			"		uv.x = uv.x + 0.25;",
			"		if (invl) uv.x = 1.0 - uv.x;",
			"		gl_FragColor = texture2D(tl, uv);",
			"	} else {",
			"		uv.x = uv.x - 0.25;",
			"		if (invr) uv.x = 1.0 - uv.x;",
			"		gl_FragColor = texture2D(tr, uv);",
			"	}",
			"}"
		].join("\n")
	});

	const _mesh = new T.Mesh(new T.PlaneGeometry(2, 2), _material);
	const _scene = new T.Scene();
	_scene.add(_mesh);

	this.render = function(scene, camera) {
		const originalRenderTarget = renderer.getRenderTarget();

		renderer.setRenderTarget(strenderer.bufferL);
		renderer.clear();
		renderer.render(scene, strenderer.stereoCamera.cameraL);

		renderer.setRenderTarget(strenderer.bufferR);
		renderer.clear();
		renderer.render(scene, strenderer.stereoCamera.cameraR);

		renderer.setRenderTarget(null);
		renderer.render(_scene, strenderer.orthoCamera);

		renderer.setRenderTarget(originalRenderTarget);
	};

	this.dispose = function () {
		_mesh.geometry.dispose();
		_material.dispose();
	};
};

export const AnaglyphStereoEffect = function (renderer, strenderer, method) {
	const M = function(a) {
		return new T.Matrix3().fromArray(a).transpose()
	};
	const _anaglyphGray_gm = [
		M([ 0, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0 ]),
		M([ 0.299, 0.587, 0.114, 0, 0, 0, 0.299, 0.587, 0.114 ])
	];
	const _anaglyphGray_yb = [
		M([ 0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0, 0, 0 ]),
		M([ 0, 0, 0, 0, 0, 0, 0.299, 0.587, 0.114 ])
	];
	const _anaglyphGray_rc = [
		M([ 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 0 ]),
		M([ 0, 0, 0, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114 ])
	];
	const _anaglyphHalfColors_gm = [
		M([ 0, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0 ]),
		M([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ])
	];
	const _anaglyphHalfColors_yb = [
		M([ 1, 0, 0, 0, 1, 0, 0, 0, 0 ]),
		M([ 0, 0, 0, 0, 0, 0, 0.299, 0.587, 0.114 ])
	];
	const _anaglyphHalfColors_rc = [
		M([ 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 0 ]),
		M([ 0, 0, 0, 0, 1, 0, 0, 0, 1 ])
	];
	const _anaglyphFullColors_gm = [
		M([ 0, 0, 0, 0, 1, 0, 0, 0, 0 ]),
		M([ 1, 0, 0, 0, 0, 0, 0, 0, 1 ])
	];
	const _anaglyphFullColors_yb = [
		M([ 1, 0, 0, 0, 1, 0, 0, 0, 0 ]),
		M([ 0, 0, 0, 0, 0, 0, 0, 0, 1 ])
	];
	const _anaglyphFullColors_rc = [
		M([ 1, 0, 0, 0, 0, 0, 0, 0, 0 ]),
		M([ 0, 0, 0, 0, 1, 0, 0, 0, 1 ])
	];
	const _anaglyphDubois_gm = [
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
	const _anaglyphDubois_yb = [
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
	const _anaglyphDubois_rc = [
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

	const _material = new T.ShaderMaterial({
		uniforms: {
			"tl": { value: strenderer.bufferL.texture },
			"tr": { value: strenderer.bufferR.texture },
			"ml": { value: _anaglyphDubois_rc[0] },
			"mr": { value: _anaglyphDubois_rc[1] }
		},
		vertexShader: [
			"varying vec2 vUv;",
			"void main() {",
			"	vUv = vec2(uv.x, uv.y);",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
			"}"
		].join("\n"),
		fragmentShader: [
			"uniform sampler2D tl;",
			"uniform sampler2D tr;",
			"varying vec2 vUv;",

			"uniform mat3 ml;",
			"uniform mat3 mr;",

			"void main() {",
			"	vec4 cl = texture2D(tl, vUv);",
			"	vec4 cr = texture2D(tr, vUv);",
			"	vec3 c = ml * cl.rgb + mr * cr.rgb;",
			"	gl_FragColor = vec4(",
			"			c.r, c.g, c.b,",
			"			max(cl.a, cr.a)",
			"	);",
			"}"
		].join("\n")
	});
	const _anaglyphs = [
		_anaglyphGray_rc, _anaglyphHalfColors_rc, _anaglyphFullColors_rc, _anaglyphDubois_rc,
		_anaglyphGray_yb, _anaglyphHalfColors_yb, _anaglyphFullColors_yb, _anaglyphDubois_yb,
		_anaglyphGray_gm, _anaglyphHalfColors_gm, _anaglyphFullColors_gm, _anaglyphDubois_gm
	];

	const _mesh = new T.Mesh(new T.PlaneGeometry(2, 2), _material);
	const _scene = new T.Scene();
	_scene.add(_mesh);

	this.render = function(scene, camera) {
		const originalRenderTarget = renderer.getRenderTarget();

		renderer.setRenderTarget(strenderer.bufferL);
		renderer.clear();
		renderer.render(scene, strenderer.stereoCamera.cameraL);

		renderer.setRenderTarget(strenderer.bufferR);
		renderer.clear();
		renderer.render(scene, strenderer.stereoCamera.cameraR);

		renderer.setRenderTarget(null);
		renderer.render(_scene, strenderer.orthoCamera);

		renderer.setRenderTarget(originalRenderTarget);
	};

	this.dispose = function () {
		_mesh.geometry.dispose();
		_material.dispose();
	};

	this.setMethod = function(method) {
		method = Number(method);
		if (method < 0 || method >= _anaglyphs.length || isNaN(method)) method = 1;
		_material.uniforms.ml.value = _anaglyphs[method][0];
		_material.uniforms.mr.value = _anaglyphs[method][1];
	}

	this.setMethod(method);
};

export const SingleViewStereoEffect = function (renderer, strenderer, cross) {
	let _cross;
	this.render = function(scene, camera) {
		renderer.render(scene, _cross ? strenderer.stereoCamera.cameraR : strenderer.stereoCamera.cameraL);
	};
	this.dispose = function () { };
	this.setCross = function(cross) { _cross = cross; }
	this.setCross(cross);
};

export const StereoscopicEffectsRenderer = function(renderer) {
	this.stereoCamera = new T.StereoCamera();
	this.orthoCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	this.bufferL = new T.WebGLRenderTarget(renderer.width, renderer.height, { minFilter: T.LinearFilter, magFilter: T.NearestFilter, format: T.RGBAFormat });
	this.bufferR = this.bufferL.clone();
}

export const StereoscopicEffects = function (three, renderer, effect) {
	T = three;
	const strenderer = new StereoscopicEffectsRenderer(renderer);
	let _effect = new SingleViewStereoEffect(renderer, strenderer);

	this.setEyeSeparation = function(sep) { strenderer.stereoCamera.eyeSep = sep; };

	this.setSize = function(width, height) {
		renderer.setSize(width, height);
		const pixelRatio = renderer.getPixelRatio();
		strenderer.bufferL.setSize(width * pixelRatio, height * pixelRatio);
		strenderer.bufferR.setSize(width * pixelRatio, height * pixelRatio);
	};

	this.render = function(scene, camera) {
		if (('xr' in renderer) && renderer.xr.isPresenting) {
			renderer.render(scene, camera);
		} else {
			scene.updateMatrixWorld();
			if (camera.parent === null) camera.updateMatrixWorld();
			strenderer.stereoCamera.update(camera);
			if (renderer.autoClear) renderer.clear();
			_effect.render(scene, camera);
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
			_effect = new SingleViewStereoEffect(renderer, strenderer, effect);
			return;
		}
		effect -= 2;

		if (effect < 8) {
			_effect = new SideBySideStereoEffect(renderer, strenderer, effect & 1, effect & 2, effect & 4);
			return;
		}
		effect -= 8;

		if (effect < 6) {
			_effect = new InterleavedStereoEffect(renderer, strenderer, effect);
			return;
		}
		effect -= 6;

		if (effect < 3) {
			_effect = new MirroredStereoEffect(renderer, strenderer, effect+1);
			return;
		}
		effect -= 3;

		if (effect < 12) {
			_effect = new AnaglyphStereoEffect(renderer, strenderer, effect);
			return;
		}
		effect -= 12;

		_effect = new SideBySideStereoEffect(renderer, strenderer);
	}

	this.setEffect(effect);
};

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
		optgroup.label = v.name;
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
