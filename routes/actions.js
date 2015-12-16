var express = require('express');
var middlewares = require('./middlewares');
var Reservation = require('../models/reservations').Reservation;
var Parking = require('../models/parkings').Parking;
var Car = require('../models/cars').Car;
var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var request = require('request');
var async = require('async');


router.use(middlewares.parsePagination);
router.use(middlewares.parseFields);






/* POST reservation creation. */
router.post('/reservation/CarOut', function(req, res) {

    // Autorized: admin/client(owner)


    if (req.user['type'] == 'parker')
        return  res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});


    if(!req.body || _.isEmpty(req.body)) {
        return res.status(400).send({error:'request body missing'});
    }
    else {
        var elem = req.body;

        if ((req.user['type'] == 'client' && _.contains(req.user['cars'], elem['car'])) ||
            req.user['type']=='admin') {

        }

    }
});




module.exports = router;
