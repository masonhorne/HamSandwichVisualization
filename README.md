# Ham Sandwich Theorem Visualization

## Developer Instructions
1. Before beginning, make sure that your system has [NodeJS](https://nodejs.org/en) installed.
2. You will also need to install `browserify` as a global dependency with
    ```npm install browserify -g```
3. From the root of the project directory execute the command
    ```npm install```
4. After modifying the `script.ts` file, execute the following command to compile to JavaScript
    ```browserify script.ts -p [ tsify --noImplicitAny ] > script.js```



#### In order to host the environment locally, install the `live-server` VSCode extension and run `live-server` in the command line while the `index.html` file is open.