var express = require('express');
var middlewares = require('./middlewares');
var Parking = require('../models/parkings').Parking;
var Lot = require('../models/lots').Lot;
var util = require('util');
var _ = require('underscore')._;
var router = express.Router();



router.use(middlewares.parsePagination);
router.use(middlewares.parseFields);


/**
 * @apiDefine  NotFound
 * @apiError 404 the Object with specified <code>id</code> was not found.
 */

/**
 * @apiDefine  Unauthorized
 * @apiError 401 not authorized to call this endpoint.
 * @apiErrorExample Error-Response: 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *      {
 *          error:'not authorized to call this endpoint'
 *      }
 */


/**
 * @apiDefine Parking
 * @apiSuccess {String} _id Parking identifier
 * @apiSuccess {String} description Parking description
 * @apiSuccess {String} address Parking address
 * @apiSuccess {String} city city where the Parking is located
 * @apiSuccess {String} serverType kind of parking
 * @apiSuccess {Boolean} reservable True if parking allows reservation
 * @apiSuccess {Object[]} admins parking admin users
 * @apiSuccess {Dictionary} stats a struct with lots availability info
 * @apiSuccess {Number} stats.freeLots total free lots available
 * @apiSuccess {Number} stats.occupiedLots total currently occupied lots
 * @apiSuccess {Number} stats.reservedLots total reserved lots
 * @apiSuccess {Number} stats.notAvailableLots number of not available lots
 * @apiSuccess {Dictionary} location geographic coordinates
 * @apiSuccess {Number[]} location.coordinates  Longitude and latitude or a polygon vertex
 * @apiSuccess {String} location.type The type of geo representation, "Point" by default
 * @apiSuccess {String} serverURL the parking api url the core must use to reserve a parking
 * @apiSuccess {Number} validity duration of the validity of reservation for the parking
 * @apiSuccess {String} web the parking website
 * @apiSuccess {String} img the parking image
 */

/**
 * @apiDefine metadata
 * @apiSuccess {skip} metadata.skip  description
 * @apiSuccess {limit} metadata.limit  description
 * @apiSuccess {totalCount} metadata.totalCount description
 */

/**
 * @apiDefine ParkingList
 * @apiSuccess {Object[]} parkings a paginated list of Parking objects
 *
 */


/**
 * @api {get} /parkings Get the list of available Parkings
 * @apiVersion 1.0.0
 * @apiName GetParkingslist
 * @apiGroup Parkings
 *
 * @apiDescription Returns the paginated list of all Parkings accessible to the user identified by access_token
 *
 *
 *
 * @apiUse ParkingList
 *
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *
 *     {
 *       "parkings":[ {
 *                   "_id": "543fdd60579e1281b8f6da92",
 *                   "description": "Parcheggio Blu Cammino Nuovo",
 *                   "address": "via Cammino Nuovo",
 *                   "city": "Cagliari",
 *                   "serverType": "IPM",
 *                   "admins": [],
 *                   "stats": {
 *                      "notAvailableLots": 0,
 *                      "reservedLots": 0,
 *                      "occupiedLots": 175,
 *                      "freeLots": 5
 *                   },
 *                   "ltReservable": false,
 *                   "reservable": false,
 *                   "img": "http://example/parcheggio1-open-e1413295457991.jpg",
 *                   "hours": [
 *                      "9-13;16:20"
 *                   ],
 *                   "days": [
 *                      "Mon-Sat"
 *                   ],
 *                   "location": {
 *                       "type": "Point",
 *                       "coordinates": [
 *                           9.114202,
 *                           39.219873
 *                       ]
 *                   }
 *             },{
 *                   "_id": "443fdd60579e1281b8f6da37",
 *                   "description": "Parcheggio Bianco Cammino Nuovo",
 *                   "address": "via Cammino Vecchio",
 *                   "city": "Cagliari",
 *                   "serverType": "IPM",
 *                   "admins": [],
 *                   "stats": {
 *                      "notAvailableLots": 0,
 *                      "reservedLots": 12,
 *                      "occupiedLots": 217,
 *                      "freeLots": 11
 *                   },
 *                   "ltReservable": false,
 *                   "reservable": false,
 *                   "img": "http://example/parcheggio1-open-e1413295457991.jpg",
 *                   "hours": [
 *                      "9-13;16:20"
 *                   ],
 *                   "days": [
 *                      "Mon-Sat"
 *                   ],
 *                   "location": {
 *                       "type": "Point",
 *                       "coordinates": [
 *                           9.1214202,
 *                           39.239873
 *                       ]
 *                   }
 *           },
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

    //TODO: returns ALL parkings, must be changed to return only authorized parking???
    // Authorized users admin/parker/client, so anybody authenticated

    var fields = req.dbQueryFields;
    if (!fields){
        fields = '-lots';
    }else{
        try{
            fields += ' -lots';
        }
        catch(e){
            fields = '-lots';
        }
    }
    var query = {};

    var allowedFields = ["reservable", "city"];
    //console.log(req.query);

     for (var v in req.query)
        if (_.contains( allowedFields, v)) {
            if (typeof Parking.schema.path(v).options.default == "boolean") {  //FIXME: if geoNear each field must be the right type, no internal cast id done
                query[v] = req.query[v] == 'true' ? true : false;
                continue;
            }
            query[v] = req.query[v];
        }


    if ("minFreeLots" in req.query) {
        query["stats.freeLots"] = {"$gte": parseInt(req.query["minFreeLots"])};
    }

    if ("lat" in req.query  &&  "lng" in req.query){
        var meters = 1;
        if ("distance" in req.query) {
            meters = parseInt(req.query["distance"]);
        }

        var lat = parseFloat(req.query["lat"]);
        var lng = parseFloat(req.query["lng"]);

        var near = [ lng, lat ]; // near must be an array of [lng, lat]
        var searchOptions = {
            maxDistance: meters / 6378137,
            spherical : true,
            query : query
        };

        Parking.geoNear({type:"Point", coordinates : near}, searchOptions, function(err,results){
            if(err){return res.status(500).send({ error: 'something blew up, ERROR:'+err  }) }

            var skip = req.dbPagination.skip ||0;
            var limit = req.dbPagination.limit ||50;
            var arrLimit = limit;
            if (!results) return res.status(404).send({error:'no parkings near '+JSON.stringify(near)+' compliant to query '+JSON.stringify(query) });

            if (limit > results.length)
                arrLimit = results.length;
            if (results.length == 0)
                return res.status(404).send({error:'no parkings near '+JSON.stringify(near)+' compliant to query '+JSON.stringify(query) });

            var parkings = [];
            var distances = [];
            for (r in results) {
                var c_res = results[r];
                if (c_res.obj.hasOwnProperty("lots"))
                    delete c_res.obj[lots] ;
                //console.log(c_res);
                parkings.push(c_res.obj);
                distances.push(c_res.dis);
            }

            return res.send({ _metadata: { skip: skip, limit: limit, totalCount: results.length }, "parkings": parkings.slice(skip, arrLimit), distances: distances.slice(skip, arrLimit) });


        });
    } else
        Parking.findAll(query, fields, req.dbPagination, function(err, results){
            if(err){ return res.status(500).send({ error: 'something blew up, ERROR:'+err  }); }

            if (results.parkings.length == 0){
               return res.status(404).send({error:'no parkings compliant to query '+JSON.stringify(query) });
            }

            res.send(results);

        });
});


/**
 * @api {post} /parkings Create a new Parking object
 * @apiVersion 1.0.0
 * @apiName PostParking
 * @apiGroup Parkings
 *
 * @apiDescription Create a new parking in the db
 *
 *
 * @apiSuccessExample {json} Example 201 CREATED
 *      HTTP/1.1 201 CREATED
 *
 *     {
 *                   "_id": "543fdd60579e1281b8f6da92",
 *                   "description": "Parcheggio Blu Cammino Nuovo",
 *                   "address": "via Cammino Nuovo",
 *                   "city": "Cagliari",
 *                   "serverType": "IPM",
 *                   "admins": [],
 *                   "stats": {
 *                      "notAvailableLots": 0,
 *                      "reservedLots": 0,
 *                      "occupiedLots": 175,
 *                      "freeLots": 5
 *                   },
 *                   "ltReservable": false,
 *                   "reservable": false,
 *                   "img": "http://example/parcheggio1-open-e1413295457991.jpg",
 *                   "hours": [
 *                      "9-13;16:20"
 *                   ],
 *                   "days": [
 *                      "Mon-Sat"
 *                   ],
 *                   "location": {
 *                       "type": "Point",
 *                       "coordinates": [
 *                           9.114202,
 *                           39.219873
 *                       ]
 *                   }
 *    }
 *
 *
 * @apiUse Unauthorized
 */


/* POST parking creation. */
router.post('/', function(req, res) {

    // Authorized users admin/parker

//    console.log("querying: " + req.dbQueryFields + "-"+ JSON.stringify(req.dbPagination));

    if (! _.contains(['admin', 'parker'], req.user['type'])  )
       return res.status(401).send({error:'not authorized to call this endpoint'});

    if(!req.body || _.isEmpty(req.body) ) { return res.status(400).send({error:'request body missing'}); }

    Parking.create(req.body, function(err, results){
        if(!err){
            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            if (results) {
                res.set('Location', fullUrl + "/" + results._id);

                res.status(201).send(results);
            }else res.status(500).send({error:'parking not created by values '+JSON.stringify(req.body)});
        }
        else{
            res.status(500).send({ error: 'something blew up, ERROR:'+err  });

        }

    });
});


/**
 * @api {get} /parkings/:id Get information for a single Parking object
 * @apiVersion 1.0.0
 * @apiName GetParking
 * @apiGroup Parkings
 *
 * @apiDescription Returns the paginated list of all Parkings accessible to the user identified by access_token
 *
 * @apiParam {String} id Parking unique id
 *
 * @apiUse Parking
 *
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *
 *     {
 *                   "_id": "543fdd60579e1281b8f6da92",
 *                   "description": "Parcheggio Blu Cammino Nuovo",
 *                   "address": "via Cammino Nuovo",
 *                   "city": "Cagliari",
 *                   "serverType": "IPM",
 *                   "admins": [],
 *                   "stats": {
 *                      "notAvailableLots": 0,
 *                      "reservedLots": 0,
 *                      "occupiedLots": 175,
 *                      "freeLots": 5
 *                   },
 *                   "ltReservable": false,
 *                   "reservable": false,
 *                   "img": "http://example/parcheggio1-open-e1413295457991.jpg",
 *                   "hours": [
 *                      "9-13;16:20"
 *                   ],
 *                   "days": [
 *                      "Mon-Sat"
 *                   ],
 *                   "location": {
 *                       "type": "Point",
 *                       "coordinates": [
 *                           9.114202,
 *                           39.219873
 *                       ]
 *                   }
 *    }
 *
 * @apiUse NotFound
 * @apiUse Unauthorized
 */
router.get('/:id', function(req, res) {

    // Authorized users admin/parker/client, so anybody authenticated

    //  console.log("querying: " + req.dbQueryFields + "-"+ JSON.stringify(req.dbPagination));

    var fields = req.dbQueryFields;
    if (!fields){
        fields = '-lots';
    }else{
        try{
            fields += ' -lots';
        }
        catch(e){
            fields = '-lots';
        }
    }

    var id = req.param('id').toString();
    Parking.findById(id, fields, function(err, results){

        if(!err){
            if (results)
                res.send(results);
            else
                res.status(404).send({error:'no parking found having id '+id});
        }
        else{
            res.status(500).send({ error: 'something blew up, ERROR:'+err  });
        }

    });


});

/**
 * @api {put} /parkings/:id Modify information for a single Parking object
 * @apiVersion 1.0.0
 * @apiName PutParking
 * @apiGroup Parkings
 *
 * @apiDescription Modify the parking information overwriting the existings fields values.
 *
 * @apiParam {String} id Parking unique id
 *
 * @apiUse Parking
 *
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *
 *     {
 *                   "_id": "543fdd60579e1281b8f6da92",
 *                   "description": "Parcheggio Blu Cammino Nuovo",
 *                   "address": "via Cammino Nuovo",
 *                   "city": "Cagliari",
 *                   "serverType": "IPM",
 *                   "admins": [],
 *                   "stats": {
 *                      "notAvailableLots": 0,
 *                      "reservedLots": 0,
 *                      "occupiedLots": 175,
 *                      "freeLots": 5
 *                   },
 *                   "ltReservable": false,
 *                   "reservable": false,
 *                   "img": "http://example/parcheggio1-open-e1413295457991.jpg",
 *                   "hours": [
 *                      "9-13;16:20"
 *                   ],
 *                   "days": [
 *                      "Mon-Sat"
 *                   ],
 *                   "location": {
 *                       "type": "Point",
 *                       "coordinates": [
 *                           9.114202,
 *                           39.219873
 *                       ]
 *                   }
 *    }
 *
 * @apiUse NotFound
 * @apiUse Unauthorized
 */
/* PUT parking by id. */
router.put('/:id', function(req, res) {

    // Authorized users admin/parker(owner)

    //  console.log("querying: " + req.dbQueryFields + "-"+ JSON.stringify(req.dbPagination));

    if(!req.body || _.isEmpty(req.body) ) { return res.status(400).send({error:'request body missing'}); }

    var id = req.param('id').toString();

    var newVals = req.body; // body already parsed
//    ;
//    try {
//
//        newVals  // body already parsed
//    }catch (e){
//        res.status(500).send({error:'no object updated (error:'+e+')'});
//        return;
//    }
    if (req.user['type'] == 'admin'){
        Parking.findOneAndUpdate({_id : id}, newVals,  function(err, results){
            if(!err){
                if (results){
                    return res.send(results);
                }
                else
                   return res.status(404).send({error:'no object found for updating having id '+id});
            } else{

               return res.status(500).send({ error: 'something blew up, ERROR:'+err  });

            }

        });
    } else {
            if (req.user['type'] == 'parker'){
                Parking.findOneAndUpdate({_id:id, admins : req.user._id }, newVals, function(err, results){

                        if(!err){
                            if (results){
                               return res.send(results);
                            }
                            else
                               return res.status(404).send({error:'no object found for updating having id '+id});
                        }
                        else{


                           return res.status(500).send({ error: 'something blew up, ERROR:'+err  });

                        }

                    }



                );
            } else
                return res.status(401).send({error:'Unauthorized: you are not authorized to access this resource'});

        }


});

/**
 * @api {delete} /parkings/:id Remove a single Parking object
 * @apiVersion 1.0.0
 * @apiName DeleteParking
 * @apiGroup Parkings
 *
 * @apiDescription Delete the existing parking with specified id
 *
 * @apiParam {String} id Parking unique id
 *
 *
 *
 * @apiSuccessExample {json} Example: 200 OK, Success Response
 *    HTTP/1.1 200 OK
 *      ok
 *
 * @apiUse NotFound
 * @apiUse Unauthorized
 */
/* DELETE parking by id. */
router.delete('/:id', function(req, res) {

    // Authorized users admin/parker(owner)

    var id = req.param('id').toString();
    var query = {_id: id};
    if (req.user['type'] == 'parker') {
        query['admins'] = req.user._id;
    }
    if ( _.contains(['admin', 'parker'], req.user['type']) ) {
        Parking.findOneAndRemove(query, function (err, results) {
            if (!err) {
                if (results) {
                    res.send('ok');
                }
                else {
                    var message = {error: 'no object found for deletion having id ' + id}
                    res.status(404).send(message);
                }
            }
            else {
                res.status(500).send({ error: 'something blew up, ERROR:' + err  });
            }
        });
    }else
        res.status(401).send({error: 'Unauthorized: you are not authorized to access this resource'});
});

/* GET all the lots of a parking */
router.get('/:id/lots', function(req, res) {

    // Authorized users admin/parker(owner)

    //  console.log("querying: " + req.dbQueryFields + "-"+ JSON.stringify(req.dbPagination));

    var id = req.param('id').toString();

    var query = req.dbQueryFields;
    if (req.user['type'] == 'parker') {
        query['admins'] = req.user._id;
    }
    if ( _.contains(['admin', 'parker'],req.user['type']) ) {
        Parking.findById(id, query, function (err, results) {
            var query = {};
            for (var v in req.query)
                var path = Lot.schema.path(v);
            if (path) {
                query[v] = req.query[v];
                //console.log(v +"  is of type  "+util.inspect(path.options.type) );
            }

            if (!err) {
                if (results)
                    res.send({ lots: results.getLotsByQuery(query) });
                else
                    res.status(404).send({error: 'no lots found for Parking having id ' + id});
            }
            else {
                res.status(500).send({ error: 'something blew up, ERROR:' + err  });

            }

        });
    } else return res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});
});

/* POST new lot in a parking */
router.post('/:id/lots', function(req, res) {

    // Authorized users admin/parker(owner)

    //  console.log("querying: " + req.dbQueryFields + "-"+ JSON.stringify(req.dbPagination));

    if(!req.body || _.isEmpty(req.body) ) { return res.status(400).send({error:'request body missing'}); }
    var newVals = req.body;
    var id = req.param('id').toString();

    var query = {};
    if (req.user['type'] == 'parker') {
        query['admins'] = req.user._id;
    }
    if ( _.contains(['admin', 'parker'], req.user['type']) ) {
         Parking.findById(id, "lots", query, function(err, results) {

            if (!err) {
                if (results) {
                    results.lots.push(new Lot(newVals));
                    results.save(function (err, el) {
                        if (err)
                            res.status(500).send({ error: 'something blew up, ERROR:' + err  });

                        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

                        //var lot =  el.getLotsByQuery(newVals)[0]; //  _.findWhere(el.lots, newVals);
                        var lot = _.filter(el.lots, newVals);

                        if (lot) {
                            res.set('Location', fullUrl + "/" + id + '/lots/' + lot._id);
                            res.status(201).send(lot);
                        } else res.status(404).send({error: 'no lot added to parking having id ' + id});
                    });

                }else
                    res.status(404).send({error: 'no parking found for lot creation, having id ' + id});

            } else {
                res.status(500).send({ error: 'something blew up, ERROR:' + err  });

            }
        });

    } else
        return res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});

});


/* PUT lots by id. */
router.put('/:parkId/lots/:lotId', function(req, res) {

    // Authorized users admin/parker(owner)

    //  console.log("querying: " + req.dbQueryFields + "-"+ JSON.stringify(req.dbPagination));

    if(!req.body || _.isEmpty(req.body) ) { return res.status(400).send({error:'request body missing'}); }
//    console.log("BODYYYYYYyìYYYY");
//    console.log(req.body);
    var id = req.param('lotId').toString();

    var newVals;
    try {
        newVals = req.body; // body already parsed
    }catch (e){
        res.status(500).send({error:'no object updated (error:'+e+')'});
        return;
    }

    var parkId = req.param('parkId').toString();

    var query = {};
    if (req.user['type'] == 'parker') {
        query['admins'] = req.user._id;
    }
    if ( _.contains(['admin', 'parker'], req.user['type']) ) {

        Parking.findById(parkId, 'lots', query, function (err, mypark) {
            if (err)
                res.status(500).send({ error: 'something blew up, ERROR:' + err  });

            if (!mypark) {
                res.status(404).send({error: 'no parking found for lot update, having id ' + parkId});
            }

            var lot = mypark.lots.id(id);
            if (!lot) res.status(404).send({error: 'no lot found for update, having id ' + id});
            var index = mypark.lots.indexOf(lot);
            if (index === undefined || index < 0) res.status(404).send({error: 'no lot found for update, having id ' + id + ' in parking having id ' + parkId});
            _.extend(lot, newVals);

            mypark.lots.set(index, lot); // update the lot

            mypark.save(function (err, results) {
                if (!err) {
                    if (results) {
                        res.send(results.lots.id(id));
                    }
                    else
                        res.status(404).send({error: 'no lot updated having id ' + id});
                }
                else {
                    res.status(500).send({ error: 'something blew up updating lot having id ' + id + ', ERROR:' + err  });

                }

            });
        });
    }else
        return res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});

});

/* DELETE parking by id. */
router.delete('/:parkId/lots/:lotId', function(req, res) {

    // Authorized users admin/parker(owner)

    var id = req.param('lotId').toString();
    var parkId = req.param('parkId').toString();

    var query = {};
    if (req.user['type'] == 'parker') {
        query['admins'] = req.user._id;
    }
    if ( _.contains(['admin', 'parker'], req.user['type']) ) {

        Parking.findById(parkId, 'lots', query, function (err, mypark) { //FIXME: avoid query and use pop or similar
            if (err)
                res.status(500).send({ error: 'something blew up, ERROR:' + err  });

            if (!mypark) {
                res.status(404).send({error: 'no parking found for lot deletion, having id ' + parkId});
            }

            var lot = mypark.lots.id(id).remove();

            mypark.save(function (err, results) {
                if (!err) {
                    if (results) {
                        res.send("ok");
                    }
                    else
                        res.status(500).send({error: 'no lot deleted having id ' + id + ', in parking having id ' + parkId});
                }
                else {
                    res.status(500).send({ error: 'something blew up, ERROR:' + err  });

                }

            });
        });
    } else  res.status(401).send({ error: 'Unauthorized: you are not authorized to access this resource'});
});


module.exports = router;
