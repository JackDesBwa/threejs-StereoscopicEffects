import * as THREE from 'three';
import { StereoscopicEffects } from 'threejs-StereoscopicEffects';

let scene, cube, camera, renderer, stereofx;

function init() {
	scene = new THREE.Scene();
	const defaultEffect = 20; // Anaglyph RC half-colors

	cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshNormalMaterial());
	scene.add(cube);

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10);
	camera.position.set(0, 3, 3);
	camera.lookAt(scene.position);

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

let ltime = 0;
function render(time) {
	const dt = (time - ltime) / 1000;
	ltime = time;

	requestAnimationFrame(render);

	const speed = 0.5;
	cube.rotation.x -= dt * speed * 2;
	cube.rotation.y -= dt * speed;
	cube.rotation.z -= dt * speed * 3;

	stereofx.render(scene, camera);
}

init();
render(0);
