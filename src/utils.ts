import * as THREE from 'three';
export const RED: number = 0xbf212f;
export const BLUE: number = 0x264b96;
export const GREEN: number = 0x27b376;
export const WHITE: number = 0xFFFFFF;
export const EPSILON: number = 1e-3;
export const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

export const drawPerimeter: (hull: THREE.Vector3[], color?: number) => THREE.LineLoop = (hull: THREE.Vector3[], color: number = 0x000000) =>{
    const convexHullGeometry = new THREE.BufferGeometry();
    convexHullGeometry.setFromPoints(hull);
    const material = new THREE.MeshBasicMaterial( { color: color } );
    return new THREE.LineLoop( convexHullGeometry, material );
}

export const drawLine: (x1: number, y1: number, x2: number, y2: number, color?: number) => THREE.Line = (x1: number, y1: number, x2: number, y2: number, color: number = 0x000000) => {
    const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)]);
    const lineMat = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 4,
        linecap: 'round',
        linejoin: 'round', 
    });
    const line = new THREE.Line(lineGeom, lineMat);
    return line;
}

export const drawCircle: (x: number, y: number, z: number, r?: number, color?: number) => THREE.Mesh = (x: number, y: number, z: number, r: number = 0.2, color: number = GREEN) => {
    const circleGeom = new THREE.SphereGeometry(r);
    const circleMat = new THREE.MeshBasicMaterial( { color: color});
    const circle = new THREE.Mesh( circleGeom, circleMat);
    circle.position.set(x, y, z);
    return circle;
}