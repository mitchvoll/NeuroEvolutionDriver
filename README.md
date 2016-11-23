# CISC452

The track is built using the [phaser game engine](https://phaser.io/). The project is setup with a node server that allows for genomes to be loaded and saved. 

The important files and directories are explained here:
- **index.html**: All js assets are loaded here.
- **public/js/environment.js**: This is the main file and contains all of the game code as well as the code that drives the NN. 
- **public/js/NNDriver.js**: This contains all of the code for the genetic neural net.
- **public/genomes/**: This directory contains all saved generations of genomes 
- This contains a file **public/genomes/generation500.json**. This generation will complete the track with a near-optimal driving line
- **public/assets/**: All game assets are contained in this directory

## Running the environment
Node must be install on your system first
```
# install dependencies
npm install
# run server
node index.js
```
Then just open up a browser to `localhost:3000`.
