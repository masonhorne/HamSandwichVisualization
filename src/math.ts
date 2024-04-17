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


    PERIMETER_HAMSANDWICH: {
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
            const intersections: THREE.Vector3[] = [];
            for (let i = 0; i < hull.length; i++) {
                const p1 = hull[i];
                const p2 = hull[(i + 1) % hull.length];
                const intersection = this.findIntersection(m, b, p1, p2);
                if(firstHull) hull1.push(p1);
                else hull2.push(p1);
                if(intersection) {
                    intersections.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    hull1.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    hull2.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    firstHull = !firstHull;
                }
            }
            if(intersections.length < 2) return [undefined, undefined];
            const p = intersections[0].x < intersections[1].x ? intersections[0] : intersections[1];
            const q = p === intersections[0] ? intersections[1] : intersections[0];
            const hullOneIdentifier = hull1.filter((point) => {
                return (point.x !== intersections[0].x && point.y !== intersections[0].y) || (point.x !== intersections[1].x && point.y !== intersections[1].y);
            })[0];
            // [Upper Hull, Lower Hull]
            if(this.isCounterClockwise(p, q, hullOneIdentifier)) return [hull1, hull2];
            else return [hull2, hull1];
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
            let prevLeft = undefined, prevRight = undefined;
            while(!(prevLeft == left && prevRight == right) && left < right) {
                const mid = left + (right - left) / 2;
                const [hull1, hull2] = this.splitHull(pointSet, slope, mid);
                if(hull1 === undefined || hull2 === undefined) return mid;
                const perimeter1 = this.computePerimeter(hull1);
                const perimeter2 = this.computePerimeter(hull2);
                if(perimeter1 <= (1 + EPSILON) * perimeter2 && perimeter2 <= (1 + EPSILON) * perimeter1) return mid;
                prevLeft = left, prevRight = right;
                if(perimeter1 > perimeter2) left = mid;
                else right = mid;
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
            this.reset(scene);
            // Calculate the initial distance between the bisectors
            let lineOneYIntercept = this.bisect(redCircles, 0);
            let lineTwoYIntercept = this.bisect(blueCircles, 0);
            let currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, 0);
            // Initialize result to store values and a flag to track improvement
            let result = [-1, undefined, undefined];
            // Iterate over all values of theta for slope
            for(let theta = 0; theta < 180; theta += 0.1){
                // Calculate the slop and draw the two lines that bisect the point sets
                const m = Math.sin(theta * Math.PI / 180) / Math.cos(theta * Math.PI / 180);
                let lineOneYIntercept = this.bisect(redCircles, m);
                let lineTwoYIntercept = this.bisect(blueCircles, m);
                this.cut = drawLine(-500, m * -500 + lineOneYIntercept, 500, m * 500 + lineOneYIntercept, RED);
                this.cut2 = drawLine(-500, m * -500 + lineTwoYIntercept, 500, m * 500 + lineTwoYIntercept, BLUE);
                scene.add(this.cut);
                scene.add(this.cut2);
                this.redBoundary = drawPerimeter(redHull, RED);
                this.blueBoundary = drawPerimeter(blueHull, BLUE);
                scene.add(this.redBoundary);
                scene.add(this.blueBoundary);
                // Calculate the distance between the two bisectors
                currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, m);
                // Update the result if the current distance is less than the previous best
                if(result[0] === -1 || currentDistance < result[0]){
                    result = [currentDistance, m, lineOneYIntercept];
                } 
                await sleep(0.1);
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
    AREA_HAMSANDWICH: {
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
            const intersections: THREE.Vector3[] = [];
            for (let i = 0; i < hull.length; i++) {
                const p1 = hull[i];
                const p2 = hull[(i + 1) % hull.length];
                const intersection = this.findIntersection(m, b, p1, p2);
                if(firstHull) hull1.push(p1);
                else hull2.push(p1);
                if(intersection) {
                    intersections.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    hull1.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    hull2.push(new THREE.Vector3(intersection.x, intersection.y, 0));
                    firstHull = !firstHull;
                }
            }
            if(intersections.length < 2) return [undefined, undefined];
            const p = intersections[0].x < intersections[1].x ? intersections[0] : intersections[1];
            const q = p === intersections[0] ? intersections[1] : intersections[0];
            const hullOneIdentifier = hull1.filter((point) => {
                return (point.x !== intersections[0].x && point.y !== intersections[0].y) || (point.x !== intersections[1].x && point.y !== intersections[1].y);
            })[0];
            // [Upper Hull, Lower Hull]
            if(this.isCounterClockwise(p, q, hullOneIdentifier)) return [hull1, hull2];
            else return [hull2, hull1];
        },

        computeArea(convexHull: THREE.Vector3[]) {
            let area = 0;
            for (let i = 0; i < convexHull.length; i++) {
                const p1 = convexHull[i];
                const p2 = convexHull[(i + 1) % convexHull.length];
                area += p1.x * p2.y - p2.x * p1.y;
            }
            return Math.abs(area) / 2;
        },
        bisect(pointSet: THREE.Vector3[], slope: number) {
            // Calculate the y intercepts for all points
            const YIntercepts = pointSet.map((circle: THREE.Vector3) => circle.y - (circle.x * slope));
            let left = YIntercepts.reduce((a, b) => Math.min(a, b));
            let right = YIntercepts.reduce((a, b) => Math.max(a, b));
            let prevLeft = undefined, prevRight = undefined;
            while(!(prevLeft == left && prevRight == right) && left < right) {
                const mid = left + (right - left) / 2;
                const [hull1, hull2] = this.splitHull(pointSet, slope, mid);
                if(hull1 === undefined || hull2 === undefined) return mid;
                const perimeter1 = this.computeArea(hull1);
                const perimeter2 = this.computeArea(hull2);
                if(perimeter1 <= (1 + EPSILON) * perimeter2 && perimeter2 <= (1 + EPSILON) * perimeter1) return mid;
                prevLeft = left, prevRight = right;
                if(perimeter1 > perimeter2) left = mid;
                else right = mid;
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
            this.reset(scene);
            // Calculate the initial distance between the bisectors
            let lineOneYIntercept = this.bisect(redCircles, 0);
            let lineTwoYIntercept = this.bisect(blueCircles, 0);
            let currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, 0);
            // Initialize result to store values and a flag to track improvement
            let result = [-1, undefined, undefined];
            // Iterate over all values of theta for slope
            for(let theta = 0; theta < 180; theta += 0.1){
                // Calculate the slop and draw the two lines that bisect the point sets
                const m = Math.sin(theta * Math.PI / 180) / Math.cos(theta * Math.PI / 180);
                let lineOneYIntercept = this.bisect(redCircles, m);
                let lineTwoYIntercept = this.bisect(blueCircles, m);
                this.cut = drawLine(-500, m * -500 + lineOneYIntercept, 500, m * 500 + lineOneYIntercept, RED);
                this.cut2 = drawLine(-500, m * -500 + lineTwoYIntercept, 500, m * 500 + lineTwoYIntercept, BLUE);
                scene.add(this.cut);
                scene.add(this.cut2);
                this.redBoundary = drawPerimeter(redHull, RED);
                this.blueBoundary = drawPerimeter(blueHull, BLUE);
                scene.add(this.redBoundary);
                scene.add(this.blueBoundary);
                // Calculate the distance between the two bisectors
                currentDistance = this.distance(lineOneYIntercept, lineTwoYIntercept, m);
                // Update the result if the current distance is less than the previous best
                if(result[0] === -1 || currentDistance < result[0]){
                    result = [currentDistance, m, lineOneYIntercept];
                } 
                await sleep(0.1);
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
}