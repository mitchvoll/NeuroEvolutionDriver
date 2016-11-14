var game = new Phaser.Game(1132, 783, Phaser.AUTO, 'main_game', { preload: preload, create: create, update: update, render: render });
// globals 
var cursors, // keyboard
 	car, // car
	track, // the physics object for the track boundaries
 	velocity = 0, // initial car velocity
	sensor1, sensor2, sensor3, si = {}, // sensors
	currentLap, lapTimes = [],
	trackLines, // the lines will be stored as an array of phaser line objects
	lines = JSON.parse('[{"x1":181,"y1":146,"x2":943.5,"y2":143.5},{"x1":944,"y1":144,"x2":971.5,"y2":159.5},{"x1":971,"y1":160,"x2":985.5,"y2":184.5},{"x1":986,"y1":189,"x2":986.5,"y2":315.5},{"x1":987,"y1":316,"x2":977.5,"y2":343.5},{"x1":978,"y1":344,"x2":960.5,"y2":366.5},{"x1":961,"y1":367,"x2":916.5,"y2":370.5},{"x1":917,"y1":371,"x2":855.5,"y2":389.5},{"x1":856,"y1":390,"x2":809.5,"y2":420.5},{"x1":810,"y1":421,"x2":773.5,"y2":463.5},{"x1":773,"y1":467,"x2":749.5,"y2":525.5},{"x1":749,"y1":525,"x2":745.5,"y2":592.5},{"x1":746,"y1":593,"x2":729.5,"y2":610.5},{"x1":731,"y1":612,"x2":700.5,"y2":627.5},{"x1":698.5,"y1":625.5,"x2":200.5,"y2":627.5},{"x1":200,"y1":631,"x2":154.5,"y2":605.5},{"x1":155,"y1":606,"x2":142.5,"y2":575.5},{"x1":144,"y1":576,"x2":146.5,"y2":191.5},{"x1":146,"y1":192,"x2":156.5,"y2":166.5},{"x1":157,"y1":167,"x2":181.5,"y2":144.5},{"x1":175.5,"y1":7.5,"x2":946.5,"y2":6.5},{"x1":948,"y1":9,"x2":989.5,"y2":17.5},{"x1":989,"y1":17,"x2":1037.5,"y2":39.5},{"x1":1038.5,"y1":40.5,"x2":1073.5,"y2":73.5},{"x1":1073.5,"y1":72.5,"x2":1101.5,"y2":110.5},{"x1":1102,"y1":112,"x2":1122.5,"y2":176.5},{"x1":1123,"y1":180,"x2":1122.5,"y2":321.5},{"x1":1122,"y1":326,"x2":1106.5,"y2":386.5},{"x1":1107,"y1":387,"x2":1083.5,"y2":431.5},{"x1":1084,"y1":432,"x2":1051.5,"y2":465.5},{"x1":1052,"y1":465,"x2":1006.5,"y2":493.5},{"x1":1010,"y1":492,"x2":954.5,"y2":504.5},{"x1":960,"y1":506,"x2":921.5,"y2":506.5},{"x1":922.5,"y1":506.5,"x2":898.5,"y2":515.5},{"x1":898.5,"y1":516.5,"x2":882.5,"y2":538.5},{"x1":885,"y1":542,"x2":873.5,"y2":618.5},{"x1":875,"y1":619,"x2":859.5,"y2":663.5},{"x1":860,"y1":663,"x2":810.5,"y2":722.5},{"x1":811,"y1":723,"x2":739.5,"y2":753.5},{"x1":739,"y1":756,"x2":683.5,"y2":760.5},{"x1":684,"y1":761,"x2":192.5,"y2":759.5},{"x1":193,"y1":762,"x2":134.5,"y2":748.5},{"x1":137,"y1":749,"x2":75.5,"y2":714.5},{"x1":76,"y1":715,"x2":47.5,"y2":678.5},{"x1":48,"y1":679,"x2":21.5,"y2":629.5},{"x1":22.5,"y1":630.5,"x2":13.5,"y2":593.5},{"x1":15,"y1":596,"x2":12.5,"y2":170.5},{"x1":11.5,"y1":168.5,"x2":23.5,"y2":129.5},{"x1":24,"y1":130,"x2":53.5,"y2":74.5},{"x1":54,"y1":75,"x2":84.5,"y2":44.5},{"x1":84,"y1":47,"x2":130.5,"y2":21.5},{"x1":131,"y1":22,"x2":175.5,"y2":7.5}]'); // the track boundary for sensor intersection


// preload all assets 
function preload() {
	// load sprites
	game.load.image('map', 'assets/map.jpg');
	game.load.spritesheet('car', 'assets/car2.png');
	//game.load.spritesheet('balls', 'assets/sprites/balls.png', 17, 17);

	// load hitboxes
	game.load.physics('collisions', 'assets/collisions.json')
	game.stage.disableVisibilityChange = true; // game runs when window is not in focus
}

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
	trackLines = lines.map(function(obj){ return new Phaser.Line(obj.x1, obj.y1, obj.x2, obj.y2) });
	
	// add car
	car = game.add.sprite(570, 100, 'car');
	game.physics.p2.enable(car);
	car.body.clearShapes();
	car.body.loadPolygon('collisions', 'car');
	car.body.angle = 90;

	cursors = game.input.keyboard.createCursorKeys(); // keyboard cursors
	startFinish = game.add.sprite(625, 10, null); 
	game.physics.p2.enable(startFinish, true);
	startFinish.body.static = true;
	startFinish.body.setRectangle(10, 280, 0, 10);
	startFinish.body.data.shapes[0].sensor = true;

	car.body.onBeginContact.add(carCollision, this); // check for car hitting wall

	// initialize ANN driver
	NN.init(3, 1, 10, 4);
}

function turnLeft(){
	car.body.angularVelocity = -9*(velocity/1000);
	velocity *= 0.75;
}

function turnRight(){
	car.body.angularVelocity = 9*(velocity/1000);
	velocity *= 0.75;
}

function ANNDriver(speed){
	velocity = speed;

	var output = NN.activate(si);
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

// update loop
function update(){
	// get lines for sensors 
	sensor1 = getLine(0, 250);	
	sensor2 = getLine(45, 250);
	sensor3 = getLine(-45, 250);
	game.debug.geom(sensor1);
	game.debug.geom(sensor2);
	game.debug.geom(sensor3);	// point of intersection for each sensor every frame 
	game.debug.geom(startFinish);

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
	ANNDriver(200);

	// Set X and Y Speed of Velocity
	car.body.velocity.x = velocity * Math.cos((car.angle-90)*0.01745);
	car.body.velocity.y = velocity * Math.sin((car.angle-90)*0.01745);
}

function render(){
	game.debug.text("sensor1 dist: " + Math.round(si.sensor1.d), 200, 200);
	game.debug.text("sensor2 dist: " + Math.round(si.sensor2.d), 200, 250);
	game.debug.text("sensor3 dist: " + Math.round(si.sensor3.d), 200, 300);
	game.debug.text("current lap: " + (game.time.now - currentLap), 200, 350);
	game.debug.text("genome: " + NN.genome, 200, 400);
}

function bestLap(){
	return Math.min.apply(Math, lapTimes); // return the best lap time
}


// called when car hits a collidable object 
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
	// collided with the track boundaries
	else{
		console.log("hit wall");
		//console.log(car.x, car.y);
		// reset car position
		velocity = 0;
		car.body.x = 570;
		car.body.y = 100;
		car.body.angle = 90;
		if (driver == "NN")
			NN.advanceGenome((game.time.now - currentLap)*-1);
	}
}

// returns a line from the car to a point x2,y2 that is the length of the 
// distance specified at the specified angle
function getLine(angle, distance){
	var x2 = Math.cos((car.angle-(90+angle))*0.01745)*distance;
	var y2 = Math.sin((car.angle-(90+angle))*0.01745)*distance;
	return new Phaser.Line(car.x, car.y, car.x + x2, car.y + y2);
}

// returns point for intersections with trackLines for a given line
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

// returns the intersection data for each sensor 
function getSensorData(){
	return { 
		sensor1: lineIntersect(sensor1),
	    sensor2: lineIntersect(sensor2),
	    sensor3: lineIntersect(sensor3) 
	};
}



//making lines
//var lines = [];
//var line1, handle1, handle2, nextClick;
//function makeLines(){
//
//	if (game.input.activePointer.rightButton.isDown && game.time.now > nextClick){
//		if (line1){
//			lines.push( {x1: line1.start.x, y1: line1.start.y, x2: line1.end.x, y2: line1.end.y} );
//		}
//		handle1 = game.add.sprite(game.input.activePointer.x, game.input.activePointer.y, 'balls', 0);
//		handle1.anchor.set(0.5);
//		handle1.inputEnabled = true;
//		handle1.input.enableDrag(true);
//		handle1.alpha = 0.3;
//
//		handle2 = game.add.sprite(game.input.activePointer.x+10, game.input.activePointer.y+10, 'balls', 0);
//		handle2.anchor.set(0.5);
//		handle2.inputEnabled = true;
//		handle2.input.enableDrag(true);
//		handle2.alpha = 0.3;
//
//		line1 = new Phaser.Line(handle1.x, handle1.y, handle2.x, handle2.y);
//		nextClick = game.time.now + 500;
//	}
//	if (handle1 && handle1){
//		line1.fromSprite(handle1, handle2, false);
//		game.debug.geom(line1);
//	}
//	if (cursors.down.isDown && game.time.now > nextClick){
//		console.log('saving');
//		lines.push( {x1: line1.start.x, y1: line1.start.y, x2: line1.end.x, y2: line1.end.y} );
//		console.log(JSON.stringify(lines));
//		nextClick = game.time.now + 500;
//	}
//}
