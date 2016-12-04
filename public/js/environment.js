var GameState = function(game){  }; // GameState object

GameState.prototype.preload = function(){
	// load sprites
	this.game.load.image('map', 'assets/map.jpg');
	this.game.load.spritesheet('car', 'assets/car2.png');

	// load hitboxes
	this.game.load.physics('collisions', 'assets/collisions.json')
	this.game.stage.disableVisibilityChange = true; // game runs when window is not in focus
}

GameState.prototype.create = function(){
	// enable p2 physics http://phaser.io/examples/v2/category/p2-physics
	this.game.physics.startSystem(Phaser.Physics.P2JS);
	
	this.track = new Track(this.game, this); // create the track and map

	this.car = new Car(this.game, 620, 80, this); // add car
	console.log("car")
	console.log(this.car)
	
	// handle car collisions
	this.car.body.onBeginContact.add(this.car.collisionHandler, this.car); 

	// inputs, outputs, population size, n genomes to carry forward, mutation rate
	this.NE = new NeuroEvolution(3, 1, 20, 2, 0.4); // initialize ANN 
	// load previous generation
	this.NE.loadGeneration('generation500.json'); // learned the driving lines


	this.cursors = game.input.keyboard.createCursorKeys(); // keyboard cursors

	console.dir(this);
}

GameState.prototype.update = function(){ this.car.update() }


GameState.prototype.render = function(){
	// display information about the current lap time, best laptimes,
	// distance, sensors, and genetic algorithm information
	var sensorText = "Middle sensor: " + Math.round(this.car.sensors.middle.d) + 
		",   Left sensor : " + Math.round(this.car.sensors.left.d) + 
		",   Right sensor : " + Math.round(this.car.sensors.right.d);
	this.game.debug.text(sensorText, 200, 200);
	this.game.debug.text("distance: " + this.car.distance + ", current lap: " + (this.game.time.now - this.car.currentLap) / 1000, 200, 250);
	this.game.debug.text("genome: " + this.NE.genome + ", generation: " + this.NE.generation, 200, 300);
	this.game.debug.text("Last lap: " + (this.car.lastLap ? this.car.lastLap/1000 : "-------") + " seconds", 400, 375);
	this.game.debug.text("Best laps: ", 200, 350);
	for (i = 0; i < 5; i++){
		var yOffset = 25 * (i + 1);
		var text = i + 1 + ": " + (this.car.laptimes[i] ? this.car.laptimes[i] / 1000 + " seconds" : "---------");
		game.debug.text(text, 200, 350+yOffset);
	}

	// display lines
	this.game.debug.geom(this.car.sensors.middle);
	this.game.debug.geom(this.car.sensors.left);
	this.game.debug.geom(this.car.sensors.right);	 
	this.game.debug.geom(this.track.startFinish);
	for (var i in distanceLines){
		this.game.debug.geom(distanceLines[i]);
	}
	// draw circle for sensor intersections 
	for (var key in this.sensors){
		if (this.car.sensors[key].p) // if intersection
			this.game.debug.geom( new Phaser.Circle(this.car.sensors[key].p.x-2, this.car.sensors[key].p.y-2, 15), 'rgba(50, 50, 255, 1)');
	}

}

GameState.prototype.advanceGenome = function(laptime, distance){
	// penalty is given by a 1 second increase for every distance marker short of the finish line
	var penalty = (38 - distance)*1000; // penalty given in ms 
	var fitness =  (laptime + penalty); 

	console.log("fitness: "+ fitness);
	this.NE.advanceGenome(fitness);
	this.car.resetCar();
}
/***********************************************
 * Track object 
 **********************************************/
var Track = function(game){
	// create map object as property of the track
	this.map = game.add.tileSprite(0, 0, 1132, 783, 'map');

	// create track object
	Phaser.Sprite.call(this, game, 15, 15);
	game.physics.p2.enable(this);
	this.body.static = true; 
	this.body.clearShapes(); // remove the standard hitbox
	this.body.loadPolygon('collisions', 'track'); // load hitbox from Physics Editor

	// array of phaser lines representing track boundaries used for sensor collision 
	this.trackLines = trackLines.map(function(obj){ return new Phaser.Line(obj.x1, obj.y1, obj.x2, obj.y2) });
	
	// add all distance lines
	this.distanceLines = distanceLines.map(function(obj){
		var line = game.add.sprite(obj.x1, obj.y1, null);
		game.physics.p2.enable(line, true);
		line.body.static = true;
		line.body.angle = Math.atan((obj.x2-obj.x1) / (obj.y2-obj.y1)) * (-180 / 3.14);;
		var distBetweenLines = Math.sqrt( Math.pow(obj.x2-obj.x1, 2) + Math.pow(obj.y2-obj.y1, 2) );
		line.body.setRectangle(5, distBetweenLines, 0, distBetweenLines/2);
		line.body.data.shapes[0].sensor = true;
	});

	// add start finish line
	this.startFinish = game.add.sprite(625, 10, null); 
	game.physics.p2.enable(this.startFinish, true);
	this.startFinish.body.static = true;
	this.startFinish.body.setRectangle(10, 280, 0, 10);
	this.startFinish.body.data.shapes[0].sensor = true;
	game.add.existing(this);
}
Track.prototype = Object.create(Phaser.Sprite.prototype);
Track.prototype.constructor = Track;

/***********************************************
 * Car object 
 **********************************************/
var Car = function(game, x, y, gameState){
	Phaser.Sprite.call(this, game, x, y, 'car');
	game.physics.p2.enable(this, true);
	this.body.clearShapes();
	this.body.loadPolygon('collisions', 'car');
	this.body.angle = 90;

	this.game = game;
	this.gameState = gameState;
	this.velocity = 0; // intial velocity
	this.distance = 0; // keep track of the distance the car has travelled 
	this.lastLap = 0;
	this.laptimes = []; // keep track of the five best times
	this.lastDistanceCollision = null; // used to keep track of distance lines collisions
	// get lines for sensors 
	this.sensors = {
		middle: this.getLine(0, 250),
		left: this.getLine(45, 250),
		right: this.getLine(-45, 250)
	};
	console.log(this);
	game.add.existing(this);
}
Car.prototype = Object.create(Phaser.Sprite.prototype);
Car.prototype.constructor = Car;

// car code that runs every frame
Car.prototype.update = function(){
	// get lines for sensors 
	this.sensors.middle = this.getLine(0, 250);
	this.sensors.left = this.getLine(45, 250);
	this.sensors.right = this.getLine(-45, 250);
	this.updateSensors(); // update sensor intersections and distances

	// draw sensor intersections
	for (var key in this.sensors){
		if (this.sensors[key].p) // if intersection
			game.debug.geom( new Phaser.Circle(this.sensors[key].p.x-2, this.sensors[key].p.y-2, 15), 'rgba(50, 50, 255, 1)');
	}
	
	//this.simpleDriver(); // drive using simple driver
	this.NEDriver(400); // drive using the genetic algorithm
	
	// Set X and Y Speed of Velocity
	this.body.velocity.x = this.velocity * Math.cos((this.angle-90)*0.01745);
	this.body.velocity.y = this.velocity * Math.sin((this.angle-90)*0.01745);
}; 

// Takes an angle and a distance
// Draws a line at the angle for the distance from the car
// returns the line as a Phaser Line object
Car.prototype.getLine = function(angle, distance){
	var x2 = Math.cos((this.angle - (90 + angle)) * 0.01745) * distance;
	var y2 = Math.sin((this.angle - (90 + angle)) * 0.01745) * distance;
	return new Phaser.Line(this.x, this.y, this.x + x2, this.y + y2);
}

// Takes no arguments and returns void
// Modifies the car's angular velocity and forward velocity to perform a left turn
Car.prototype.turnLeft = function(){
	this.body.angularVelocity = -9 * (this.velocity/1000);
	this.velocity *= 0.55;
}

// Takes no arguments and returns void
// Modifies the car's angular velocity and forward velocity to perform a right turn
Car.prototype.turnRight = function(){
	this.body.angularVelocity = 9 * (this.velocity/1000);
	this.velocity *= 0.55;
}

// Make driving decisions using the NeuroEvolution model
Car.prototype.NEDriver = function(speed){
	this.velocity = speed;
	var output = this.gameState.NE.activate(this.getSensorDistances()); // pass in array of sensor distances
	//console.log(output);
	if (output > 0.666)
		this.turnRight();
	else if (output < 0.333)
		this.turnLeft();
	else // drive straight
		this.body.angularVelocity = 0;
}

// simple driver turns away from walls its too close  
Car.prototype.simpleDriver = function(speed = 400, avoidanceThresh=80){
	this.velocity = speed; // always move
	if (this.sensor2 && this.sensor2.d < avoidanceThresh) // left sensor
		this.turnRight();
	else if (this.sensor3 && this.sensor3.d < avoidanceThresh) // right sensor
		this.turnLeft();
	else // otherwise driver straight
		this.body.angularVelocity = 0;
}

// return the sensor distances as an array
Car.prototype.getSensorDistances = function(){
	var arr = [];
	for (var i in this.sensors){
		arr.push(this.sensors[i].d);
	}
	return arr;
}

// update sensors for intersection points
Car.prototype.updateSensors = function(){
	for (var s in this.sensors){
		var point = null, distance = 1000; // point of intersection and distance
		for (var i in this.gameState.track.trackLines){
			// point of intersection between sensor and trackline
			var p = this.sensors[s].intersects(this.gameState.track.trackLines[i]);  
			// check for intersection and if this intersection is the closest
			if (p && p.distance(this.sensors[s].start) < distance){ // closest intersection 
				point = p;
				distance = p.distance(this.sensors[s].start);
			}
		}
		// assign point and distance to sensor
		this.sensors[s].p = point;
		this.sensors[s].d = distance;
	}
}

// add laptime and only keep the best 5
Car.prototype.addLap = function(laptime){
	this.lastLap = laptime;
	this.laptimes.push(laptime);
	this.laptimes.sort(function(a, b){ return a-b; }); 
	while (this.laptimes.length > 5)
		this.laptimes.pop();
}

// called when car hits a collidable object (Track boundaries, finish line) 
// Takes the two colliding bodies, their shapes, and the equation to use for the collision
Car.prototype.collisionHandler = function(bodyA, bodyB, shapeA, shapeB, equation){
	// passed the start finish line
	if (bodyB.id == this.gameState.track.startFinish.body.id){
		if ( !this.currentLap || (this.currentLap + 2000 < game.time.now) ){
		console.log("hit finish, distance: " + this.distance);
			lastLap = this.game.time.now - this.currentLap;
			if (lastLap) this.addLap(lastLap);
			this.currentLap = this.game.time.now; // the time the car crosses the start finish
			
			// completed one lap
			if (this.distance >= 36) { 
				this.gameState.advanceGenome(lastLap, this.distance);
				this.game.paused = true;
				setTimeout(function(){ this.game.paused = false; }, 500); // resume game after half second
			}
		}
	}
	else if (bodyB.id >= 8 && bodyB.id != this.lastDistanceCollision){ // collided with distance line
		this.distance++;
		this.lastDistanceCollision = bodyB.id;
	}
	else if (bodyB.id == 5){ // collided with the track boundaries
		console.log("hit wall");
		this.gameState.advanceGenome(this.game.time.now - this.currentLap, this.distance);
	}
}

Car.prototype.resetCar = function(){
	this.distance = 0;
	this.currentLap = game.time.now;
	// reset car position
	this.velocity = 0;
	this.body.x = 625;
	this.body.y = 80;
	this.body.angle = 90;
	this.paused = false;
}

var game = new Phaser.Game(1132, 783, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);
