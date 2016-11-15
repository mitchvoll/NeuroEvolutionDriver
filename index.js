var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var fs = require('fs');
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.text({type: "*/*"}));

// save genomes to file
app.post('/saveGenome/:filename', function(req, res){
	fs.writeFile("public/genomes/"+req.params['filename'], req.body, function(err) {
		if(err)
			console.log(err);
		else{
			console.log("Saved genome as " + req.params['filename']);
			res.send('saved genome as: ' + req.params['filename']);
		}
	}); 
});

// load genomes from file
app.get('/loadGenome/:filename', function(req, res){
	fs.readFile("public/genomes/"+req.params['filename'], 'utf8', function(err, data){
		if (err)
			console.log(err);
		else{
			console.log("loaded genome " + req.params['filename']);
			res.send(data);
		}
	});

});

http.listen(3000, function(){
  console.log('listening on port:3000');
});
