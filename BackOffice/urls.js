module.exports = function(app, db) {
	var monnaiesCollection = db.collection('monnaies');
	var portefeuilleCollection = db.collection('portefeuille');
	var ObjectId = require('mongodb').ObjectID;

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
		monnaiesCollection.findOne({name: req.params.monnaie}, function(err, result) {
			if(err) {
				res.send(err);
			} else {
				if(result == null) {
					res.status(404);
					res.json({
						message: "This monnaie doesn't exists !"
					});
				} else {
					portefeuilleCollection.findOne({name: req.params.monnaie}, function(err, result2) {
						if(err) {
							res.send(err);
						} else {
							if(result2 == null) {
								data = {
									name: result.name,
									solde: 0.0,
									historique: []
								};
							} else {
								data = {
									name: result.name,
									solde: result2.solde,
									historique: result2.historique
								};
							}
							res.json(data);
						}
					});
				}
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
					res.status(404);
					res.json({
						message: "This monnaie doesn't exists !"
					});
				} else {
					if(req.body.amount != null && !isNaN(parseFloat(req.body.amount)) && req.body.amount > 0) {
						var amount = parseFloat(req.body.amount);
						var lastValueInEuro = monnaie.historique[monnaie.historique.length-1].price;
						var equivalentEnCrypto = amount / lastValueInEuro;
						// On cherche le portefeuille actuelle en EUROS de la personne
						portefeuilleCollection.findOne({name: "EUR"}, function(err, euros) {
							// Si le solde est insuffisant
							if(euros == null || euros.solde <= amount) {
								res.json({
									message: "Your amount in EUR is not sufficient"
								});
							} else {
								// Sinon
								var time = new Date().getTime(); // Timestamp de la requête
								var newSolde = equivalentEnCrypto; // Le nouveau solde de la monnaie désirée converti via l'euro
								var newSoldeEuros = euros.solde - amount; // Le nouveau solde euros
								var newHistorique = [{time: time, operation: '+ '+newSolde}];

								portefeuilleCollection.findOne({name: monnaie.name}, function(err, portefeuilleMonnaie) {
									if(portefeuilleMonnaie != null) {
										newSolde = portefeuilleMonnaie.solde += equivalentEnCrypto;
										var temp = portefeuilleMonnaie.historique;
										temp.push({time: time, operation: '+ '+equivalentEnCrypto});
										newHistorique = temp;
									}

									// On utilise un UPSERT : on fait un update si ça existe déjà, sinon on INSERT
									portefeuilleCollection.updateOne({name: monnaie.name}, {$set: {solde: newSolde, historique: newHistorique}}, {upsert: true});
									// On met à jour notre portefeuille d'euros
									portefeuilleCollection.updateOne({name: "EUR"}, {$set: {solde: newSoldeEuros}});

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
						res.status(400);
						res.json({
							message: "The amount need to be a correct float"
						});
					}
				}
			}
		});
	});
}