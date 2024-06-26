import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ALGORITHMS, Algorithm } from './math';
import { BLUE, EPSILON, RED, WHITE, drawCircle } from './utils';

class App {
    private controls: OrbitControls;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private circles: THREE.Mesh[] = [];
    private currentColor: string = 'red';
    private drag: boolean = false;
    private currentAlgorithm: Algorithm;
    private runningAlgorithm: boolean = false;

    constructor() {
        // Initialize scene for drawing and orbit controls
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );
        this.scene.background = new THREE.Color(WHITE);
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        // Run other initialization functions for app performance
        this.controlsInit();
        this.gridInit();
        this.resetButtonInit();
        this.colorSelectorInit();
        this.algorithmSelectorInit();
        this.interactiveCanvasInit();
        this.windowResizeInit();
        // Begin animation of the app
        this.animate();
    }

    private animate = () => {
        requestAnimationFrame( this.animate );
        this.controls.update();
        this.renderer.render( this.scene, this.camera );
    }

    private windowResizeInit() {
        // Resize event listener for responsive canvas
        window.addEventListener('resize', () => {
            this.camera.left = -window.innerWidth / 2;
            this.camera.right = window.innerWidth / 2;
            this.camera.top = window.innerHeight / 2;
            this.camera.bottom = -window.innerHeight / 2;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    private interactiveCanvasInit() {
        // Variables for drag detection and click location
        let prevX = 0, prevY = 0;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const plane = new THREE.Plane();
        const planeNormal = new THREE.Vector3();
        const point = new THREE.Vector3();
        // Event listener for drawing circles on click
        const canvas = document.querySelector('canvas')
        canvas.addEventListener('mousedown', (event) => {
            this.drag = false;
            prevX = event.clientX;
            prevY = event.clientY;
        });
        canvas.addEventListener('mousemove', (event) => {
            this.drag = event.clientX - prevX > EPSILON || event.clientY - prevY > EPSILON;
        });
        canvas.addEventListener('mouseup', async (event) => {
            prevX = 0, prevY = 0;
            if(!this.drag && !this.runningAlgorithm) {
                const instructions = document.querySelector('#instructions');
                instructions.classList.add('hidden');
                // Use plan and camera position to find intersection of raycaster with drawing plane
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                planeNormal.copy(this.camera.position).normalize();
                plane.setFromNormalAndCoplanarPoint(planeNormal, this.scene.position);
                raycaster.setFromCamera(mouse, this.camera);
                // Draw the click location as a circle
                const clickLocation = raycaster.ray.intersectPlane(plane, point);
                const circle: THREE.Mesh = drawCircle(clickLocation.x, clickLocation.y, 0, 0.2, this.currentColor === 'red' ? RED : BLUE);
                this.scene.add(circle);
                this.circles.push(circle);
                this.runningAlgorithm = true;
                this.currentAlgorithm.hamsandwich(
                    this.circles.filter((circle) => circle instanceof THREE.Mesh && circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === RED).map((circle) => circle.position),
                    this.circles.filter((circle) => circle instanceof THREE.Mesh && circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === BLUE).map((circle) => circle.position),
                    this.scene
                ).then(() => this.runningAlgorithm = false);
            }
        });
    }

    private reset() {
        // Prevent reset while algorithm is running to avoid undefined behavior
        if(this.runningAlgorithm) return;
        this.circles.forEach((circle) => {
            this.scene.remove(circle);
        });
        this.circles.length = 0;
        this.currentAlgorithm.reset(this.scene);
        this.controlsInit();
    }

    private resetButtonInit() {
        // Get the reset button
        const resetButton: any = document.getElementById('reset');
        // Add the event listener to reset scene to default state
        resetButton.addEventListener('click', () => this.reset());
    }

    private colorSelectorInit() {
        // Get the color selector
        const objectColorSelection: any = document.getElementById('object-color');
        // Set values and event listener for swapping
        this.currentColor = 'red';
        objectColorSelection.value = this.currentColor;
        objectColorSelection.addEventListener('change', (event: Event) => {
            const color = (event.target as HTMLInputElement).value;
            this.currentColor = color;
        });
    }

    private algorithmSelectorInit() {
        // Get the color selector
        const algorithmSelection: any = document.getElementById('algorithm');
        // Set values and event listener for swapping
        algorithmSelection.value = 'points';
        this.currentAlgorithm = this.algorithmValueToFunction(algorithmSelection.value);
        algorithmSelection.addEventListener('change', (event: Event) => {
            this.currentAlgorithm.reset(this.scene);
            this.reset();
            const algorithm = (event.target as HTMLInputElement).value;
            this.currentAlgorithm = this.algorithmValueToFunction(algorithm);
        });
    }

    private algorithmValueToFunction(algorithm: string) {
        // Convert string value to algorithm function
        switch(algorithm) {
            case 'naive-points':
                return ALGORITHMS.NAIVE_POINT_HAMSANDWICH;
            case 'points':
                return ALGORITHMS.POINT_HAMSANDWICH;
            case 'area':
                return ALGORITHMS.AREA_HAMSANDWICH;
            case 'perimeter':
                return ALGORITHMS.PERIMETER_HAMSANDWICH;
            default:
                return ALGORITHMS.POINT_HAMSANDWICH;
        }
    }

    private controlsInit() {
        // Reset camera and controls to default state
        this.controls.reset();
        this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        this.controls.zoomToCursor = true;
        this.controls.minZoom = 25;
        this.camera.position.z = 25;
        this.camera.position.x = 0;
        this.camera.position.y = 0;
    }

    private gridInit() {
        // Grid Settings
        const size = 1000;
        const divisions = 1000;
        const axisColor = new THREE.Color(0x000000);
        const gridColor = new THREE.Color(0xD3D3D3);
        // 2D Grid Setup
        const gridHelper = new THREE.GridHelper( size, divisions, axisColor, gridColor );
        gridHelper.rotation.x = Math.PI / 2;
        this.scene.add( gridHelper );
    }
}

const app = new App();