import * as THREE from 'three';
import { StereoscopicEffects } from 'threejs-StereoscopicEffects';

let scene, clock, cube, camera, renderer, stereofx;

function init() {
	scene = new THREE.Scene();
	const defaultEffect = 20; // Anaglyph RC half-colors

	clock = new THREE.Clock();

	cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshNormalMaterial());
	cube.position.set(0, 0, -3);
	scene.add(cube);

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.3, 30);
	camera.lookAt(cube.position);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	stereofx = new StereoscopicEffects(THREE, renderer, defaultEffect);
	stereofx.setSize(window.innerWidth, window.innerHeight);


	const modes = StereoscopicEffects.effectsListSelect();
	modes.value = defaultEffect;
	modes.style.position = 'absolute';
	modes.style.top = 0;
	modes.style.right = 0;
	modes.addEventListener('change', () => {
		stereofx.setEffect(modes.value);
	});
	document.body.appendChild(modes);

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		stereofx.setSize(window.innerWidth, window.innerHeight);
	});

	document.body.appendChild(renderer.domElement);
}

function render() {
	const dt = clock.getDelta();
	const speed = 0.5;

	cube.rotation.x -= dt * speed * 2;
	cube.rotation.y -= dt * speed;
	cube.rotation.z -= dt * speed * 3;

	stereofx.render(scene, camera);
}

init();
renderer.setAnimationLoop(render);
