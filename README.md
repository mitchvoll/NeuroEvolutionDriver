# CISC452

The track is built using the [phaser game engine](https://phaser.io/). The project is setup with a node server that allows for genomes to be loaded and saved. 

The important files and directories are explained here:
	- **index.html**: All js assets are loaded here.
	- **public/js/environment.ks**: This is the main file and contains all of the game code as well as the code that drives the NN. 
	- **public/js/NNDriver.js**: This contains all of the code for the genetic neural net.
	- **public/genomes/**: This directory contains all saved generations of genomes 
		- This contains a file **public/genomes/generation178.json** which is loaded by default. Genome 9 of this generation will complete the track without crashing. This file is loaded by default.
	- **public/assets/**: All game assets are contained in this directory

## TODO
- **Finding the the driving line**: Currently the car is able to navigate the track after enough generations of evolution (right around 150 generations) however with the fitness only measuring the distance the car travels there is no awareness of the driving line.
	A good way to start training the driving line would be to create a fitness score that combines the distance travelled and the lap time. The score could be computed as (the time takes to complete a lap or crash - totalDistanceLines*2 seconds). This way when training from a generation that already knows how to complete a lap, the evolution would converge on the genomes with a smaller lap time while taking into account how far that genome made it into the track in order to avoid rewarding a low lap time caused by an early crash. This method shouldn't take much effort to implement however it will require starting from a near-perfect generation otherwise training would take too long.  
- Should be rewritten to be oject-oriented so we're not polluting the global scope. This will make things easier when we need to implement the NN. 

## Running the environment
Node must be install on your system first
'''
# install dependencies
npm install
# run server
node index.js
'''
Then just open up a browser to `localhost:3000`.
