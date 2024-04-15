import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


class App {
    private controls: OrbitControls;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private circles: THREE.Mesh[] = [];
    private cut: THREE.Line;
    private RED: number = 0xbf212f;
    private BLUE: number = 0x264b96;
    private GREEN: number = 0x27b376;
    private WHITE: number = 0xFFFFFF;
    private EPSILON: number = 1e-3;
    private currentColor: string = 'red';
    private drag: boolean = false;

    constructor() {
        // Initialize scene for drawing and orbit controls
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );
        this.scene.background = new THREE.Color(this.WHITE);
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        // Run other initialization functions for app performance
        this.controlsInit();
        this.gridInit();
        this.resetButtonInit();
        this.colorSelectorInit();
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
        // Event listener for drawing circles on click
        const canvas = document.querySelector('canvas')
        canvas.addEventListener('mousedown', (event) => {
            this.drag = false;
            prevX = event.clientX;
            prevY = event.clientY;
        });
        canvas.addEventListener('mousemove', (event) => {
            this.drag = event.clientX - prevX > this.EPSILON || event.clientY - prevY > this.EPSILON;
        });
        canvas.addEventListener('mouseup', (event) => {
            prevX = 0, prevY = 0;
            if(!this.drag) {
                // Calculate normalized device coordinates (NDC) from mouse position
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                // Update the raycaster with the NDC and camera
                raycaster.setFromCamera(mouse, this.camera);
                // Calculate the intersection of the raycaster with the scene
                const intersects = raycaster.intersectObjects(this.scene.children);
                if (intersects.length > 0) {
                    // The first intersection point will be the click location in world coordinates
                    const clickLocation = intersects[0].point;
                    this.drawCircle(clickLocation.x, clickLocation.y, 0);
                    this.hamsandwich();
                }
            }
        });
    }

    private resetButtonInit() {
        // Get the reset button
        const resetButton: any = document.getElementById('reset');
        // Add the event listener to reset scene to default state
        resetButton.addEventListener('click', () => {
            this.circles.forEach((circle) => {
                this.scene.remove(circle);
            });
            this.circles.length = 0;
            this.scene.remove(this.cut);
            this.cut = undefined;
            this.controlsInit();
        });
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

    private controlsInit() {
        // Reset camera and controls to default state
        this.controls.reset();
        this.controls.zoomToCursor = true;
        this.controls.enableRotate = false;
        this.controls.minZoom = 30;
        this.controls.maxZoom = 100;
        this.camera.position.z = 20;
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

    drawLine = (x1: number, y1: number, x2: number, y2: number, color = 0x000000) => {
        const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)]);
        const lineMat = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 4,
            linecap: 'round',
            linejoin: 'round', 
        });
        const line = new THREE.Line(lineGeom, lineMat);
        this.scene.add(line);
        return line;
    }

    drawCircle = (x: number, y: number, z: number, r: number = 0.2) => {
        const circleGeom = new THREE.SphereGeometry(r);
        const color = this.currentColor === 'red' ? this.RED : (this.currentColor === 'blue' ? this.BLUE : this.GREEN);
        const circleMat = new THREE.MeshBasicMaterial( { color: color});
        const circle = new THREE.Mesh( circleGeom, circleMat);
        circle.position.set(x, y, z);
        this.scene.add(circle);
        this.circles.push(circle);
    }

    generalBisector = (m: number, b: number, color: number) => {
        let above = 0, below = 0;
        const pointSet = this.circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === color);
        pointSet.forEach((circle) => {
            const y = circle.position.x * m + b;
            // Use epsilon to avoid floating point errors
            if(Math.abs(circle.position.y - y) < this.EPSILON) return;
            if(y < circle.position.y) below++;
            else if(y > circle.position.y) above++;
        });
        return below <= pointSet.length / 2 && above <= pointSet.length / 2;
    }

    verticalBisector = (x: number, color: number) => {
        let left = 0, right = 0;
        const pointSet = this.circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === color);
        pointSet.forEach((circle) => {
            // Use epsilon to avoid floating point errors
            if(Math.abs(circle.position.x - x) < this.EPSILON) return;
            if(circle.position.x < x) left++;
            else if (circle.position.x > x) right++;
        });
        return left <= pointSet.length / 2 && right <= pointSet.length / 2;
    }

    private async hamsandwich() {
        // Reset previous cut if present
        this.scene.remove(this.cut);
        this.cut = undefined;
        // Find the red and blue pointset
        const redCircles = this.circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === this.RED);
        const blueCircles = this.circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === this.BLUE);
        // Iterate through all combinations of points
        for(let i = 0; i < redCircles.length && this.cut === undefined; i++) {
            for(let j = 0; j < blueCircles.length && this.cut === undefined; j++) {
                // Calculate the slope and y-intercept of the bisector
                const circle1 = redCircles[i];
                const circle2 = blueCircles[j];
                const x1 = circle1.position.x, y1 = circle1.position.y;
                const x2 = circle2.position.x, y2 = circle2.position.y;
                const m = (y2 - y1) / (x2 - x1);
                const b = y1 - m * x1;
                // Draw candidate line for bisector based on case
                const sx = x1 === x2 ? x1 : -500, ex = x1 === x2 ? x1 : 500;
                const sy = x1 === x2 ? -500 : m * sx + b, ey = x1 === x2 ? 500 : m * ex + b;
                const candidate = this.drawLine(sx, sy, ex, ey);
                // Check if candidate is a valid ham sandwich cut
                if((x1 === x2 && this.verticalBisector(x1, this.RED) && this.verticalBisector(x1, this.BLUE)) || (x1 !== x2 && this.generalBisector(m, b, this.RED) && this.generalBisector(m, b, this.BLUE))) this.cut = this.drawLine(sx, sy, ex, ey, this.GREEN);
                // If no cut, wait 1 second to display candidate briefly
                if(!this.cut) await this.sleep(1000);
                // Remove the current candidate line
                this.scene.remove(candidate);
            }
        }
    }

    // Sleep helper for animating candidate lines
    sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))
}

const app = new App();