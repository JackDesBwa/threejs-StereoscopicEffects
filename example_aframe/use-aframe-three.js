// This file is to trick the browser to use A-Frame's THREE injected module,
// loaded as ESM module. Unfortunately, we have to name explicitely all the
// objects we want to export, twice: once to import, once to export.

const {
	Scene,
	StereoCamera,
	OrthographicCamera,
	ShaderMaterial,
	Mesh,
	PlaneGeometry,
	WebGLRenderTarget,
	Vector2,
	Matrix3,
	LinearFilter,
	NearestFilter,
	RGBAFormat
} = window.THREE;

export {
	Scene,
	StereoCamera,
	OrthographicCamera,
	ShaderMaterial,
	Mesh,
	PlaneGeometry,
	WebGLRenderTarget,
	Vector2,
	Matrix3,
	LinearFilter,
	NearestFilter,
	RGBAFormat
};
