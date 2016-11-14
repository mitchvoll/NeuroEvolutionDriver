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
}

NN.activate = function(sensorData){
	// get output for sensor inputs
	var output = NN.genomes[NN.genome].activate([
		sensorData.si.sensor1.d,
		sensorData.si.sensor2.d,
		sensorData.si.sensor3.d
	]);
	return output;
}

NN.advanceGenome = function(fitness){
	NN.genomes[genome].fitness = fitness; // assign fitness
	NN.genome++; // advance genome
	if (NN.genome > NN.numGenomes) // next generation
		NN.createNextGeneration();
}

NN.createNextGeneration = function(){
	NN.generation++; // advance generation
	NN.genome = 0; // reset current genome

	// kill worst genomes and copy the best for crossover
	NN.genomes = NN.getBestGenomes(NN.selection);
	var bestGenomes = _.clone(NN.genomes);

	// peform the crossover and mutation
	while (NN.genomes.length < NN.numGenomes - 2){
		// select two random genomes
		var genome1 = _.sample(bestGenomes).toJSON();
		var genome2 = _.sample(bestGenomes).toJSON();
		 
		var crossOver = NN.crossOver(genome1, genome2);
		// mutate using genomes
		var mutatedGenome = NN.mutate(crossOver);
		NN.genomes.push(Network.fromJSON(mutatedGenome));
	}

	// perform just the mutation
	while (NN.genomes.length < NN.numGenomes){
		// get random genome
		var genome = _.sample(bestGenomes).toJSON();
		NN.genomes.push( Network.fromJSON(NN.mutate(genome)) );
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
			nnNeurons[i]['bias'] += annNeurons[i]['bias'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);

		}
	}

	// go through all connections and perform a random mutations with the proability of 20% 
	nnConnections = nn.connections;
	for (var i = 0; i < nnConnections.length; i++){
		if (Math.random() < 0.2){
			nnNeurons[i]['bias'] += annNeurons[i]['bias'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);

		}
	}
	return nn;
}

// given to genomes peform crossover 
NN.crossOver = function(nn1, nn2){
	if (Math.random() > 0.5){ // swap probability
		var temp = nn1;
		nn1 = nn2;
		nn2 = temp;
	}

	nn1 = _.cloneDeep(nn1);
	nn2 = _.cloneDeep(nn2);
	nn1Neurons = nn1Neurons.neurons;
	nn2Neurons = nn2Neurons.neurons;

	var slicePoint = Math.round(nn1.length * Math.random());

	for (var key = slicePoint; key < nn1Neurons; key++){
		var temp = nn1Neurons[key]['bias'];
		nn1Neurons[key]['bias'] = nn2[key]['bias'];
		nn2Neurons[key]['bias'] = temp;
	}

	return nn1; 
}

