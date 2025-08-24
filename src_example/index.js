import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { StereoscopicEffects } from 'threejs-stereoscopiceffects';

let scene, clock, cube, camera, renderer, controls, stereofx;

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
	stereofx = new StereoscopicEffects(renderer, defaultEffect);
	stereofx.setSize(window.innerWidth, window.innerHeight);

	controls = new OrbitControls(camera, renderer.domElement);
	controls.target = cube.position;
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.listenToKeyEvents(window);

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

	if (navigator.xr) {
		const divXr = document.createElement('div');
		Object.assign(divXr.style, { position: 'absolute', top: 0, left: 0 });
		document.body.append(divXr);
		const mkBtn = (label, xr) => {
			navigator.xr.isSessionSupported('immersive-' + xr).then(supported => {
				if (!supported) return;
				renderer.xr.enabled = true;
				renderer.xr.setReferenceSpaceType('local');

				const btn = document.createElement('button');
				btn.innerText = label;
				btn.onclick = () => {
					navigator.xr.requestSession('immersive-' + xr).then(session => {
						divXr.style.display = 'none';
						session.addEventListener("end", () => {
							divXr.style.display = 'block';
							camera.position.set(0, 0, 0);
							camera.lookAt(cube.position);
						});
						renderer.xr.setSession(session)
					});
				};
				divXr.append(btn);
			});
		};
		mkBtn('Enter VR', 'vr');
		mkBtn('Enter AR', 'ar');
	}

	document.body.appendChild(renderer.domElement);
}

function render() {
	const dt = clock.getDelta();
	const speed = 0.5;

	cube.rotation.x -= dt * speed * 2;
	cube.rotation.y -= dt * speed;
	cube.rotation.z -= dt * speed * 3;

	controls.update();
	stereofx.render(scene, camera);
}

init();
renderer.setAnimationLoop(render);
