var Architect = synaptic.Architect;
var Network = synaptic.Network;

var NeuroEvolution = function(inputs, outputs, popSize, nBest, mutationProb=0.2){
	this.genomes = []; // array of networks of size popSize 
	while (this.genomes.length < popSize) // population genomes with random perceptron networks
		this.genomes.push( new Architect.Perceptron(inputs, 4, 4, outputs) );

	this.popSize = popSize; // number of genomes per generation
	this.nBest = nBest; // the number of genomes maintained through each generation
	this.mutationProb = mutationProb; // the probability of a mutation
	this.genome = 0; // initialize the current genome
	this.generation = 0; // initialize the current generation
}

// activate the current genome
// expects data to be array of size input
NeuroEvolution.prototype.activate = function(data){
	return this.genomes[this.genome].activate(data);
} 

// assigns fitness to current genome and advance to the next
NeuroEvolution.prototype.advanceGenome = function(fitness){
	this.genomes[this.genome].fitness = fitness; // assign fitness to the current genome 
	this.genome++; // advance genome
	if (this.genome > this.genomes.length-1){
		console.log("advancing generation");
		this.createNextGeneration();
	}
}

NeuroEvolution.prototype.createNextGeneration = function(){
	this.generation++; // advance generation
	this.genome = 0; // reset current genome

	console.log(this.genomes);
	this.keepBestGenomes(); // kill worst genomes and copy the best for crossover
	var bestGenomes = JSON.parse(JSON.stringify(this.genomes)); // deep copy

	// peform the crossover and mutation by selecting two random genomes
	// from the bestGenomes and add the new genome to the generation
	// until there are popSize - 2 remaining
	while (this.genomes.length < this.popSize - 2){
		// select two random genomes
		var genome1 = this.sample(bestGenomes);
		var genome2 = this.sample(bestGenomes);
		 
		// cross over the two randomly selected genomes
		var crossOver = this.crossOver(genome1, genome2);
		// mutate using the new genome created from the crossover
		var mutatedGenome = this.mutate(crossOver);
		// add to next generation
		this.genomes.push(Network.fromJSON(mutatedGenome)); 
	}

	// perform just the mutation for the remaining two genomes 
	while (this.genomes.length < this.popSize){
		var genome = this.sample(bestGenomes); // get random genome
		this.genomes.push( Network.fromJSON(this.mutate(genome)) ); // mutate and add to next generation
	}
}

// keep nBest genomes sorted by fitness in ascending order
// accepts parameter maximize to sort in descending order 
NeuroEvolution.prototype.keepBestGenomes = function(maximize=false){
	// sort genomes on fitness
	this.genomes.sort(function(a, b){ return a['fitness'] - b['fitness'] });
	if (maximize) this.genomes.reverse(); // allows for fitness to be maximized 
	console.log(this.genomes);
	
	while (this.genomes.length > this.nBest) // remove worst genomes
		this.genomes.pop();
}

// return random sample from an array 
NeuroEvolution.prototype.sample = function(array){
	return array[Math.floor(Math.random()*array.length)];
}

// given a neural net go through all neurons and connections and perform 
// a random mutation given the mutationProb
NeuroEvolution.prototype.mutate = function(net){
	// mutate neurons
	var neurons = net.neurons;
	for (var i = 0; i < neurons.length; i++){  
		// adjust the bias multiplying a random number in the random -2:2
		if (Math.random() < this.mutationProb)
			neurons[i]['bias'] += neurons[i]['bias'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);
	}

	// mutate connections
	var connections = net.connections;
	for (var i = 0; i < connections.length; i++){ 
		// adjust the weight multiplying a random number in the random -2:2
		if (Math.random() < this.mutationProb)
			connections[i]['weight'] += connections[i]['weight'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);
	}

	return net;
}

NeuroEvolution.prototype.crossOver = function(net1, net2){
	if (Math.random() > 0.5){ // swap probability
		var temp = net1;
		net1 = net2;
		net2 = temp;
	}
	
	// deep clone the neurons of both nets to avoid changing the originals
	var net1Copy = JSON.parse(JSON.stringify(net1));
	var net2Copy = JSON.parse(JSON.stringify(net2));
	var net1Neurons = net1Copy.neurons;
	var net2Neurons = net2Copy.neurons;

	// select a random number of neurons to perform a cross over of networks neurons
	var slicePoint = Math.round(net1Neurons.length * Math.random());
	for (var i=slicePoint; i<net1Neurons; i++){
		// swap bias values
		var temp = net1Neurons[i]['bias'];
		net1Neurons[i]['bias'] = net2Neurons[i]['bias'];
		net2Neurons[i]['bias'] = temp;
	}

	return net1Copy; 
}

// load specified generation genomes from the server
NeuroEvolution.prototype.loadGeneration = function(filename){
	console.log('loaded generation');
	$.get('loadGenome/'+filename, function(data){
		var genomes = JSON.parse(data);
		// reset genome and generation counter
		this.genome = 0;
		this.generation = 0;
		this.genomes = []
		// load genomes in to current genomes
		this.genomes = genomes.map(function(genome){ return Network.fromJSON(genome) });
	});
}

// send the current generation genomes to the server to save as a file
NeuroEvolution.prototype.saveGeneration = function(game, filename){
	game.paused = true;
	console.log('saving generation');
	// create array of genomes objects 
	var generation = this.genomes.map(function(genome){ return genome.toJSON(); });
	var serializedGen = JSON.stringify(generation);
	$.post('saveGenome/'+filename, serializedGen, function(res){
		console.log(res);
	}, 'text');
}


