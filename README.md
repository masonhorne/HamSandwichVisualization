# Ham Sandwich Theorem Visualization

##  About Ham Sandwich Cuts

Given two objects $A$ and $B$ in $\R^2$, a (2D-)ham sandwich cut is a line $l$ such that $A$ is bisected by $l$ and $B$ is bisected by $l$.


In this demonstration we include sets consisting of points, lines, or $2$-dimensional polytopes, although it is certainly possible to apply ham sandwich cuts to a broader class of objects.
In fact, Ham sandwich cuts can also be generalized to $d$ dimensions where $d$ objects are bisected by a hyperplane in $\R^d$, however in this application we limit ourselves to objects in $\R^2$.


Given a line $l$, and two point sets $A$ and $B$, one can determine if $l$ is a ham sandwich cut of $A$ and $B$ in linear time.
Therefore, a naive algorithm would be to try every line determined by a pair of points from $A\times B$.
This is worst-case cubic to compute.

Ham sandwich cuts of two finite point sets in the plane was solved optimally in $O(n)$ time by Lo et. al [1].
Their approach is to find a point in the dual setting that lies above and below at most half of the dual lines.

Ham sandwich cuts of the area of two non-intersecting polygons was solved optimally by Stojmenovic in 1991 [2].

**References**:

[1] Lo, C. Y., Matoušek, J., & Steiger, W. (1994). Algorithms for ham-sandwich cuts. Discrete & Computational Geometry, 11, 433-452.

[2] Stojmenovic, I. (1991). Bisections and ham-sandwich cuts of convex polygons and polyhedra. Inf. Process. Lett., 38(1), 15-21.

## Developer Instructions
1. Before beginning, make sure that your system has [NodeJS](https://nodejs.org/en) installed.
2. From the root of the project directory execute the following command to install project dependencies
    ```npm install```
3. Run the next command to have your updates made to `app.ts` compile on save
    ```npm run dev```


#### In order to host the environment locally, install the `live-server` VSCode extension and run `live-server` in the command line while the `index.html` file is open.
