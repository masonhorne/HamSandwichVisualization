import * as THREE from 'three';
import { BLUE, drawLine, drawPerimeter, EPSILON, GREEN, RED, sleep } from './utils';
// Algorithms need to provide a cut and hamsandwich function in order to be used in App
export type Algorithm = {
    cut: any,
    reset: (scene: THREE.Scene) => void,
    hamsandwich: (redCircles: THREE.Vector3[], blueCircles: THREE.Vector3[], scene: THREE.Scene) => Promise<void>,
    // This allows helper functions on the objects
    [key: string]: any,
}

let t: any = undefined;
export const ALGORITHMS: Record<string, Algorithm> = {
    POINT_HAMSANDWICH: {
        cut: undefined,
        reset(scene: THREE.Scene) {
            scene.remove(this.cut);
            this.cut = undefined;
        },
        generalBisector: (m: number, b: number, pointSet: THREE.Vector3[]) => {
            let above = 0, below = 0;
            pointSet.forEach((circle: any) => {
                const y = circle.x * m + b;
                // Use epsilon to avoid floating point errors
                if(Math.abs(circle.y - y) < EPSILON) return;
                if(y < circle.y) below++;
                else if(y > circle.y) above++;
            });
            return below <= pointSet.length / 2 && above <= pointSet.length / 2;
        },
        verticalBisector: (x: number, pointSet: THREE.Vector3[]) => {
            let left = 0, right = 0;
            pointSet.forEach((circle: THREE.Vector3) => {
                // Use epsilon to avoid floating point errors
                if(Math.abs(circle.x - x) < EPSILON) return;
                if(circle.x < x) left++;
                else if (circle.x > x) right++;
            });
            return left <= pointSet.length / 2 && right <= pointSet.length / 2;
        },
        async hamsandwich(redCircles: THREE.Vector3[], blueCircles: THREE.Vector3[], scene: THREE.Scene) {
            // Reset previous cut if present
            this.reset(scene);
            for(let i = 0; i < redCircles.length && this.cut === undefined; i++) {
                for(let j = 0; j < blueCircles.length && this.cut === undefined; j++) {
                    // Calculate the slope and y-intercept of the bisector
                    const circle1 = redCircles[i];
                    const circle2 = blueCircles[j];
                    const x1 = circle1.x, y1 = circle1.y;
                    const x2 = circle2.x, y2 = circle2.y;
                    const m = (y2 - y1) / (x2 - x1);
                    const b = y1 - m * x1;
                    // Draw candidate line for bisector based on case
                    const sx = x1 === x2 ? x1 : -500, ex = x1 === x2 ? x1 : 500;
                    const sy = x1 === x2 ? -500 : m * sx + b, ey = x1 === x2 ? 500 : m * ex + b;
                    const candidateLine = drawLine(sx, sy, ex, ey);
                    scene.add(candidateLine);
                    // Check if candidate is a valid ham sandwich cut
                    if((x1 === x2 && this.verticalBisector(x1, redCircles) && this.verticalBisector(x1, blueCircles)) || 
                        (x1 !== x2 && this.generalBisector(m, b, redCircles) && this.generalBisector(m, b, blueCircles))
                    ) {
                        this.cut = drawLine(sx, sy, ex, ey, GREEN);
                        scene.add(this.cut);
                    }
                    await sleep(1000);
                    // Remove the current candidate line
                    scene.remove(candidateLine);
                }
            }
        }
    },
    PERIMETER_HAMSANDWICH: {
        cut: undefined,
        blueBoundary: undefined,
        redBoundary: undefined,
        reset(scene: THREE.Scene) {
            scene.remove(this.cut);
            this.cut = undefined;
            scene.remove(this.blueBoundary);
            this.blueBoundary = undefined;
            scene.remove(this.redBoundary);
            this.redBoundary = undefined;
        },
        async hamsandwich(redCircles: THREE.Vector3[], blueCircles: THREE.Vector3[], scene: THREE.Scene) {
            // Reset previous cut if present
            this.reset(scene);
            const redHull = this.getConvexHull(redCircles);
            const blueHull = this.getConvexHull(blueCircles);
            this.redBoundary = drawPerimeter(redHull, RED);
            this.blueBoundary = drawPerimeter(blueHull, BLUE);
            scene.add(this.redBoundary);
            scene.add(this.blueBoundary);
        },

        isCounterClockwise(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
            const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y);
            return crossProduct > 0;
        },

        computePerimeter(convexHull: THREE.Vector3[]) {
            let perimeter = 0;
            for (let i = 0; i < convexHull.length; i++) {
                const p1 = convexHull[i];
                const p2 = convexHull[(i + 1) % convexHull.length];
                perimeter += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            }
            return perimeter;
        },

        getConvexHull(pointSet: THREE.Vector3[]) {
            if(pointSet.length < 1) return [];
            const lowestPoint = pointSet.reduce((minPoint: THREE.Vector3, currentPoint: THREE.Vector3) => {
                if (currentPoint.y < minPoint.y || 
                    (currentPoint.y === minPoint.y && currentPoint.x < minPoint.x)) {
                    return currentPoint;
                }
                return minPoint;
            });
            const sortedPoints = pointSet.slice().sort((a: THREE.Vector3, b: THREE.Vector3) => {
                const angleA = Math.atan2(a.y - lowestPoint.y, a.x - lowestPoint.x);
                const angleB = Math.atan2(b.y - lowestPoint.y, b.x - lowestPoint.x);
                return angleA - angleB;
            });
            const stack: THREE.Vector3[] = [];
            for (let i = 0; i < sortedPoints.length; i++) {
                while (stack.length >= 2 && !this.isCounterClockwise(stack[stack.length - 2], stack[stack.length - 1], sortedPoints[i])) {
                    stack.pop();
                }
                stack.push(sortedPoints[i]);
            }
            return stack;
        },
    },
}