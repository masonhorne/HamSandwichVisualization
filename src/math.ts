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
        cut2: undefined,
        reset(scene: THREE.Scene) {
            scene.remove(this.cut);
            this.cut = undefined;
            scene.remove(this.cut2);
            this.cut2 = undefined;
        },
        bisect(pointSet: THREE.Vector3[], slope: number) {
            // Calculate the y intercepts for all points
            const YIntercepts = pointSet.map((circle: THREE.Vector3) => circle.y - (circle.x * slope));
            // Sort them
            const sortedYIntercepts = YIntercepts.sort((a, b) => a - b);
            // Return the median point
            return sortedYIntercepts[Math.floor(sortedYIntercepts.length / 2)];
        },
        distance(b1: number, b2: number, slope: number) {
            // Calculate the x position of the intersection
            const x = (b2 - b1) / (slope + (1 / slope));
            // Calculate the y position of the intersection
            const y = slope * x + b2;
            // Calculate the distance between the two points and return
            const x1 = 0, y1 = b1, x2 = x, y2 = y;
            return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        },
        async hamsandwich(redCircles: THREE.Vector3[], blueCircles: THREE.Vector3[], scene: THREE.Scene) {
            // Reset the scene for drawing the cuts
            this.reset(scene);
            // Skip when either set is empty
            if(redCircles.length === 0 || blueCircles.length === 0) return;
            // Calculate the initial distance between the bisectors
            let lineOneYIntercept = this.bisect(redCircles, 0);
            let lineTwoYIntercept = this.bisect(blueCircles, 0);
            let currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, 0);
            // Initialize result to store values and a flag to track improvement
            let result = [-1, undefined, undefined];
            // Iterate over all values of theta for slope
            for(let theta = 0; theta < 180; theta++){
                // Calculate the slop and draw the two lines that bisect the point sets
                const m = Math.sin(theta * Math.PI / 180) / Math.cos(theta * Math.PI / 180);
                let lineOneYIntercept = this.bisect(redCircles, m);
                let lineTwoYIntercept = this.bisect(blueCircles, m);
                this.cut = drawLine(-500, m * -500 + lineOneYIntercept, 500, m * 500 + lineOneYIntercept, RED);
                this.cut2 = drawLine(-500, m * -500 + lineTwoYIntercept, 500, m * 500 + lineTwoYIntercept, BLUE);
                scene.add(this.cut);
                scene.add(this.cut2);
                // Calculate the distance between the two bisectors
                currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, m);
                // Update the result if the current distance is less than the previous best
                if(result[0] === -1 || currentDistance < result[0]){
                    result = [currentDistance, m, lineOneYIntercept];
                } 
                await sleep(1);
                this.reset(scene);
            }
            // Draw the optimal cut
            this.cut = drawLine(-500, result[1] * -500 + result[2], 500, result[1] * 500 + result[2], GREEN);
            scene.add(this.cut);
        }
    },
    NAIVE_POINT_HAMSANDWICH: {
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


    NEW_PERIMETER_HAMSANDWICH: {
        cut: undefined,
        cut2: undefined,
        blueBoundary: undefined,
        redBoundary: undefined,
        reset(scene: THREE.Scene) {
            scene.remove(this.cut);
            this.cut = undefined;
            scene.remove(this.cut2);
            this.cut2 = undefined;
            scene.remove(this.blueBoundary);
            this.blueBoundary = undefined;
            scene.remove(this.redBoundary);
            this.redBoundary = undefined;
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
        splitHull(hull: THREE.Vector3[], m: number, b: number) {
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
            return [hull1, hull2];
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
        bisect(pointSet: THREE.Vector3[], slope: number) {
            // Calculate the y intercepts for all points
            const YIntercepts = pointSet.map((circle: THREE.Vector3) => circle.y - (circle.x * slope));
            let left = YIntercepts.reduce((a, b) => Math.min(a, b));
            let right = YIntercepts.reduce((a, b) => Math.max(a, b));
            while(Math.abs(left - right) > EPSILON) {
                const mid = left + (right - left) / 2;
                console.log(Math.abs(left - right) < EPSILON)
                console.log(left, right, mid);
                const [hull1, hull2] = this.splitHull(pointSet, slope, mid);
                const perimeter1 = this.computePerimeter(hull1);
                const perimeter2 = this.computePerimeter(hull2);
                if(Math.abs(perimeter1 - perimeter2) < EPSILON) return mid;
                if(perimeter1 <= perimeter2) right = mid;
                else left = mid;
            }
            return left;
        },
        distance(b1: number, b2: number, slope: number) {
            // Calculate the x position of the intersection
            const x = (b2 - b1) / (slope + (1 / slope));
            // Calculate the y position of the intersection
            const y = slope * x + b2;
            // Calculate the distance between the two points and return
            const x1 = 0, y1 = b1, x2 = x, y2 = y;
            return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        },
        isCounterClockwise(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
            const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y);
            return crossProduct > 0;
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
        async hamsandwich(redCircles: THREE.Vector3[], blueCircles: THREE.Vector3[], scene: THREE.Scene) {
            // Reset the scene for drawing the cuts
            this.reset(scene);
            const redHull = this.getConvexHull(redCircles);
            const blueHull = this.getConvexHull(blueCircles);
            this.redBoundary = drawPerimeter(redHull, RED);
            this.blueBoundary = drawPerimeter(blueHull, BLUE);
            scene.add(this.redBoundary);
            scene.add(this.blueBoundary);
            // Skip when either set is empty
            if(redCircles.length === 0 || blueCircles.length === 0) return;
            // Calculate the initial distance between the bisectors
            let lineOneYIntercept = this.bisect(redCircles, 0);
            let lineTwoYIntercept = this.bisect(blueCircles, 0);
            console.log(lineOneYIntercept, lineTwoYIntercept)
            let currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, 0);
            // Initialize result to store values and a flag to track improvement
            let result = [-1, undefined, undefined];
            // let currentlyImproving = false, hasImproved = false;
            // Iterate over all values of theta for slope
            for(let theta = 0; theta < 180; theta++){
                // Update whether or not we have improved
                // hasImproved = hasImproved || currentlyImproving;
                // Calculate the slop and draw the two lines that bisect the point sets
                const m = Math.sin(theta * Math.PI / 180) / Math.cos(theta * Math.PI / 180);
                console.log(theta);
                let lineOneYIntercept = this.bisect(redCircles, m);
                let lineTwoYIntercept = this.bisect(blueCircles, m);
                this.cut = drawLine(-500, m * -500 + lineOneYIntercept, 500, m * 500 + lineOneYIntercept, RED);
                this.cut2 = drawLine(-500, m * -500 + lineTwoYIntercept, 500, m * 500 + lineTwoYIntercept, BLUE);
                scene.add(this.cut);
                scene.add(this.cut2);
                // Calculate the distance between the two bisectors
                currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, m);
                // Update the result if the current distance is less than the previous best
                if(result[0] === -1 || currentDistance < result[0]){
                    // if(result[0] !== -1) currentlyImproving = true;
                    result = [currentDistance, m, lineOneYIntercept];
                } 
                await sleep(1);
                this.reset(scene);
            }
            this.redBoundary = drawPerimeter(redHull, RED);
            this.blueBoundary = drawPerimeter(blueHull, BLUE);
            scene.add(this.redBoundary);
            scene.add(this.blueBoundary);
            // Draw the optimal cut
            this.cut = drawLine(-500, result[1] * -500 + result[2], 500, result[1] * 500 + result[2], GREEN);
            scene.add(this.cut);
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



            const pointOne = this.getCentroid(redHull);
            const pointTwo = this.getCentroid(blueHull);

            const basis = pointTwo.clone().sub(pointOne).normalize();
            basis.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);

            // let currentLine = this.getLineConstants(pointOne, pointTwo);
            // while(this.getImbalance(redHull, currentLine[0], currentLine[1]) > EPSILON || this.getImbalance(blueHull, currentLine[0], currentLine[1]) > EPSILON) {
            //     while(this.getImbalance(redHull, currentLine[0], currentLine[1]) > EPSILON) {
            //         const newPointOne = pointOne.clone().add(basis);

            //         // pointOne.add(basis);
            //         // currentLine = this.getLineConstants(pointOne, pointTwo);
            //     }
            //     // const pointThree = pointOne.clone().add(pointTwo).divideScalar(2);
            //     // const pointFour = pointThree.clone().add(basis);
            //     // currentLine = this.getLineConstants(pointThree, pointFour);
            //     // console.log(this.getImbalance(redHull, currentLine[0], currentLine[1]), this.getImbalance(blueHull, currentLine[0], currentLine[1]));
            // }

            // console.log(basis);




            // // Skip undefined perimeters
            // if(redHull.length < 3 || blueHull.length < 3) return;
            // let [m, b] = this.bisector(redHull, blueHull);
            // this.cut = drawLine(-500, m * -500 + b, 500, m * 500 + b, GREEN);
            // // TODO: Iteratively update the cut to find the optimal ham sandwich cut (THIS IS BROKEN ATM)
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
            // scene.remove(this.cut);
            // this.cut = drawLine(-500, m * -500 + b, 500, m * 500 + b, GREEN);
            // scene.add(this.cut);
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

        getLineConstants(p1: THREE.Vector3, p2: THREE.Vector3) {
            const m = (p2.y - p1.y) / (p2.x - p1.x);
            const b = p1.y - m * p1.x;
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