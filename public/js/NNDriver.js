var Architect = synaptic.Architect;
var Network = synaptic.Network;

var NN = {
	genomes: [], // Array of ANNs that make up the genomes
	// the current genome and generation
	genome: 0,
	generation: 0,
};

NN.init = function(inputs, outputs, numGenomes, selection){
	// initialize genomes
	while (NN.genomes.length < numGenomes)
		NN.genomes.push( new Architect.Perceptron(inputs, 4, 4, outputs) );
	NN.numGenomes = numGenomes;
	NN.selection = selection;
	NN.mutationProp = 0.2;
}

NN.activate = function(sensorData){
	// get output for sensor inputs
	var output = NN.genomes[NN.genome].activate([
		sensorData.sensor1.d,
		sensorData.sensor2.d,
		sensorData.sensor3.d
	]);
	return output;
}

NN.advanceGenome = function(fitness){
	NN.genomes[NN.genome].fitness = fitness; // assign fitness
	NN.genome++; // advance genome
	if (NN.genome > NN.numGenomes-1){
		console.log("next generation");
		NN.createNextGeneration();
	} // next generation
}

NN.createNextGeneration = function(){
	NN.generation++; // advance generation
	NN.genome = 0; // reset current genome

	// kill worst genomes and copy the best for crossover
	NN.genomes = NN.getBestGenomes(NN.selection);
	var bestGenomes = _.clone(NN.genomes);

	// peform the crossover and mutation by selecting two random genomes
	// from the best selection and add this new genome to the generation
	// until there are numGenomes - 2 remaining
	while (NN.genomes.length < NN.numGenomes - 2){
		// select two random genomes
		var genome1 = _.sample(bestGenomes).toJSON();
		var genome2 = _.sample(bestGenomes).toJSON();
		 
		// cross over the two randomly selected genomes
		var crossOver = NN.crossOver(genome1, genome2);
		// mutate using the new genome created from the crossover
		var mutatedGenome = NN.mutate(crossOver);
		NN.genomes.push(Network.fromJSON(mutatedGenome)); // add to next generation
	}

	// perform just the mutation for the remaining two genomes 
	while (NN.genomes.length < NN.numGenomes){
		var genome = _.sample(bestGenomes).toJSON(); // get random genome
		NN.genomes.push( Network.fromJSON(NN.mutate(genome)) ); // mutate and add to next generation
	}
}

// return the best n genomes by deleting the worst
NN.getBestGenomes = function(n){
	var genomes = _.sortBy(NN.genomes, 'fitness').reverse();// sort genomes on fitness
	while (genomes.length > n)
		genomes.pop();

	return genomes;
}

// performs random mutations of biases and weights
// across the network
NN.mutate = function(nn){
	// go through all neurons and perform a random mutation with the probabilty 20%
	nnNeurons = nn.neurons;
	for (var i = 0; i < nnNeurons.length; i++){
		if (Math.random() < 0.2){
			nnNeurons[i]['bias'] += nnNeurons[i]['bias'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);

		}
	}

	// go through all connections and perform a random mutations with the proability of 20% 
	nnConnections = nn.connections;
	for (var i = 0; i < nnConnections.length; i++){
		if (Math.random() < 0.2){
			nnConnections[i]['weight'] += nnConnections[i]['weight'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);

		}
	}
	return nn;
}

// given two genomes peform crossover 
NN.crossOver = function(nn1, nn2){
	if (Math.random() > 0.5){ // swap probability
		var temp = nn1;
		nn1 = nn2;
		nn2 = temp;
	}

	nn1 = _.cloneDeep(nn1);
	nn2 = _.cloneDeep(nn2);
	nn1Neurons = nn1.neurons;
	nn2Neurons = nn1.neurons;

	// select a random amout of neurons to perform a cross over of networks neurons
	var slicePoint = Math.round(nn1.length * Math.random());
	for (var i = slicePoint; i < nn1Neurons; i++){
		var temp = nn1Neurons[i]['bias'];
		nn1Neurons[i]['bias'] = nn2[i]['bias'];
		nn2Neurons[i]['bias'] = temp;
	}

	return nn1; 
}

// load specified generation genomes from the server
NN.loadGeneration = function(filename){
	console.log('loaded generation');
	$.get('loadGenome/'+filename, function(data){
		var genomes = JSON.parse(data);
		// reset genome and generation counter
		NN.genome = 0;
		NN.generation = 0;
		NN.genomes = []
		// load genomes in to current genomes
		NN.genomes = genomes.map(function(genome){ return Network.fromJSON(genome) });
	});
}

// send the current generation genomes to the server to save as a file
NN.saveGeneration = function(game, filename){
	game.paused = true;
	console.log('saving generation');
	// create array of genomes objects 
	var generation = NN.genomes.map(function(genome){ return genome.toJSON(); });
	var serializedGen = JSON.stringify(generation);
	$.post('saveGenome/'+filename, serializedGen, function(res){
		console.log(res);
	}, 'text');
}
