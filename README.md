# CISC452

The track is built using the [phaser game engine](https://phaser.io/). The main file is *public/index.html* and all of the assets are contained in *public/assets/*. The project is setup with a node server just to send file to the browser. The environment is mostly finished with the car being able to drive around the track and reset when it collides with the track boundaries but there's a couple things left to do that I've listed in the TODO section. 

Right now there are two main objects: the car and the track. Both of them have hitboxes that define their boundaries stored in the file *public/assets/collisions.json*. The way phaser works is that you create a game and define the following three functions: 
  - **preload():** this runs once and is where all assets are loaded
  - **create():** this also runs once and is where the game is initialized and objects are created.
  - **update():** this runs on a loop for every frame of the game is where the car's movement is updated. When we interface with our neural net it will drive the car from here.
  
## TODO
- - Need to keep track of distance. I was thinking there are two main ways we can keep track of distance:
  1. Just measure the total distance the car has traveled however this doesn't always measure how far into the track the car has gone.
  2. Have lines spaced out around the track and just count the number of lines the car has passed as a measure of distance. I personally think this is a better option however it might be a bit trickier to setup.
- Should be rewritten to be oject-oriented so we're not polluting the global scope. This will make things easier when we need to implement the NN. 
- Setup a simple NN

## Running the environment
If you have node installed then you can just run: `npm install` to install dependencies and then `node index.js` to run the server.
Then just open up a browser to `localhost:3000`.
