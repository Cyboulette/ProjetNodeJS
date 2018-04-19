module.exports = function(app, db, axios) {
	var monnaiesCollection = db.collection('monnaies');
	var portefeuilleCollection = db.collection('portefeuille');
	var ObjectId = require('mongodb').ObjectID;

	app.get('/api/setup', function(req, res, next){
		var monnaies = [{name: "BTC"}, {name: "ETH"}, {name: "42"}]; // Monnaies à récupérer depuis l'API pour le setup via Axios

		// On vide les portefeuilles
		portefeuilleCollection.drop();

		// On setup le portefeuille en euros de base
		portefeuilleCollection.insertOne({
			name: "EUR",
			solde: 10000,
			historique: [
				{
					time: new Date().getTime(),
					operation: "+",
					amount: 10000,
					total: 10000
				}
			]
		});

		// On vide toutes les crypto-monnaies
		monnaiesCollection.drop();
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
						message: 'Toutes les données ont bien été insérées !'
					});
				}
			})
		});
	});

	app.get('/api/monnaies', function(req, res, next) {
		monnaiesCollection.find({}).project({name: 1}).toArray(function(err, result) {
			if(err) {
				res.send(err);
			} else {
				res.json({
					data: result
				});
			}
		})
	});

	app.get('/api/historiques', function(req, res, next) {
		monnaiesCollection.find({}).toArray(function(err, result) {
			if(err) {
				res.send(err);
			} else {
				res.json({
					data: result
				});
			}
		})
	});

	app.get('/api/historique/:monnaie', function(req, res, next) {
		monnaiesCollection.findOne({name: req.params.monnaie}, function(err, result) {
			if(err) {
				res.send(err);
			} else {
				res.json({
					data: result
				});
			}
		});
	});

	app.get('/api/portefeuille', function(req, res, next) {
		portefeuilleCollection.find({}).toArray(function(err, result) {
			if(err) {
				res.send(err);
			} else {
				res.json({
					data: result
				});
			}
		});
	});

	app.get('/api/portefeuille/:monnaie', function(req, res, next) {
		portefeuilleCollection.findOne({name: req.params.monnaie}, function(err, result2) {
			if(err) {
				res.send(err);
			} else {
				if(result2 == null) {
					data = {
						name: req.params.monnaie,
						solde: 0.0,
						historique: []
					};
				} else {
					data = {
						name: result2.name,
						solde: result2.solde,
						historique: result2.historique
					};
				}
				res.json(data);
			}
		});
	});

	// Amount = le montant désiré d'achat en EUROS.
	// Exemple : Je veux acheter pour amount=100€ d'ETH.
	// Si 1 ETH = 396.04 € alors 100 € = 0.25 ETH achetés
	app.post('/api/portefeuille/:monnaie', function(req, res, next) {
		monnaiesCollection.findOne({name: req.params.monnaie}, function(err, monnaie) {
			if(err) {
				res.send(err);
			} else {
				if(monnaie == null) {
					res.json({
						message: "Cette crypto-monnaie n'existe pas"
					});
				} else {
					if(req.body.amount != null && !isNaN(parseFloat(req.body.amount)) && req.body.amount > 0) {
						var amount = parseFloat(req.body.amount);
						var lastValueInEuro = monnaie.historique[monnaie.historique.length-1].price;
						var equivalentEnCrypto = amount / lastValueInEuro;
						// On cherche le portefeuille actuelle en EUROS de la personne
						portefeuilleCollection.findOne({name: "EUR"}, function(err, euros) {
							// Si le solde est insuffisant
							if(euros == null || euros.solde < amount) {
								res.json({
									message: "Vous ne possédez pas assez d'euros pour acheter"
								});
							} else {
								// Sinon
								var time = new Date().getTime(); // Timestamp de la requête
								var newSolde = equivalentEnCrypto; // Le nouveau solde de la monnaie désirée converti via l'euro
								var newSoldeEuros = euros.solde - amount; // Le nouveau solde euros
								var newHistorique = [{time: time, amount: newSolde, total: newSolde, operation: '+'}];

								portefeuilleCollection.findOne({name: monnaie.name}, function(err, portefeuilleMonnaie) {
									if(portefeuilleMonnaie != null) {
										newSolde = portefeuilleMonnaie.solde += equivalentEnCrypto;
										var temp = portefeuilleMonnaie.historique;
										temp.push({time: time, operation: '+', amount: equivalentEnCrypto, total: newSolde});
										newHistorique = temp;
									}

									var temp2 = euros.historique;
									temp2.push({time: time, operation: '-', amount: amount, total: newSoldeEuros});
									var newHistoriqueEuros = temp2;

									// On utilise un UPSERT : on fait un update si ça existe déjà, sinon on INSERT
									portefeuilleCollection.updateOne({name: monnaie.name}, {$set: {solde: newSolde, historique: newHistorique}}, {upsert: true});
									// On met à jour notre portefeuille d'euros
									portefeuilleCollection.updateOne({name: "EUR"}, {$set: {solde: newSoldeEuros, historique: newHistoriqueEuros}});

									res.json({
										success: true,
										soldeRestantEuros: newSoldeEuros,
										soldeRestantMonnaie: newSolde,
										monnaie: monnaie.name
									});
								});
							}
						});
					} else {
						res.json({
							message: "Le montant doit être un flottant correct"
						});
					}
				}
			}
		});
	});

	// Amount = le montant désiré de vendre !
	app.post('/api/portefeuille/:monnaie/vendre', function(req, res, next){
		monnaiesCollection.findOne({name: req.params.monnaie}, function(err, monnaie) {
			if(err) {
				res.send(err);
			} else {
				if(monnaie == null) {
					res.json({
						message: "Cette crypto-monnaie n'existe pas"
					});
				} else {
					if(req.body.amount != null && !isNaN(parseFloat(req.body.amount)) && req.body.amount > 0) {
						var amount = parseFloat(req.body.amount);
						var lastValueInEuro = monnaie.historique[monnaie.historique.length-1].price;
						var equivalentEnEuro = amount * lastValueInEuro;

						portefeuilleCollection.findOne({name: monnaie.name}, function(err, crypto) {
							if(crypto == null || crypto.solde < amount) {
								res.json({
									message: "Vous ne possédez pas assez de "+monnaie.name+', vous ne pouvez pas vendre plus que ce que vous possédez'
								});
							} else {
								portefeuilleCollection.findOne({name: "EUR"}, function(err, euros) {
									var time = new Date().getTime(); // Timestamp de la requête
									var newSolde = crypto.solde - amount; // Le nouveau solde de la monnaie désirée converti via l'euro
									var newSoldeEuros = euros.solde + equivalentEnEuro; // Le nouveau solde euros
									var temp = crypto.historique;
									temp.push({time: time, operation: '-', amount: amount, total: newSolde});
									var newHistorique = temp;

									var temp2 = euros.historique;
									temp2.push({time: time, operation: '+', amount: equivalentEnEuro, total: newSoldeEuros});
									var newHistoriqueEuros = temp2;

									// On utilise un UPSERT : on fait un update si ça existe déjà, sinon on INSERT
									//portefeuilleCollection.updateOne({name: monnaie.name}, {$set: {solde: newSolde, historique: newHistorique}}, {upsert: true});
									// On met à jour notre portefeuille d'euros
									portefeuilleCollection.updateOne({name: crypto.name}, {$set: {solde: newSolde, historique: newHistorique}});
									// On met à jour notre portefeuille d'euros
									portefeuilleCollection.updateOne({name: "EUR"}, {$set: {solde: newSoldeEuros, historique: newHistoriqueEuros}});

									res.json({
										success: true,
										soldeRestantEuros: newSoldeEuros,
										soldeRestantMonnaie: newSolde,
										monnaie: monnaie.name
									});
								});
							}
						});
					} else {
						res.json({
							message: "Le montant doit être un flottant correct"
						});
					}
				}
			}
		});
	});
}
