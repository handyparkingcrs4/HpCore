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




/**
 * @apiDefine  ReservationNotFound
 * @apiError 404 the Reservation with specified <code>id</code> was not found.
 */

/**
 * @apiDefine Reservation
 * @apiSuccess {Object} Reservation.car The Car involved in the reservation
 * @apiSuccess {Object} Reservation.parking the reserved Parking
 * @apiSuccess {lot} [Reservation.lot] id of the reserved Lot
 * @apiSuccess {String} date Reservation date
 * @apiSuccess {Number} validity Reservation validity time in milliseconds
 * @apiSuccess {String} dateIn Car check-in date
 * @apiSuccess {String} dateOut Car check-out date
 * @apiSuccess {String} [notes] notes and remarks about the Reservation
 */

/**
 * @apiDefine metadata
 * @apiSuccess {skip} metadata.skip  description
 * @apiSuccess {limit} metadata.limit  description
 * @apiSuccess {totalCount} metadata.totalCount description
 */

/**
 * @apiDefine ReservationsList
 * @apiSuccess {Object[]} reservations a paginated list of Reservation objects
 *
 */


/**
 * @api {get} /reservations List Reservations
 * @apiVersion 1.0.0
 * @apiName GetReservationslist
 * @apiGroup Reservations
 *
 * @apiDescription Returns the paginated list of all Reservations accessible to the user identified by access_token
 *
 *
 *
 * @apiUse ReservationsList
 *
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *
 *     {
 *       "reservations":[
 *                   ...
 *                  ],
 *
 *       "_metadata":{
                    "skip":10,
                    "limit":50,
                    "totalCount":1500
                }
 *    }
 *
 */
router.get('/', function(req, res) {

    //Authorized: admin/parker(owner)/client(owner)

    var fields = req.dbQueryFields;

    var query = {};
    for (var v in req.query)
        if (Reservation.schema.path(v))
            query[v] = req.query[v];

    if (req.user['type']=='admin') {
        Reservation.findAllPopulated(query, fields, req.dbPagination, {car:["_id", "carplate"], parking:["_id", "description", "address", "city"]}, function (err, results) {
            // Reservation.findAll(query, fields, req.dbPagination, function (err, results) {

            if (!err) {

                if (results) {
                    res.status(200).send(results);
                }
                else {
                    res.status(204).send(); // no content
                }
            }
            else {
                res.status(500).send({ error: 'something blew up, ERROR:' + err  });
            }

        });
    }else  if (req.user['type']=='client') {
        //    console.log(req.user);
        //    Reservation.find(query)
        //        .populate('car')
        //        .where('car').in(req.user.cars)
        //        .populate('parking')
        //      //  .skip(req.dbPagination.skip).limit(req.dbPagination.limit)
        //        .exec(function (err, results) {
        //  //          console.log(results);
        //            var skip = req.dbPagination.skip ,
        //                limit = req.dbPagination.limit;
        //            if (!err) {
        //
        //                if (results && results && results.length > 0) {
        //                    res.status(200).send({_metadata:{skip:skip,limit:limit, totalCount:results.length},reservations: results.slice(skip,skip+limit)});
        //                }
        //                else {
        //                    res.status(204).end(); // no content
        //                }
        //            }
        //            else {
        //                console.log(err);
        //                res.status(500).send({ error: 'something blew up, ERROR:' + err  });
        //            }
        //
        //        });
        query['car'] = req.user.cars;
        Reservation.findAllPopulated(query, fields, req.dbPagination, {car:["_id", "carplate"], parking:["_id", "description", "address", "city"]}, function (err, results) {
            // Reservation.findAll(query, fields, req.dbPagination, function (err, results) {

            if (!err) {

                if (results && results.reservations.length > 0) {
                    res.status(200).send(results);
                }
                else {
                    res.status(204).end(); // no content
                }
            }
            else {
                res.status(500).send({ error: 'something blew up, ERROR:' + err  });
            }

        });



    }else  if (req.user['type']=='parker') {
        Parking.find({'admins': req.user._id}).select('_id').exec(function (err, values) {

            var ids = [];
            for (var i in values) {
                ids.push(values[i]._id);
            }
//            Reservation.find(query)
//                .populate('car')
//                .populate('parking')
//                .where('parking').in(ids)
//                .select(fields)
////                .skip(req.dbPagination.skip).limit(req.dbPagination.limit)
//                .exec(function (err, results) {
//                    var skip = req.dbPagination.skip ,
//                        limit = req.dbPagination.limit;
//                    if (!err) {
//
//                        if (results && results && results.length > 0) {
//                            res.status(200).send({_metadata:{skip:skip, limit:limit, totalCount:results.length}, reservations:results.slice(skip, skip+limit)});
//                        }
//                        else {
//                            res.status(204).end(); // no content
//                        }
//                    }
//                    else {
//                        console.log(err);
//                        res.status(500).send({ error: 'something blew up, ERROR:' + err  });
//                    }
//
//                });
            query['parking'] = ids;
            Reservation.findAllPopulated(query, fields, req.dbPagination, {car:["_id", "carplate"], parking:["_id", "description", "address", "city"]}, function (err, results) {
                // Reservation.findAll(query, fields, req.dbPagination, function (err, results) {

                if (!err) {

                    if (results && results.reservations.length > 0) {
                        res.status(200).send(results);
                    }
                    else {
                        res.status(204).end(); // no content
                    }
                }
                else {
                    res.status(500).send({ error: 'something blew up, ERROR:' + err  });
                }

            });

        });
    } else res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});

});


function deleteMyInvalidReservation(id){
    //delete on mongo
    //TODO: if the delete fails then shoulb be repeated
    Reservation.findByIdAndRemove(id, function (err, results) {
        if (!err) {
            if (!results)
                console.log('error: no reservation found with specified id');
            throw 'error: no reservation found with specified id';
        }
        else {
            console.log('something blew up, ERROR:' + err);
            throw err;
        }
    });
}

/* POST reservation creation. */
router.post('/', function(req, res) {

    // Autorized: admin/client(owner)


    if (req.user['type'] == 'parker')
        return  res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});


    if(!req.body || _.isEmpty(req.body)) {
        return res.status(400).send({error:'request body missing'});
    }
    else {
        var elem = req.body;

        if ((req.user['type'] == 'client' && _.contains(req.user['cars'], elem['car'])) ||
            req.user['type']=='admin')

        {
            async.series({

                parkingURL: function (callback) {

                    Parking.findById(req.body.parking, function (err, parking) {

                        if (!err) {
                            callback(null, parking.serverURL);
                        }
                        else {
                            callback(err, null);
                        }
                    });

                },

                carplate: function (callback) {

                    Car.findById(req.body.car, function (err, car) {

                        if (!err) {
                            callback(null, car.carplate);
                        }
                        else {
                            callback(err, null);
                        }
                    });

                }

            }, function(err, results){

                if(err) {
                    console.log('ERROR: '+err);
                    res.status(500).send({error: 'something blew up, check carplate and/or parking:' + err});

                }
                else {

                    if (results.parkingURL) {

                        Reservation.create(elem, function (err, reserv) {
                            if (!err) {

                                request.post({ url: results.parkingURL + '/reservations',
                                    body: JSON.stringify({coreId: reserv._id, carplate: results.carplate, notes: req.body.notes || ''}),//{_id:reserv._id,carplate: results.carplate, notes:req.body.notes || ''},
                                    headers: {'content-type': 'application/json'}//,'Authorization' : "Bearer "+ token}
                                }, function (error, response, body) {

                                    if (error) {
                                        res.status(500).send({error: 'something blew up, check carplate and/or parking'});
                                    } else {
                                        switch (response.statusCode()) {

                                            case 400:
                                                deleteMyInvalidReservation(reserv._id);
                                                res.status(400).send(body);
                                                break;

                                            case 423:
                                                deleteMyInvalidReservation(reserv._id);
                                                res.status(423).send(body);
                                                break;

                                            case 409:
                                                deleteMyInvalidReservation(reserv._id);
                                                res.status(409).send(body);
                                                break;

                                            case 201:
                                                var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                                res.set('Location', fullUrl + "/" + reserv._id);
                                                res.status(201).send(reserv);
                                                break;
                                            default://500
                                                deleteMyInvalidReservation(reserv._id);
                                                res.status(500).send(body);
                                                break;
                                        }
                                    }

                                });
                            } else {
                                deleteMyInvalidReservation(reserv._id);
                                res.status(500).send({error: 'something blew up, ERROR:' + err});
                            }
                        });
                    }else{
                        //var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                        //res.set('Location', fullUrl + "/" + reserv._id);
                        return res.status(504).send({error: 'reservation not created, due to ARP Server not configured'});
                    }
                }
            });
        }
        else{
            res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});
        }

    }
});


/**
 * @api {get} /reservations/:id Get a Reservation
 * @apiVersion 1.0.0
 * @apiName GetReservation
 * @apiGroup Reservations
 *
 * @apiDescription Returns a Reservation
 *
 * @apiParam {String} id Reservation unique id
 *
 * @apiUse Reservation
 *
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *
 *     {
 *            "car": "12345abcd",
 *            "parking": "7890abcd4",
 *            "date": "2014-12-04T08:59:36.474Z",
 *            "validity": 10000,
 *            "dateIn": "2014-12-04T09:59:36.474Z",
 *            "dateOut": "2014-12-04T11:59:36.474Z",
 *            "notes" : "A nice reservation"
 *
 *    }
 *
 * @apiUse ReservationNotFound
 */
router.get('/:id', function(req, res) {

    //Authorized admin/parker(owner)/client(owner)


    var fields = req.dbQueryFields;
    var id = req.param('id').toString();
    var query = {'_id':id};

    if (req.user['type']=='admin') {
        Reservation.findById(id, fields, function (err, results) {
            if (!err) {
                if (results) res.status(200).send(results);
                else res.status(404).send({error: 'no reservation found with specified id'});
            }
            else {
                res.status(500).send({error: 'something blew up, ERROR:' + err});
            }

        });
    }else if (req.user['type']=='client') {
        Reservation.find(query)
            .where('car').in(req.user.cars)
            //  .skip(req.dbPagination.skip).limit(req.dbPagination.limit)
            .exec(function (err, results) {
                var skip = req.dbPagination.skip ,
                    limit = req.dbPagination.limit;
                if (!err) {

                    if (results && results && results.length > 0) {
                        res.status(200).send({_metadata:{skip:skip,limit:limit, totalCount:results.length},reservations: results.slice(skip,skip+limit)});
                    }
                    else {
                        res.status(204).end(); // no content
                    }
                }
                else {
                    console.log(err);
                    res.status(500).send({ error: 'something blew up, ERROR:' + err  });
                }

            });

    }else   if (req.user['type']=='parker') {
        Parking.find({'admins': req.user._id}).select('_id').exec(function (err, values) {

            var ids = [];
            for (var i in values) {
                ids.push(values[i]._id);
            }
            Reservation.find(query)
                .where('parking').in(ids)
                .select(fields)
//                .skip(req.dbPagination.skip).limit(req.dbPagination.limit)
                .exec(function (err, results) {
                    var skip = req.dbPagination.skip ,
                        limit = req.dbPagination.limit;
                    if (!err) {

                        if (results && results && results.length > 0) {
                            res.status(200).send({_metadata:{skip:skip, limit:limit, totalCount:results.length}, reservations:results.slice(skip, skip+limit)});
                        }
                        else {
                            res.status(204).end(); // no content
                        }
                    }
                    else {
                        console.log(err);
                        res.status(500).send({ error: 'something blew up, ERROR:' + err  });
                    }

                });


        });
    } else res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});




});




function verifyUpdatableFields(body){

    var boolValue=true;
    for (val in body){
        switch (val) {
            case "notes":
            case "date" :
            case "dateIn":
            case "dateOut":
                //NOP
                break;
            default:
                boolValue=false;
        }
    }

    return(boolValue);
}

/* PUT, update reservation by id. */

router.put('/:id', function(req, res) {

    //Authorization admin


    if(!req.body || _.isEmpty(req.body)) { return res.status(400).send({error:'request body missing'}); }

    if(!verifyUpdatableFields(req.body)) { return res.status(400).send({error:'invalid upgradable fields in body'}); }

    var id = req.param('id').toString();


    if (req.user['type'] != 'admin')
        return  res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});

    var newVals;
    try {
        newVals = req.body; // body already parsed
        Reservation.findOneAndUpdate({_id:id}, newVals, {new: true}, function(err, results){

            if(!err){
                if (results){
                    res.status(200).send(results);
                }
                else{

                    res.status(404).send({error:'no reservation found with specified id'});

                }

            }
            else{
                console.log("ERROR:", err);
                res.status(500).send({ error: 'something blew up, ERROR:'+err  });

            }

        });
    }catch (e){
        res.status(500).send({ error: 'something blew up, ERROR:'+e  });
    }
});


/* DELETE reservation by id. */
router.delete('/:id', function(req, res) {

    // Authorized: admin/client(owner)

    var id = req.param('id').toString();
    var query = {_id: id};
    if (req.user['type']=='admin') {

        deleteReservation(id, res);


    }else if (req.user['type']=='client') {
        Reservation.find(query)
            .where('car').in(req.user.cars)
            .exec(function (err, results) {
                if (!err) {
                    deleteReservation(id, res);
                }
                else {
                    res.status(500).send({ error: 'something blew up, ERROR:' + err  });
                }

            });

    } else {
        res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});
    }
});



function deleteReservation(id, res){


    Reservation.findById(id, function(err, reserv){

        if(!err && reserv){

            async.series({

                parkingURL: function (callback) {

                    Parking.findById(reserv.parking, function (err, parking) {

                        if (!err) {
                            callback(null, parking.serverURL);
                        }
                        else {
                            callback(err, null);
                        }
                    });

                },

                carplate: function (callback) {

                    Car.findById(reserv.car, function (err, car) {

                        if (!err) {
                            callback(null, car.carplate);
                        }
                        else {
                            callback(err, null);
                        }
                    });

                }

            }, function(err, results){

                if(results.serverURL) {
                    request.post(results.parkingURL + '/reservations/actions/deleteByCarplate?carplate=' + results.carplate, function (error, response, body) {

                        if (error) {
                            res.status(500).send({error: 'something blew up, check carplate or URL'});
                        }
                        else {

                            switch (response.statusCode()) {

                                case 404:
                                    res.status(404).send(body);
                                    break;


                                case 500:
                                    res.status(500).send(body);
                                    break;


                                case 200:

                                    //delete on mongo
                                    Reservation.findByIdAndRemove(id, function (err, results) {
                                        if (!err) {
                                            if (results) {
                                                res.status(200).end();
                                            }
                                            else
                                                res.status(404).send({error: 'no reservation found with specified id'});
                                        }
                                        else {
                                            res.status(500).send({error: 'something blew up, ERROR:' + err});
                                        }

                                    });


                                    break;
                                default:
                            }

                        }

                    });//del
                }else{
                    return  res.status(504).send({error: 'reservation not created, due to ARP Server not configured'});
                }
            });
        }else{
            if(err) res.status(500).send({ error: 'something blew up, ERROR:' + err  });
            else res.status(404).send({error: 'no reservation found with specified id'});

        }

    });





}



module.exports = router;
