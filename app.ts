import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


class App {
    private controls: OrbitControls;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
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
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );
        this.scene.background = new THREE.Color(this.WHITE);
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controlsInit();
        this.gridInit();
        this.resetButtonInit();
        this.colorSelectorInit();
        this.interactiveCanvasInit();
        this.animate();
    }

    private animate = () => {
        requestAnimationFrame( this.animate );
        this.controls.update();
        this.renderer.render( this.scene, this.camera );
    }


    private interactiveCanvasInit() {
        let prevX = 0, prevY = 0;
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
                var vec = new THREE.Vector3();
                var pos = new THREE.Vector3();
                let targetZ = 0;
                vec.set(
                    ( event.clientX / window.innerWidth ) * 2 - 1,
                    - ( event.clientY / window.innerHeight ) * 2 + 1,
                    0.5,
                );
                vec.unproject( this.camera );
                vec.sub( this.camera.position ).normalize();
                var distance = ( targetZ - this.camera.position.z ) / vec.z;
                pos.copy( this.camera.position ).add( vec.multiplyScalar( distance ) );
                this.drawCircle(pos.x, pos.y, pos.z);
                this.hamsandwich();
            }
        });
    }

    private resetButtonInit() {
        const resetButton: any = document.getElementById('reset');
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
        const objectColorSelection: any = document.getElementById('object-color');
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
        this.controls.minDistance = 10.0;
        this.controls.maxDistance = 50.0;
        this.camera.position.z = 10;
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

    drawCircle = (x: number, y: number, z: number) => {
        const circleGeom = new THREE.SphereGeometry(0.1);
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
            if(Math.abs(circle.position.x - x) < this.EPSILON) return;
            if (circle.position.x < x) left++;
            else if (circle.position.x > x) right++;
        });
        return left <= pointSet.length / 2 && right <= pointSet.length / 2;
    }

    private async hamsandwich() {
        this.scene.remove(this.cut);
        this.cut = undefined;
        const redCircles = this.circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === this.RED);
        const blueCircles = this.circles.filter((circle) => circle.material instanceof THREE.MeshBasicMaterial && circle.material.color.getHex() === this.BLUE);
        for(let i = 0; i < redCircles.length && this.cut === undefined; i++) {
            for(let j = 0; j < blueCircles.length && this.cut === undefined; j++) {
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
                // If no cut, wait 1.5 seconds to display candidate briefly
                if(!this.cut) await this.sleep(1500);
                // Remove the current candidate line
                this.scene.remove(candidate);
            }
        }
    }

    sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))
}

const app = new App();