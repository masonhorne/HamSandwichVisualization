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
            // Skip undefined perimeters
            if(redHull.length < 3 || blueHull.length < 3) return;
            let [m, b] = this.bisector(redHull, blueHull);
            // this.cut = drawLine(-500, m * -500 + b, 500, m * 500 + b, GREEN);
            // TODO: Iteratively update the cut to find the optimal ham sandwich cut (THIS IS BROKEN ATM)
            // const maxIterations = 10000;
            // for(let i = 0; i < maxIterations; i++) {
            //     // Calculate imbalance of perimeters
            //     const imb1 = this.getImbalance(redHull, m, b);
            //     const imb2 = this.getImbalance(blueHull, m, b);
            //     console.log('red', imb1, 'blue', imb2)
            //     const imbalance = imb1 + imb2;
            //     // Converged
            //     if(imb1 < 1 && imb2 < 1) break;
            //     const delta = 10;
            //     const imb1m = this.getImbalance(redHull, m + delta, b);
            //     const imb1b = this.getImbalance(redHull, m, b + delta);
            //     const gradM1 = (imb1m - imb1) / delta;
            //     const gradB1 = (imb1b - imb1) / delta;
            //     m -= 0.1 * gradM1;
            //     b -= 0.1 * gradB1;
            //     const imb2m = this.getImbalance(blueHull, m + delta, b);
            //     const imb2b = this.getImbalance(blueHull, m, b + delta);
            //     const gradM2 = (imb2m - imb2) / delta;
            //     const gradB2 = (imb2b - imb2) / delta;
            //     m -= 0.1 * gradM2;
            //     b -= 0.1 * gradB2;

            //     // Update the bisecting line in the scene
            //     scene.remove(this.cut);
            //     this.cut = drawLine(-500, m * -500 + b, 500, m * 500 + b);
            //     scene.add(this.cut);
            //     // Await animation frame or sleep
            //     await sleep(1);
            // }
            // console.log(this.getImbalance(redHull, m, b), this.getImbalance(blueHull, m, b));
            scene.remove(this.cut);
            this.cut = drawLine(-500, m * -500 + b, 500, m * 500 + b, GREEN);
            scene.add(this.cut);
        },

        getImbalance(hull: THREE.Vector3[], m: number, b: number) {
            const hull1 = [], hull2 = [];
            let firstHull = true;
            for (let i = 0; i < hull.length; i++) {
                const p1 = hull[i];
                const p2 = hull[(i + 1) % hull.length];
                const intersection = this.findIntersection(m, b, p1, p2);
                if(firstHull) hull1.push(p1);
                else hull2.push(p1);
                if(intersection) {
                    hull1.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    hull2.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    firstHull = !firstHull;
                }
            }
            if(hull1.length < 3 || hull2.length < 3) {
                console.log('error computing split hull');
                return 1e5;
            }
            const perimeter1 = this.computePerimeter(hull1);
            const perimeter2 = this.computePerimeter(hull2);
            return Math.abs(perimeter1 - perimeter2);
        },

        findIntersection(m: number, b: number, p1: THREE.Vector3, p2: THREE.Vector3) {
            const { x: x1, y: y1 } = p1;
            const { x: x2, y: y2 } = p2;
            // Slope and y-intercept of the line segment
            const segmentSlope = (y2 - y1) / (x2 - x1);
            const segmentIntercept = y1 - segmentSlope * x1;
            // Calculate the x-coordinate of the intersection point
            const xIntersect = (segmentIntercept - b) / (m - segmentSlope);
            // Check if the intersection point is within the range of the line segment
            if (xIntersect < Math.min(x1, x2) || xIntersect > Math.max(x1, x2)) {
                return null; // No intersection within the range of the line segment
            }
            // Calculate the y-coordinate of the intersection point
            const yIntersect = m * xIntersect + b;
            return { x: xIntersect, y: yIntersect };
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

        bisector(convexHull1: THREE.Vector3[], convexHull2: THREE.Vector3[]) {
            // Get the centroids of the convex hulls
            const centroid1 = this.getCentroid(convexHull1);
            const centroid2 = this.getCentroid(convexHull2);
            // Calculate the slope of the line passing through the centroids
            const m = (centroid2.y - centroid1.y) / (centroid2.x - centroid1.x);
            // Calculate the y-intercept of the line passing through the centroids
            const b = centroid1.y - m * centroid1.x;
            return [m, b];
        },

        getCentroid(points: THREE.Vector3[]) {
            const centroid = new THREE.Vector3();
            points.forEach(point => centroid.add(point));
            centroid.divideScalar(points.length);
            return centroid;
        }
    },
}