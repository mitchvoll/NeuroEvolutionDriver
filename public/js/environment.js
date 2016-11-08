var game = new Phaser.Game(1132, 783, Phaser.AUTO, 'main_game', { preload: preload, create: create, update: update });

// preload all assets 
function preload() {
	// load sprites
	game.load.image('map', 'assets/map.jpg');
	game.load.spritesheet('car', 'assets/car2.png');

	// load hitboxes
	game.load.physics('collisions', 'assets/collisions.json');
}

// globals 
var cursors, // keyboard
 	car, // car
	track, // the physics object for the track boundaries
 	velocity = 0; // initial car velocity

function create() {
	
	// enable p2 physics http://phaser.io/examples/v2/category/p2-physics
	game.physics.startSystem(Phaser.Physics.P2JS);

	// add map	
	var map = game.add.tileSprite(0, 0, 1132, 783, 'map');
	map.fixedToCamera = true;

	// add track
	track = game.add.sprite(15, 15);
	game.physics.p2.enable(track, true);
	track.body.static = true; // track is static
	track.body.clearShapes(); // remove standard Bounding Box
	track.body.loadPolygon('collisions', 'track'); // Load Bounding Box from Physics Editor File

	// add car
	car = game.add.sprite(570, 100, 'car');
	game.physics.p2.enable(car);
	car.body.clearShapes();
	car.body.loadPolygon('collisions', 'car');
	car.body.angle = 90;


	cursors = game.input.keyboard.createCursorKeys(); // keyboard cursors

	car.body.onBeginContact.add(hitWall, this); // check for car hitting wall

}

// called when car hits wall
function hitWall(body, bodyB, shapeA, shapeB, equation){
	console.log("hit wall");
	console.dir(shapeB);
	// reset car position
	console.log(car.x, car.y);
	console.dir(equation);
	velocity = 0;
	car.body.x = 570;
	car.body.y = 100;
	car.body.angle = 90;
}

// returns a line from the car to a point x2,y2 that is the length of the 
// distance specified at the specified angle
function getLine(angle, distance){
	var x2 = Math.cos((car.angle-(90+angle))*0.01745)*distance;
	var y2 = Math.sin((car.angle-(90+angle))*0.01745)*distance;
	return new Phaser.Line(car.x, car.y, car.x + x2, car.y + y2);
}

// update loop
function update(){
	// update velocity
	if (cursors.up.isDown && velocity <= 400) { // speed up
			velocity = 200;
	}
	else if (cursors.down.isDown){ // brake
		velocity = -200;
	}
	else // slow down
		velocity = 0;
	
	// Rotation of Car
	if (cursors.left.isDown){
		car.body.angularVelocity = -9*(velocity/1000);
		velocity *= 0.75;
	}
	else if (cursors.right.isDown){
		car.body.angularVelocity = 9*(velocity/1000);
		velocity *= 0.75;
	}
	else{
		car.body.angularVelocity = 0;
	}

	// Set X and Y Speed of Velocity
	car.body.velocity.x = velocity * Math.cos((car.angle-90)*0.01745);
	car.body.velocity.y = velocity * Math.sin((car.angle-90)*0.01745);

	// get lines for sensors 
	sensor1 = getLine(0, 250);	
	sensor2 = getLine(45, 250);
	sensor3 = getLine(-45, 250);
	game.debug.geom(sensor1);
	game.debug.geom(sensor2);
	game.debug.geom(sensor3);

}
