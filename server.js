// Fournir une API de récupération/ajout des données

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var axios = require('axios');
var hostname = 'localhost';
var port = 8080;

var app = express();

app.use(morgan('dev'));
app.use(bodyParser());
app.use(express.static(__dirname+'/public'));

MongoClient.connect('mongodb://localhost:27017', function(err, client) {
	var db = client.db('crypto');
	if(err) {
		console.log(err);
	} else {
		var routes = require('./urls.js');
		routes(app, db, axios);
	}
});

// On lance le serveur
app.listen(port, hostname, function(){
	console.log('Serveur lancé sur : http://'+hostname+':'+port+'/');
});