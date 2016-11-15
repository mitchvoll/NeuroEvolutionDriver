var game = new Phaser.Game(1132, 783, Phaser.AUTO, 'main_game', { preload: preload, create: create, update: update, render: render });
// globals 
var cursors, // keyboard
 	car, // car
	track, // the physics object for the track boundaries
 	velocity = 0, // initial car velocity
	lastDistanceCollision, // the id of the last distance lien collided
	sensor1, sensor2, sensor3, si = {}, // sensors
	distance = 0, currentLap, lapTimes = [];


// preload function 
// Takes no arguments and returns void
// Simply preloads resources like the track image and car sprite
// Also loads a json object containing collision information
function preload() {
	// load sprites
	game.load.image('map', 'assets/map.jpg');
	game.load.spritesheet('car', 'assets/car2.png');
	//game.load.spritesheet('balls', 'assets/sprites/balls.png', 17, 17);

	// load hitboxes
	game.load.physics('collisions', 'assets/collisions.json')
	game.stage.disableVisibilityChange = true; // game runs when window is not in focus
}

// create()
// Takes no arguments and returns void 
// Creates various game objects (track, car, tracklines); sets initial values for objects
// Adds them to the phaser game object created on the first line
function create() {
	// enable p2 physics http://phaser.io/examples/v2/category/p2-physics
	game.physics.startSystem(Phaser.Physics.P2JS);

	// add map	
	var map = game.add.tileSprite(0, 0, 1132, 783, 'map');
	map.fixedToCamera = true;

	// add track
	track = game.add.sprite(15, 15);
	game.physics.p2.enable(track);
	track.body.static = true; // track is static
	track.body.clearShapes(); // remove standard Bounding Box
	track.body.loadPolygon('collisions', 'track'); // Load Bounding Box from Physics Editor File
	// array of phaser lines that represent the track boundaries
	trackLines = trackLines.map(function(obj){ return new Phaser.Line(obj.x1, obj.y1, obj.x2, obj.y2) });
	
	// add car
	car = game.add.sprite(570, 80, 'car');
	game.physics.p2.enable(car);
	car.body.clearShapes();
	car.body.loadPolygon('collisions', 'car');
	car.body.angle = 90;

	// add start finish line
	startFinish = game.add.sprite(625, 10, null); 
	game.physics.p2.enable(startFinish, true);
	startFinish.body.static = true;
	startFinish.body.setRectangle(10, 280, 0, 10);
	startFinish.body.data.shapes[0].sensor = true;

	// add all distance lines
	distanceLines = distanceLines.map(function(obj){
		var line = game.add.sprite(obj.x1, obj.y1, null);
		game.physics.p2.enable(line, true);
		line.body.static = true;
		line.body.angle = Math.atan((obj.x2-obj.x1)/(obj.y2-obj.y1))*(-180/3.14);;
		var distBetweenLines = Math.sqrt( Math.pow(obj.x2-obj.x1, 2) + Math.pow(obj.y2-obj.y1, 2) );
		line.body.setRectangle(5, distBetweenLines, 0, distBetweenLines/2);
		line.body.data.shapes[0].sensor = true;
	});

	cursors = game.input.keyboard.createCursorKeys(); // keyboard cursors
	car.body.onBeginContact.add(carCollision, this); // check for car hitting wall

	// initialize ANN driver
	NN.init(3, 1, 10, 4);
}

// update()
// takes no arguments and returns void
// Serves as the main loop for the program, finds POI for sensors
// turns the car left or right based on distance to track boundary

function update(){
	// get lines for sensors 
	sensor1 = getLine(0, 250);	
	sensor2 = getLine(45, 250);
	sensor3 = getLine(-45, 250);
	game.debug.geom(sensor1);
	game.debug.geom(sensor2);
	game.debug.geom(sensor3);	// point of intersection for each sensor every frame 
	game.debug.geom(startFinish);
	for (var i in distanceLines){
		game.debug.geom(distanceLines[i]);
	}

	si = getSensorData(); 
	// draw circle for sensor intersections 
	for (var key in si){
		if (si[key].p) // if intersection
			game.debug.geom( new Phaser.Circle(si[key].p.x-2, si[key].p.y-2, 15), 'rgba(50, 50, 255, 1)');
	}

	// Keyboard control
	// update velocity
	if (cursors.up.isDown && velocity <= 400) // speed up
		velocity = 200;
	else if (cursors.down.isDown) // brake
		velocity = -200;
	else // slow down
		velocity = 0;
	
	// Rotation of Car
	if (cursors.left.isDown)
		turnLeft();
	else if (cursors.right.isDown)
		turnRight();
	else
		car.body.angularVelocity = 0;
	
	// drive using simple driver
	//simpleDriver();
	ANNDriver(400);

	// Set X and Y Speed of Velocity
	car.body.velocity.x = velocity * Math.cos((car.angle-90)*0.01745);
	car.body.velocity.y = velocity * Math.sin((car.angle-90)*0.01745);
}

// render()
// Takes no arguments and returns void 
// Draws the textual information on screen that contains sensor and lap information
function render(){
	game.debug.text("sensor1 dist: " + Math.round(si.sensor1.d), 200, 200);
	game.debug.text("sensor2 dist: " + Math.round(si.sensor2.d), 200, 250);
	game.debug.text("sensor3 dist: " + Math.round(si.sensor3.d), 200, 300);
	game.debug.text("distance: " + distance + ", current lap: " + (game.time.now - currentLap), 200, 350);
	game.debug.text("genome: " + NN.genome + ", generation: " + NN.generation, 200, 400);
}

// turnLeft()
// Takes no arguments and returns void
// Modifies the car's angular velocity and forward velocity to perform a left turn
function turnLeft(){
	car.body.angularVelocity = -9*(velocity/1000);
	velocity *= 0.75;
}

// turnRight()
// Takes no arguments and returns void
// Modifies the car's angular velocity and forward velocity to perform a right turn
function turnRight(){
	car.body.angularVelocity = 9*(velocity/1000);
	velocity *= 0.75;
}

function ANNDriver(speed){
	driver = "NN";
	velocity = speed;

	var output = NN.activate(si);
	//console.log(output);
	if (output > 0.666)
		turnRight();
	else if (output < 0.333)
		turnLeft();
	else // drive straight
		car.body.angularVelocity = 0;
	
}

// simple driver turns away from walls its too close to 
function simpleDriver(speed=400, avoidanceThresh=80){
	// always move
	velocity = speed;

	// left sensor
	if (si.sensor2 && si.sensor2.d < avoidanceThresh){
		//console.log("turn right")
		turnRight();
	}
	// right sensor
	else if (si.sensor3 && si.sensor3.d < avoidanceThresh){
		//console.log("turn left")
		turnLeft();
	}
	else{
		car.body.angularVelocity = 0;
	}
}

// bestLap()
// Takes no arguments, returns the minimum lap time
function bestLap(){
	return Math.min.apply(Math, lapTimes); // return the best lap time
}


// carCollision() // called when car hits a collidable object (Track boundaries, finish line) // Takes the two colliding bodies, their shapes, and the equation to use for the collision
// returns void
function carCollision(bodyA, bodyB, shapeA, shapeB, equation){
	// passed the start finish line
	if (bodyB.id == startFinish.body.id){
		if ( !currentLap || (currentLap + 2000 < game.time.now) ){
			//console.log("passed finish");
			var lastLap = game.time.now - currentLap;
			if (lastLap) lapTimes.push(lastLap);
			//console.log(lapTimes);
			currentLap = game.time.now; // the time the car crosses the start finish
		}
	}
	else if (bodyB.id >= 8 && bodyB.id != lastDistanceCollision){ // collided with distance line
		console.log("hit distanceLine")
		console.log(bodyB);
		distance++;
		lastDistanceCollision = bodyB.id;
	}
	// collided with the track boundaries
	else if (bodyB.id == 5){
		console.log("hit wall");
	console.log(bodyB);
		//console.log(car.x, car.y);
		// reset car position
		distance = 0;
		velocity = 0;
		car.body.x = 570;
		car.body.y = 80;
		car.body.angle = 90;
		if (driver == "NN")
			NN.advanceGenome((distance));
	}
}

// getLine()
// Takes an angle and a distance
// Draws a line at the angle for the distance from the car
// returns the line as a Phaser Line object
function getLine(angle, distance){
	var x2 = Math.cos((car.angle-(90+angle))*0.01745)*distance;
	var y2 = Math.sin((car.angle-(90+angle))*0.01745)*distance;
	return new Phaser.Line(car.x, car.y, car.x + x2, car.y + y2);
}

// lineIntersect()
// Takes a line 
// returns JSON object containing point for intersections with trackLines for the given line
function lineIntersect(line){
	// point of intersection and distance
	var point = null, distance = Number.POSITIVE_INFINITY;
	for (var i in trackLines){
		var p = line.intersects(trackLines[i]); // point if intersection
		// check for intersection and if this intersection is the closest
		if (p && p.distance(sensor1.start) < distance){ // closest intersection 
			point = p;
			distance = p.distance(sensor1.start);
		}
	}
	return { p: point, d: distance };
	}

// getSensorData()
// Takes no arguments
// returns the intersection data for each sensor as a JSON object
function getSensorData(){
	return { 
		sensor1: lineIntersect(sensor1),
	    sensor2: lineIntersect(sensor2),
	    sensor3: lineIntersect(sensor3) 
	};
}

