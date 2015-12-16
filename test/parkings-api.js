var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Parking = require('../models/parkings').Parking;
var User = require('../models/users').User;
//var Lot = require('../models/lots').Lot;
var l = require('../models/lots');
var request = require('request');
var app = require('../app');
var util = require('util');

var APIURL = 'http://localhost:3000';

var server;
var token;

var adminUser;

var parkerUser;
var parkerToken;

describe('Parking API', function(){

    before(function(done){

        db.connect(function(){

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function() {
                console.log('TEST Express server listening on port ' + server.address().port);

                adminUser = new User( {name:"pippo", email:"pippo@pippo.it", type:'admin'} );
                User.register(adminUser, "nascosta", function(err, val){
                        if(err) throw err;
                        var body = "username=pippo@pippo.it&password=nascosta";  //FIXME: plain, no json

                        request.post({ url:APIURL +"/token",
                                body:body,
                                headers:  {'content-type': 'application/x-www-form-urlencoded'}},
                            function(err,res,body) {
                                if (err) throw err;
                                var data = JSON.parse(body);
                                token = data.token;

                                parkerUser = new User({name: "pluto", email: "pluto@pluto.it", type: 'parker'});
                                User.register(parkerUser, "nascosta", function (err, val) {
                                    parkerUser = val;
                                    if (err) throw err;
                                    var body = "username=pluto@pluto.it&password=nascosta";
                                    request.post({ url:APIURL +"/token",
                                        body:body,
                                        headers:  {'content-type': 'application/x-www-form-urlencoded'}},function(err,res,body) {
                                        if (err) throw err;
                                        var data = JSON.parse(body);
                                        parkerToken = data.token;
                                        done();
                                    });
                                });
                            });
                    });
            });

        });

    });

    after(function(done){
        User.remove({},function(){
            db.disconnect(function(){
                done();
            });
            server.close();

        });
    });




    beforeEach(function(done){


        var range = _.range(99);

        async.each(range, function(e,cb){
            park = new Parking({
                description : 'A'+e,
//                    location : {
//                      lat : 39.219245,
//                      lng : 9.1143858
//                    },
                address : 'Via Cammino Nuovo'+e,
                city : 'Cagliari',
                locationDescr : 'Via Cammino Nuovo'+e+' , Cagliari',
                pricePerHour : {},
                //location : [9.0113308,39.1254313],
                location :{coordinates:[39.9667468,9.6642528]} , //autocarr lng, lat

                lots : [],
                stats : {
                    freeLots : 0,
                    occupiedLots : 0,
                    reservedLots : 0
                },
                admins : [],
                serverURL : '',
                serverType : "ARP"
            });

            park.save(function(err, product){
                if (err) throw err;
                cb();

            });

        }, function(err){

            var mypark = new Parking({
                _id : "541ae25819baa50000d8fe00",
                description : 'Simple parking',
//              location : {
//                  lat : 39.219245,
//                  lng : 9.1143858
//              },
                address : 'Via Cammino Nuovissimo',
                city : 'Casteddu',
                //      locationDescr : 'Via Cammino Nuovissimo, Cagliari',
                pricePerHour : {},
                location : {coordinates:[39.9687032,9.6619032]}, //lont
                lots : [],
                stats : {
                    freeLots : 0,
                    occupiedLots : 0,
                    reservedLots : 0
                },
                admins : [parkerUser._id],
                serverURL : '',
                serverType : "IPM"
            });

            mypark.addSimpleFreeLots(19);
            mypark.addLot({"_id":"999ae25819baa50000d99999","status":"occupied"});
            mypark.save(function(err, product){
                if (err) throw err;
                done();

            });

        });
    });

    afterEach(function(done){
        Parking.remove(function(err, product){
            if(err) throw err;

            l.Lot.remove(function(err, product){
                if (err) throw err;
                done();
            });

        });

    });



    describe('GET /parkings', function(){

        it('must return 2 parkings and _metadata, all fields', function(done){

            request.get({url:APIURL+'/parkings?skip=0&limit=2',headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
//                      console.log('FROM API:' + body);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(2);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(2);
                    results._metadata.totalCount.should.be.equal(100);
                    should.not.exist(results.parkings[0].lots);
                }

                done();

            });

        });

    });

    describe('GET /parkings', function(){

        it('must return 1 parkings and _metadata, all fields, city=Casteddu', function(done){

            request.get({url:APIURL+'/parkings?skip=0&limit=2&city=Casteddu',headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
//                      console.log('FROM API:' + body);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(1);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(2);
                    results._metadata.totalCount.should.be.equal(1);
                    should.not.exist(results.parkings[0].lots);
                }

                done();

            });

        });

    });


    describe('GET /parkings?skip=0&limit=2&city=London', function(){

        it('must return 404 error', function(done){

            request.get({url:APIURL+'/parkings?skip=0&limit=2&city=London',headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(404);

                }

                done();

            });

        });

    });

    describe('GET /parkings?minFreeLots=1', function(){

        it('must return 1 parkings and _metadata, all fields, minFreeLots=1', function(done){

            request.get({url:APIURL+'/parkings?minFreeLots=1&skip=0&limit=2', headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
//                      console.log('FROM API:' + body);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(1);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(2);
                    results._metadata.totalCount.should.be.equal(1);
                    results.parkings[0].stats.freeLots.should.be.above(0);
                    should.not.exist(results.parkings[0].lots);
                }

                done();

            });

        });

    });

    describe('GET /parkings?skip=badname&limit=badcas', function(){

        it('must return default skip and limit', function(done){

            request.get({url:APIURL+'/parkings?skip=badname&limit=badcas',headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                  //  results._metadata.skip.should.be.equal(0);
                //    results._metadata.limit.should.be.equal(50);
                }

                done();

            });

        });

    });

    describe('GET /parkings?distance=450&lng=39.967293&lat=9.6587404&skip=0&limit=20', function(){

        it('must return 1 parking and _metadata, all fields, by coordinates and distance in meters ', function(done){

            request.get({url:APIURL+'/parkings?distance=450&lng=39.967293&lat=9.6587404&skip=0&limit=20',headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                //    console.log(results);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(1);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(20);
                    results._metadata.totalCount.should.be.equal(1);

                }

                done();

            });

        });

    });


    describe('GET /parkings?distance=450&lng=39.967293&lat=9.6587404&skip=0&limit=20&reservable=false', function(){

        it('must return 1 parking and _metadata, all fields, by coordinates and distance in meters, reservables ', function(done){

            request.get({url:APIURL+'/parkings?distance=450&lng=39.967293&lat=9.6587404&skip=0&limit=20&reservable=false',headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                    //    console.log(results);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(1);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(20);
                    results._metadata.totalCount.should.be.equal(1);

                }

                done();

            });

        });

    });

    describe('GET /parkings?distance=450&lng=-109.6587404&lat=89.967293&skip=0&limit=20&reservable=false', function(){

        it('must return 0 parkings and _metadata, all fields, by coordinates and distance in meters, reservables ', function(done){

            request.get({url:APIURL+'/parkings?distance=320&lng=-109.6587404&lat=89.967293&&skip=0&limit=20&reservable=false',headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(404);
//                    var results = JSON.parse(body);
//                        console.log(results);
//                    results.should.have.property('_metadata');
//                    results.should.have.property('parkings');
//                    results.parkings.length.should.be.equal(0);
//                    results._metadata.skip.should.be.equal(0);
//                    results._metadata.limit.should.be.equal(20);
//                    results._metadata.totalCount.should.be.equal(0);

                }

                done();

            });

        });

    });



    describe('POST /parkings', function(){

        it('must add a new parking', function(done){
            var data = {

                "description" : "Simple parking",
                "location" : {
                    "type": "Point",
                    "coordinates" :[ 9.1143858, 39.219245]
                },
                "address":"Via Cammino Aggiunto",
                "city":"Cagliari",
                //     "locationDescr" : "Via Cammino Aggiunto, Cagliari",
                "pricePerHour" : {},

                "lots" : [],
                "stats" : {
                    "freeLots" : 0,
                    "occupiedLots" : 0,
                    "reservedLots" : 0
                },
                "admins" : [],
                "serverURL" : "",
                "serverType" : "IPM"
            };
            var dString = JSON.stringify(data);
            var url = APIURL+'/parkings';
            request.post({ url : url,
                body : dString,
                headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}
            }, function(error, response){


                if(error) throw error;
                else{
                    response.statusCode.should.be.equal(201);
                    should.exist(response.headers.location );

                    var results = JSON.parse(response.body);
                    results.should.have.property('description');
                    results.description.should.be.equal(data.description);

                }

                done();

            });

        });

    });

    describe('GET /parkings/:id', function(){

        it('must return the parking by id, all fields', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id;
            request.get({url:url,headers:{'Authorization' : "Bearer "+ token}},function(error, response, body){
                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                    //results.locationDescr.should.be.equal('Via Cammino Nuovissimo, Cagliari');
                    results.address.should.be.equal("Via Cammino Nuovissimo");
                    results.city.should.be.equal("Casteddu");
                    should.not.exist(results.lots);

                }

                done();
            });

        });
    });

    describe('PUT /parkings/:id  by user of type Admin', function(){

        it('must update the parking having id, with new fields values', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id;
            var newVals = JSON.stringify({'description':'Via del Nuovo Cammino'});


            request.put({ url: url, body: newVals, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}},function(error, response, body){

                if(error) throw err;
                else{
                    var results = JSON.parse(body);

                    response.statusCode.should.be.equal(200);
                    results.description.should.be.equal('Via del Nuovo Cammino');
                    results.address.should.be.equal("Via Cammino Nuovissimo");
                    results.city.should.be.equal("Casteddu");
                }

                done();
            });


        });
    });

    describe('PUT /parkings/:id by user of type Parker (owner of parking)', function(){

        it('must update the parking having id, with new fields values', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id;
            var newVals = JSON.stringify({'description':'Via del Nuovo Cammino Parker'});


            request.put({ url: url, body: newVals, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ parkerToken}},function(error, response, body){

                if(error) throw err;
                else{
                    var results = JSON.parse(body);

                    response.statusCode.should.be.equal(200);
                    results.description.should.be.equal('Via del Nuovo Cammino Parker');
                    results.address.should.be.equal("Via Cammino Nuovissimo");
                    results.city.should.be.equal("Casteddu");
                }

                done();
            });


        });
    });

    describe('DELETE /parkings/:id  by user of type Admin', function(){

        it('must delete a parking by id', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id;

            //     console.log(typeof newVals);
            //util.inspect(newVals);
            Parking.findOne({},function(err,park) {
                if (err) throw  err;
                var url = APIURL+'/parkings/'+park._id;
         //       console.log(url);
                request.del({url: url, headers: {'Authorization': "Bearer " + token}},  function (error, response, body) {
               //     console.log(response);
                    if (error) throw error;
                    else {
                        response.statusCode.should.be.equal(200);
                        body.should.be.equal('ok');
                    }

                    done();
                });
            });

        });
    });

    describe('DELETE /parkings/:id by user of type Parker (owner of parking)', function(){

        it('must delete a parking by id', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id;

            //     console.log(typeof newVals);
            //util.inspect(newVals);

            request.del({url:url, headers:{'Authorization' : "Bearer "+ parkerToken}}, function(error, response, body){
                if(error) throw error;
                else{
                    response.statusCode.should.be.equal(200);
                    body.should.be.equal('ok');
                }
                done();
            });


        });
    });

    describe('GET /parkings/:id/lots', function(){

        it('must return the lots of parking by id', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id+'/lots';
            request.get({url:url,headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){
                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);

                }

                done();
            });

        });
    });

    describe('GET /parkings/:id/lots', function(){

        it('must return the free lots of parking by id', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id+'/lots?status=free&reservable=false';
            request.get({url:url,headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){
                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
              //      console.log(results);

                }

                done();
            });

        });
    });


    describe('POST /parkings/:id/lots', function(){

        it('must add a lot in parking by id', function(done){

            var id = '541ae25819baa50000d8fe00';
            var url = APIURL+'/parkings/'+id+'/lots';
            var lot = {

                description : 'a lot'
            };
            request.post({url:url,
                headers: {'content-type': 'application/json', 'Authorization' : "Bearer "+ token},
                body: JSON.stringify(lot)
            }, function(error, response, body){
                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(201);
                    should.exist(response.headers.location);
                    var results = JSON.parse(body);
//                    console.log(results);
                    results.length.should.be.equal(1);
                    results[0].description.should.be.equal(lot.description);
                }
                done();

            });

        });
    });


    describe('PUT /parkings/:idPark/lots/:id', function(){

        it('must update a lot in parking by id', function(done){

            var idPark = '541ae25819baa50000d8fe00';
            var id = '999ae25819baa50000d99999';
            var url = APIURL+'/parkings/'+idPark+'/lots/'+id;
            var lot = {
                location: {
                    coordinates : [39,
                     9.1143858]
                },
                status : 'free',
                description : 'a lot'
            };
            request.put({url:url,
                headers: {'content-type': 'application/json', 'Authorization' : "Bearer "+ token},
                body:JSON.stringify(lot)
            }, function(error, response, body){
                if(error) throw err;
                else{

                    response.statusCode.should.be.equal(200);

                    var results = JSON.parse(body);

                    results._id.should.be.equal(id);

                }
                done();

            });

        });
    });

    describe('DELETE /parkings/:idPark/lots/:id', function(){

        it('must delete a lot in parking by id', function(done){

            var idPark = '541ae25819baa50000d8fe00';
            var id = '999ae25819baa50000d99999';
            var url = APIURL+'/parkings/'+idPark+'/lots/'+id;

            request.del({url:url, headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){
                if(error) throw error;
                else{
                    response.statusCode.should.be.equal(200);
                    response.body.should.be.equal("ok");

                }
                done();

            });

        });
    });

    describe('GET /parkings', function(){

        it('must return error 401, Unauthorized', function(done){

            request.get(APIURL+'/parkings?skip=0&limit=2', function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(401);

                }

                done();

            });

        });

    });

    describe('GET /parkings?skip=0&limit=2 and token in header "Authorization"', function(){
        it('must return 2 parkings with _metadata containing skip (0) and limit (2)', function(done){

            request.get({url : APIURL+'/parkings?skip=0&limit=2',
                headers : {'Authorization' : "Bearer "+ token} } , function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
//                      console.log('FROM API:' + body);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(2);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(2);
                    results._metadata.totalCount.should.be.equal(100);
                    should.not.exist(results.parkings[0].lots);
                }

                done();

            });

        });

    });


    describe('GET /parkings?skip=0&limit=2&token='+token, function(){

        it('must return error 401, Unauthorized', function(done){

            request.get(APIURL+'/parkings?skip=0&limit=2&token='+token, function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(401);
                    console.log("ERROR: "+response.body);
                }

                done();

            });

        });

    });

    describe('GET /parkings?skip=0&limit=2 and token in header "Authorization"', function(){
        it('must return 2 parkings with _metadata containing skip (0) and limit (2)', function(done){

            request.get({url : APIURL+'/parkings?skip=0&limit=2',
                         headers : {'Authorization' : "Bearer "+ token} } , function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
//                      console.log('FROM API:' + body);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(2);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(2);
                    results._metadata.totalCount.should.be.equal(100);
                    should.not.exist(results.parkings[0].lots);
                }

                done();

            });

        });

    });
    describe('GET /parkings?skip=0&limit=2&access_token='+token+' and token in url', function(){
        it('must return 2 parkings with _metadata containing skip (0) and limit (2)', function(done){

            request.get({url : APIURL+'/parkings?skip=0&limit=2&access_token='+token,
                headers : {'Authorization' : "Bearer "+ token} } , function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
//                      console.log('FROM API:' + body);
                    results.should.have.property('_metadata');
                    results.should.have.property('parkings');
                    results.parkings.length.should.be.equal(2);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(2);
                    results._metadata.totalCount.should.be.equal(100);
                    should.not.exist(results.parkings[0].lots);
                }

                done();

            });

        });

    });
});