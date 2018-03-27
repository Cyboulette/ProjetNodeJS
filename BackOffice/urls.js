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

	// ammount = le montant en EUR
	app.post('/api/portefeuille/:monnaie', function(req, res, next) {
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
					if(req.body.ammount != null && !isNaN(parseFloat(req.body.ammount))) {
						var ammount = parseFloat(req.body.ammount);
						portefeuilleCollection.findOne({name: "EUR"}, function(err, result2) {
							if(result2 == null || result2.solde <= ammount) {
								res.json({
									message: "Your ammount in EUR is not sufficient"
								});
							} else {
								res.json({
									message: "gg",
									soldeRestant: result2.solde
								})
							}
						});
						/*var ammount = parseFloat(req.body.ammount);
						res.json({
							message: "GG",
							ammount: ammount
						});*/
					} else {
						res.status(400);
						res.json({
							message: "The ammount need to be a correct float"
						});
					}
				}
			}
		});
	});

	/*
		TODO :
			- Historique de transactions dans le portefeuille
			
	*/
}