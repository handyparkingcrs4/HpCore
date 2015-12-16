var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Reservation = require('../models/reservations').Reservation;
var Car = require('../models/cars').Car;
var Parking = require('../models/parkings').Parking;
var request = require('request');
var app = require('../app');
var util = require('util');
var User = require('../models/users').User;

var APIURL = 'http://localhost:3000';

var server;
var token;

var clientUser, clientToken;

describe('Reservations API', function(){

    before(function(done){

        db.connect(function(){

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function() {
                console.log('TEST Express server listening on port ' + server.address().port);


                var user = new User( {name:"pippo", email:"pippo@pippo.it",type:'admin'} );

                User.register(user, "nascosta", function(err, val){
                    if(err) throw err;
                    var body = "username=pippo@pippo.it&password=nascosta";  //FIXME: plain, no json

                    request.post({ url:APIURL +"/token",
                            body:body,
                            headers:  {'content-type': 'application/x-www-form-urlencoded'}},
                        function(err,res,body){
                            if (err) throw err;
                            var data = JSON.parse(body);
                            token = data.token;
                            clientUser = new User({name: "pluto", email: "pluto@pluto.it", type: 'client'});
                            User.register(clientUser, "nascosta", function (err, val) {
                                clientUser = val;
                                if (err) throw err;
                                var body = "username=pluto@pluto.it&password=nascosta";
                                request.post({ url:APIURL +"/token",
                                    body:body,
                                    headers:  {'content-type': 'application/x-www-form-urlencoded'}},function(err,res,body) {
                                    if (err) throw err;
                                    var data = JSON.parse(body);
                                    clientToken = data.token;


                                    done();
                                });
                            });

                            //done();
                        }
                    );
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



  var range = _.range(100);

  var cars=[];
  var parkings=[];


beforeEach(function(done){

  //Add cars

  async.each(range, function(e,cb){
                car = new Car({
                  carplate: "AA123"+e+"CA",
                  notes: ""+e
                });

                car.save(function(err, car){
                  if (err) throw err;
                  cars.push(car._id);
                  cb();

                });

  }, function(err){

  //add parkings
    async.each(range, function(e,cb){
                  park = new Parking({
                    description : 'A'+e,
                    location : {
                      coordinates : [39.219245, 9.1143858],
                        type :"Point"
                    },
                    address : 'Via Cammino Nuovo'+e,
                    city : 'Cagliari',
//                    locationDescr : 'Via Cammino Nuovo'+e+' , Cagliari',
                    pricePerHour : {},

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

                  park.save(function(err, p){
                    if (err) throw err;
                    parkings.push(p._id);
                    cb();

                  });

    }, function(err){


          //add reservations
          async.each(range, function(e,cb){
                        reservation = new Reservation({

                          car: cars[_.random(1, 99)],
                          //MISSING user as ObjectId
                          parking: parkings[_.random(0, 99)],
                          lot: null,
                          date: new Date(),
                          validity: 1,
                          dateIn: new Date(),
                          dateOut: new Date(),
                          notes : "A note, " +e

                        });

                        reservation.save(function(err, r){
                          if (err) throw err;
                          cb();

                        });

          }, function(err){


              clientUser.cars.set(0, cars[0]);
              //clientUser.cars.set(1, cars[1]);

              clientUser.save(function(err, val){
                  if (err) throw err;
                  var usRev = new Reservation({

                      car: val.cars[0],
                      //MISSING user as ObjectId
                      parking: parkings[0],
                      lot: null,
                      date: new Date(),
                      validity: 1,
                      dateIn: new Date(),
                      dateOut: new Date(),
                      notes : "A note"

                  });
                  usRev.save(function(err, r){
                      if (err) throw err;
                      done();
                  });

              });


          });

    });


  });






});



afterEach(function(done){
  Car.remove(function(err, car){
          if(err) throw err;
          Parking.remove(function(err, p){
                  if(err) throw err;
                  Reservation.remove(function(err, r){
                          if(err) throw err;
                          cars=[];
                          parkings=[];
                          done();
                  });
          });
  });
});



  //TESTS
  //TODO ALL the resources must be filtered by Authorization/authorization
  //by token (per user)


  describe('GET /reservations', function(){

    it('must return 2 reservations and _metadata, all fields', function(done){

          request.get({url:APIURL+'/reservations?skip=0&limit=2',headers:{ 'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw error;
                else{
                    //    console.log(body);
                      response.statusCode.should.be.equal(200);
                      var results = JSON.parse(body);
                  //  console.log(results);
                      results.should.have.property('_metadata');
                      results.should.have.property('reservations');

                      results._metadata.skip.should.be.equal(0);
                      results._metadata.limit.should.be.equal(2);
                      results._metadata.totalCount.should.be.equal(101);
                      should.exist(results.reservations[0]);
                      var reservation = results.reservations[0];
                      reservation.should.have.property('car');
                      reservation.car.should.have.property('_id');
                      reservation.car.should.have.property('carplate');
                      reservation.should.have.property('notes');
                      reservation.should.have.property('parking');
                      reservation.parking.should.have.property('_id');
                      reservation.parking.should.have.property('description');
                      reservation.parking.should.have.property('address');
                      reservation.parking.should.have.property('city');

                      reservation.should.have.property('validity');
                      reservation.should.have.property('dateIn');
                      reservation.should.have.property('dateOut');
                      reservation.should.have.property('date');

                }

                done();

        });

    });

  });

  describe('GET /reservations', function(){

      it('must return ONE reservation and _metadata, all fields', function(done){

          request.get({url:APIURL+'/reservations?skip=0&limit=1',headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){

              if(error) throw error;
              else{

                  response.statusCode.should.be.equal(200);
                  var results = JSON.parse(body);
                  results.should.have.property('_metadata');
                  results.should.have.property('reservations');
                  results._metadata.skip.should.be.equal(0);
                  results._metadata.limit.should.be.equal(1);
                  results._metadata.totalCount.should.be.equal(101);
                  should.exist(results.reservations[0]);
                  var reservation = results.reservations[0];
                  reservation.should.have.property('car');
                  reservation.should.have.property('notes');
                  reservation.should.have.property('parking');
                  reservation.should.have.property('validity');
                  reservation.should.have.property('dateIn');
                  reservation.should.have.property('dateOut');
                  reservation.should.have.property('date');

              }

              done();

          });

      });

  });

    describe('GET /reservations as owner', function(){

        it('must return ONE reservation and _metadata, all fields', function(done){

            request.get({url:APIURL+'/reservations', headers:{'Authorization' : "Bearer "+ clientToken}}, function(error, response, body){

                if(error) throw error;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                    //console.log("OWNER");
                    //console.log(body);
                    results.should.have.property('_metadata');
                    results.should.have.property('reservations');
                    results._metadata.skip.should.be.equal(0);
                    //results._metadata.limit.should.be.equal(1);
                    results._metadata.totalCount.should.be.equal(1);
                    should.exist(results.reservations[0]);
                    var reservation = results.reservations[0];
                    reservation.should.have.property('car');
                    reservation.should.have.property('notes');
                    reservation.should.have.property('parking');
                    reservation.should.have.property('validity');
                    reservation.should.have.property('dateIn');
                    reservation.should.have.property('dateOut');
                    reservation.should.have.property('date');
                    reservation.car.should.have.property('carplate');
                    reservation.parking.should.have.property('description');

                }

                done();

            });

        });

    });


    describe('POST /reservations', function(){

        it('should not create a new reservation, no ARP Server specified', function(done){
            var reservation = {

                car: cars[_.random(0,99)],
                //MISSING user as ObjectId
                parking: parkings[_.random(0,99)],
                lot: null,
                date: new Date(),
                validity: 1,
                dateIn: new Date(),
                dateOut: new Date(),
                notes : "Another note"

            };
            var reservBody = JSON.stringify(reservation);
            var url = APIURL+'/reservations';
            request.post({ url : url,
                body : reservBody,
                headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}
            }, function(error, response){
                if(error) throw error;
                else{
                    response.statusCode.should.be.equal(504);
                }

                done();

            });

        });

    });


    //----


    describe('POST /reservations', function(){

        it('should NOT create a new reservation with an empty body and return 400', function(done){

            var url = APIURL+'/reservations';
            request.post({ url : url,
                body : null,
                headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}
            }, function(error, response){
                if(error) throw error;
                else{
                    response.statusCode.should.be.equal(400);

                    var results = JSON.parse(response.body);
                    results.should.be.eql({error:'request body missing'});


                }

                done();

            });

        });

    });

    //----

    describe('GET /reservations/:id', function(){

        it('must return a reservation by id, all fields', function(done){

            Reservation.findOne({}, function(err, reserv){

              if(err) throw err;
              else{

                    var url = APIURL+'/reservations/'+reserv._id;
                    request.get({url:url, headers: {'Authorization' : "Bearer "+ token}},function(error, response, body){
                        if(error) throw err;
                        else{

                            response.statusCode.should.be.equal(200);
                            var results = JSON.parse(response.body);
                            results.should.have.property('date');
                            results.should.have.property('car');
                            results.should.have.property('parking');
                            results.should.have.property('_id');

                        }

                        done();
                    });

              }


            });


        });
    });

    //----

    describe('GET /reservations/:id', function(){

        it('must return a 404, user not found', function(done){



                    var url = APIURL+'/reservations/541ae25819baa50000d8fe00';
                    request.get({url:url, headers: {'Authorization' : "Bearer "+ token}},function(error, response, body){
                        if(error) throw err;
                        else{

                            response.statusCode.should.be.equal(404);


                        }

                        done();
                    });




            });


        });



    //----
    /*
    describe('PUT /reservations/:id', function(){

          it('must update a reservation', function(done){

              Reservation.findOne({}, function(err, reserv){

                if(err) throw err;
                else{

                        var url = APIURL+'/reservations/'+reserv._id;

                        var aReserv = JSON.stringify({notes:'a simple. modified note', validity:10});
                        request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}, body: aReserv}, function(error, response, data){

                              if(error) throw err;
                              else{
                                  var results = JSON.parse(data);
                                  response.statusCode.should.be.equal(200);
                                  results.notes.should.be.equal('a simple. modified note');
                                  results.validity.should.be.exactly(10);
                        }

                        done();
                        });

                }
              });
          });
    });
    */


    //----
    /*
    describe('PUT /reservations/:id', function(){

        it('must NOT update a reservation with an empty body and return a 400', function(done){

            Reservation.findOne({}, function(err, reserv){

                if(err) throw err;
                else{

                    var url = APIURL+'/reservations/'+reserv._id;


                    request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}, body: null}, function(error, response, data){

                        if(error) throw err;
                        else{
                            var results = JSON.parse(data);
                            response.statusCode.should.be.equal(400);
                            results.should.be.eql({error:'request body missing'});
                        }

                        done();
                    });

                }
            });
        });
    });


    //----

    describe('PUT /reservations/:id', function(){

          it('must NOT update a reservation; a 400, bad request should be returned', function(done){


              Reservation.findOne({}, function(err, reserv){

                if(err) throw err;
                else{

                        var url = APIURL+'/reservations/'+reserv._id;

                        var aReserv = JSON.stringify({notecontents:'a simple. modified note', validity:10});
                        request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}, body: aReserv},function(error, response, body){

                              if(error) throw err;
                              else{

                                  response.statusCode.should.be.equal(400);

                        }

                        done();
                        });

                }
              });
          });
    });


    //----
    describe('PUT /reservations/:id', function(){

          it('must NOT update a reservation; a 404, not found, should be returned', function(done){


              Reservation.findOne({}, function(err, reserv){

                if(err) throw err;
                else{

                        var url = APIURL+'/reservations/541ae25819baa50000d8fe00';

                        var aReserv = JSON.stringify({notes:'NEW note', validity:11});
                        request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}, body: aReserv},function(error, response, body){

                              if(error) throw err;
                              else{

                                  response.statusCode.should.be.equal(404);

                              }

                        done();
                        });

                }
              });
          });
    });
     */

    //----
    describe('DELETE /reservations/:id as admin', function(){

        it('must not delete a reservation by id, No ARP url specified', function(done){


          Reservation.findOne({}, function(err, reserv){

            if(err) throw err;
            else{
                  var url = APIURL+'/reservations/'+reserv._id;
                  request.del({ url: url, headers: {'Authorization' : "Bearer "+ token}},function(error, response, body){

                      if(error) throw err;
                      else{
                           response.statusCode.should.be.equal(504);
                            done();
                          }
                  });//end req
            }
          });

        });
    });

    /*
     describe('DELETE /reservations/:id as admin', function(){

     it('must not delete a reservation by id, No ARP url specified', function(done){


     Reservation.findOne({}, function(err, reserv){

     if(err) throw err;
     else{
     var url = APIURL+'/reservations/'+reserv._id;
     request.del({ url: url, headers: {'Authorization' : "Bearer "+ token}},function(error, response, body){

     if(error) throw err;
     else{
     response.statusCode.should.be.equal(504);

     Reservation.findById(reserv._id, function(err, r){

     should(r).not.be.ok;
     done();
     });
     }
     });//end req
     }
     });

     });
     });
     */

    //----
    describe('DELETE /reservations/:id with not existing id', function(){

        it('must return a 404 not found', function(done){

          Reservation.findOne({}, function(err, r){

            if(err) throw err;
            else{
                  var url = APIURL+'/reservations/541ae25819baa50000d8fe00';
                  request.del({ url: url, headers: {'Authorization' : "Bearer "+ token}},function(error, response, body){

                      if(error) throw err;
                      else{
                              response.statusCode.should.be.equal(404);
                              done();

                          }
                  });//end req
            }
          });

        });
    });


});
