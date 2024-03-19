import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
scene.background = new THREE.Color(0xFFFFFF);


const controls = new OrbitControls( camera, renderer.domElement );
controls.zoomToCursor = true;
controls.minDistance = 10;
controls.maxDistance = 150;


const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
geometry.translate(25, 25, 25);

// camera.position.z = 10;
camera.position.z = 10;

controls.update();

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
}

animate();

// Grid Settings
const size = 100;
const divisions = 100;
const axisColor = new THREE.Color(0x000000);
const gridColor = new THREE.Color(0xD3D3D3);

// 2D Grid Setup
const gridHelper = new THREE.GridHelper( size, divisions, axisColor, gridColor );
gridHelper.rotation.x = Math.PI / 2;
scene.add( gridHelper );

// 3D Grid Setup
const gridHelperXZ = new THREE.GridHelper( size, divisions, axisColor, gridColor );
scene.add( gridHelperXZ );
const gridHelperYZ = new THREE.GridHelper( size, divisions, axisColor, gridColor );
gridHelperYZ.rotation.z = Math.PI / 2;
scene.add( gridHelperYZ );
gridHelperXZ.visible = false;
gridHelperYZ.visible = false;

// 3D Control Button
const threeDButton: any = document.getElementById('3d');
let in3dMode: boolean = false;
threeDButton.addEventListener('click', () => {
	in3dMode = !in3dMode;
	if(in3dMode) {
		gridHelperXZ.visible = true;
		gridHelperYZ.visible = true;
	} else {
		gridHelperXZ.visible = false;
		gridHelperYZ.visible = false;
	}
});

// Oliver is testing how to draw things:

// Draws random points, but they are squares, sadly.
const vertices = [];

for ( let i = 0; i < 20; i ++ ) {
	const x = THREE.MathUtils.randFloatSpread( 10 );
	const y = THREE.MathUtils.randFloatSpread( 10 );
	const z = THREE.MathUtils.randFloatSpread( 10 );

	vertices.push( x, y, z );
}

const pointGeom = new THREE.BufferGeometry();
pointGeom.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
const pointMat = new THREE.PointsMaterial( { size: 0.2, color: 0x888888 } );
const points = new THREE.Points( pointGeom, pointMat );
scene.add( points );

// Attempting to draw circles/spheres.

const circleGeom = new THREE.SphereGeometry( 0.1);
const circleMat = new THREE.MeshBasicMaterial( { color: 0x00303a});
const circle = new THREE.Mesh( circleGeom, circleMat);
scene.add(circle);