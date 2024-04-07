import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
scene.background = new THREE.Color(0xFFFFFF);


const controls = new OrbitControls( camera, renderer.domElement );
const controlsInit = () => {
	controls.reset();
	controls.zoomToCursor = true;
	controls.enableRotate = false;
	controls.minDistance = 10.0;
	controls.maxDistance = 50.0;
	camera.position.z = 10;
	camera.position.x = 0;
	camera.position.y = 0;
}

controlsInit();

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
}

animate();

// Grid Settings
const size = 1000;
const divisions = 1000;
const axisColor = new THREE.Color(0x000000);
const gridColor = new THREE.Color(0xD3D3D3);

// 2D Grid Setup
const gridHelper = new THREE.GridHelper( size, divisions, axisColor, gridColor );
gridHelper.rotation.x = Math.PI / 2;
scene.add( gridHelper );

// 3D Grid Setup
// const gridHelperXZ = new THREE.GridHelper( size, divisions, axisColor, gridColor );
// scene.add( gridHelperXZ );
// const gridHelperYZ = new THREE.GridHelper( size, divisions, axisColor, gridColor );
// gridHelperYZ.rotation.z = Math.PI / 2;
// scene.add( gridHelperYZ );
// gridHelperXZ.visible = false;
// gridHelperYZ.visible = false;

// 3D Control Button
// const threeDButton: any = document.getElementById('3d');
// let in3dMode: boolean = false;
// threeDButton.addEventListener('click', () => {
// 	in3dMode = !in3dMode;
// 	controls.enableRotate = in3dMode;
// 	gridHelperXZ.visible = in3dMode;
// 	gridHelperYZ.visible = in3dMode;
// 	if(!in3dMode) {
// 		if(currentColor === 'green') {
// 			currentColor = 'red';
// 			objectColorSelection.value = currentColor;
// 		}
// 		circles.forEach((circle) => {
// 			if(circle.material instanceof THREE.MeshBasicMaterial) {
// 				if(circle.material.color.getHex() === 0x00FF00) {
// 					circle.material.color.setHex(0xFF0000);
// 				}
// 			}
// 		});
// 		controlsInit();
// 	}
// });

// Oliver is testing how to draw things:

// Draws random points, but they are squares, sadly.
// const vertices = [];
const circles: THREE.Mesh[] = [];
const hamdSandwich: THREE.Line[] = [];


// Reset button to clear points on canvas
const resetButton: any = document.getElementById('reset');
resetButton.addEventListener('click', () => {
	circles.forEach((circle) => {
		scene.remove(circle);
	});
	circles.length = 0;
	scene.remove(hamdSandwich.pop());
	// Remove all of the convex closures we were drawing for shapes
	// color2Closure.forEach((meshes) => {
	// 	meshes.forEach((mesh: any) => {
	// 		scene.remove(mesh);
	// 	});
	// });
	controlsInit();
});

// Color Button
const objectColorSelection: any = document.getElementById('object-color');
let currentColor = 'red';
objectColorSelection.addEventListener('change', (event: Event) => {
	const color = (event.target as HTMLInputElement).value;
	// Invalid swap (only want to allow green if we are in 3D mode)
	// if(!in3dMode && color === 'green') {
	// 	objectColorSelection.value = currentColor;
	// 	event.stopPropagation();
	// 	event.preventDefault();
	// } else {
		currentColor = color;
	// }
});



// for ( let i = 0; i < 20; i ++ ) {
// 	const x = THREE.MathUtils.randFloatSpread( 10 );
// 	const y = THREE.MathUtils.randFloatSpread( 10 );
// 	const circleGeom = new THREE.SphereGeometry(0.1);
// 	const circleMat = new THREE.MeshBasicMaterial( { color: 0x00303a});
// 	const circle = new THREE.Mesh( circleGeom, circleMat);
// 	circle.position.set(x, y, 0);
// 	scene.add(circle);
// 	circles.push(circle);
// 	// const x = THREE.MathUtils.randFloatSpread( 10 );
// 	// const y = THREE.MathUtils.randFloatSpread( 10 );
// 	// const z = THREE.MathUtils.randFloatSpread( 10 );
// 	// vertices.push( x, y, z );
// }

// const pointGeom = new THREE.BufferGeometry();
// pointGeom.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
// const pointMat = new THREE.PointsMaterial( { size: 0.2, color: 0x888888 } );
// const points = new THREE.Points( pointGeom, pointMat );
// scene.add( points );

// Attempting to draw circles/spheres.

// const circleGeom = new THREE.SphereGeometry( 0.1);
// const circleMat = new THREE.MeshBasicMaterial( { color: 0x00303a});
// const circle = new THREE.Mesh( circleGeom, circleMat);
// circle.position.set(10, 10, 0);
// scene.add(circle);

// Function for drawing circle at given position on canvas
const RED = 0xFF0000, BLUE = 0x0000FF, GREEN = 0x00FF00;


const drawCircle = (x: number, y: number, z: number) => {
	const circleGeom = new THREE.SphereGeometry(0.1);
	const color = currentColor === 'red' ? RED : (currentColor === 'blue' ? BLUE : GREEN);
	const circleMat = new THREE.MeshBasicMaterial( { color: color});
	const circle = new THREE.Mesh( circleGeom, circleMat);
	circle.position.set(x, y, z);
	scene.add(circle);
	circles.push(circle);
}

const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
	const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)]);
	const lineMat = new THREE.LineBasicMaterial({
		color: 0x000000,
		linewidth: 1,
		linecap: 'round',
		linejoin: 'round', 
	});
	const line = new THREE.Line(lineGeom, lineMat);
	scene.add(line);
	return line;
}

const bisects = (m: number, b: number, color: number) => {
	let above = 0, below = 0;
	const pointSet = circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === color);
	pointSet.forEach((circle) => {
		const y = circle.position.x * m + b;
		if(y < circle.position.y) below++;
		else if(y > circle.position.y) above++;
	});
	return below <= pointSet.length / 2 && above <= pointSet.length / 2;
}

const hamsandwich = () => {
	scene.remove(hamdSandwich.pop());
	const redCircles = circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === RED);
	const blueCircles = circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === BLUE);
	for(let i = 0; i < redCircles.length; i++) {
		for(let j = 0; j < blueCircles.length; j++) {
			const circle1 = redCircles[i];
			const circle2 = blueCircles[j];
			const x1 = circle1.position.x, y1 = circle1.position.y;
			const x2 = circle2.position.x, y2 = circle2.position.y;
			const m = (y2 - y1) / (x2 - x1);
			const b = y1 - m * x1;
			if(bisects(m, b, RED) && bisects(m, b, BLUE)) {
				const sx = -500, ex = 500;
				const sy = m * sx + b, ey = m * ex + b;
				hamdSandwich.push(drawLine(sx, sy, ex, ey));
				return;
			}
		}
	}
}




// Event listener for drawing circles on click
const canvas = document.querySelector('canvas')
let drag = false;

canvas.addEventListener('mousedown', (event) => {
	drag = false;
});

canvas.addEventListener('mousemove', (event) => {
	drag = true;
});



// const color2Closure = new Map();


// const ccwComparator = (a: THREE.Vector3, b: THREE.Vector3) => {
// 	if (a.x >= 0 && b.x < 0)
// 		return 1;
// 	if (a.x < 0 && b.x >= 0)
// 		return -1;
// 	if (a.x == 0 && b.x == 0) {
// 		if (a.y  >= 0 || b.y  >= 0)
// 			return a.y > b.y ? 1 : -1;
// 		return b.y > a.y ? 1 : -1;
// 	}
// 	// compute the cross product of vectors (center -> a) x (center -> b)
// 	const det = (a.x) * (b.y) - (b.x) * (a.y);
// 	if (det < 0)
// 		return 1;
// 	if (det > 0)
// 		return -1;
// 	// points a and b are on the same line from the center
// 	// check which point is closer to the center
// 	const d1 = (a.x) * (a.x) + (a.y) * (a.y);
// 	const d2 = (b.x) * (b.x) + (b.y) * (b.y);
// 	return d1 > d2 ? 1 : -1;
// }


canvas.addEventListener('mouseup', (event) => {
	if(!drag) {
		var vec = new THREE.Vector3();
		var pos = new THREE.Vector3();
		let targetZ = 0;
		// Gather z coordinate if we are viewing 3d mode
		// if(in3dMode) {
		// 	let response = Number(prompt("Enter the desired Z value for the circle center: "))
		// 	while(response === null || isNaN(response)) {
		// 		response = Number(prompt("Invalid input. Please enter a valid number: "));
		// 	}
		// 	targetZ = response;
		// }
		vec.set(
			( event.clientX / window.innerWidth ) * 2 - 1,
			- ( event.clientY / window.innerHeight ) * 2 + 1,
			0.5,
		);
		vec.unproject( camera );
		vec.sub( camera.position ).normalize();
		var distance = ( targetZ - camera.position.z ) / vec.z;
		pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
		drawCircle(pos.x, pos.y, pos.z);
		// const currentColorHexCode = currentColor === 'red' ? 0xFF0000 : (currentColor === 'blue' ? 0x0000FF : 0x00FF00);
		// const matchingPoints = circles.filter((circle) => {
		// 	return circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === currentColorHexCode;
		// });
		// if(matchingPoints.length > 2) {
			// console.log(matchingPoints.length);
			// const points = matchingPoints.map((circle) => circle.position);
			// sadly, this is not working as hoped ;'( (still should look into better convex closure displays bc current is scuffed)
			// let geometry = new THREE.Geometry()
			// let geometry = new THREE.BufferGeometry();
			// geometry.setFromPoints(points);
			// this is dispicable plz forgive me
			// const geometries = [];
			// Add all possible triangles geometries
			// for(let i = 0; i < points.length; i++){
			// 	for(let j = i + 1; j < points.length + i; j++){
			// 		for(let k = j + 1; k < points.length + j; k++){
			// 			const geometry = new THREE.BufferGeometry();
			// 			geometry.setFromPoints([points[i], points[j % points.length], points[k % points.length]]);
			// 			geometries.push(geometry);
			// 		}
			// 	}
			// }
			// Update the meshes with proper settings
			// const meshes = geometries.map((geometry) => {
			// 	const material = new THREE.MeshBasicMaterial({color: currentColorHexCode});
			// 	const mesh = new THREE.Mesh(geometry, material);
			// 	return mesh;
			// });
			// Remove old meshes
			// if(color2Closure.has(currentColor)) {
			// 	color2Closure.get(currentColor).forEach((mesh: any) => {
			// 		scene.remove(mesh);
			// 	});
			// }
			// Store the new ones and add to screen
			// color2Closure.set(currentColor, meshes);
			// meshes.forEach((mesh) => {
			// 	scene.add(mesh);
			// });
			// TODO: probably want the math for the cut here
		// }

		hamsandwich();

	}
});