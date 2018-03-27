// Récupérer les données depuis l'API et les stocker dans notre base

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

MongoClient.connect('mongodb://localhost:27017', function(err, client) {
	if(err) {
		console.log(err);
	} else {
		var db = client.db('crypto');
		var ObjectId = require('mongodb').ObjectId; // On récupère l'oject id
		var monnaies = [{name: "BTC"}, {name: "ETH"}, {name: "42"}];

		app.route('/setup').get(function(req, res, next) {
			var portefeuillesCollection = db.collection('portefeuille'); // On initialise le portefeuille en EUR
			portefeuillesCollection.drop();
			portefeuillesCollection.insertOne({
				name: "EUR",
				solde: 10000,
				historique: [
					{
						time: new Date().getTime(),
						operation: "+ 10000"
					}
				]
			}, function(err, result) {
				if(err) {
					res.send(err);
				}
			});

			var monnaiesCollection = db.collection('monnaies'); // On récupère la collection des monnaies
			monnaiesCollection.drop(); // Suppression des entrées de la table
			var monnaiesData = [];
			var promises = [];
			for(let i in monnaies) {
				promises.push(axios({
					method: 'GET',
					url: 'https://min-api.cryptocompare.com/data/histoday?fsym='+monnaies[i].name+'&tsym=EUR&allData=true',
					responseType: 'json'
				}).then(function(response) {
					let data = response.data.Data;
					let objHistorique = {
						name: monnaies[i].name
					}
					let historiques = [];
					for(let j in data) {
						historiques.push({
							time: data[j].time*1000,
							price: data[j].high
						});
					}
					objHistorique.historique = historiques;
					monnaiesData.push(objHistorique);
				}));
			}

			axios.all(promises).then(function(results) {
				monnaiesCollection.insertMany(monnaiesData, {}, function(err, result) {
					if(err) {
						res.send(err);
					} else {
						res.json({
							status: 200,
							data: result
						});
					}
				})
			});
		});
	}
});

// On lance le serveur
app.listen(port, hostname, function(){
	console.log('Serveur lancé !');
});