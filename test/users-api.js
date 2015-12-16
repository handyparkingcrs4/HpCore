var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var User = require('../models/users').User;
var Car = require('../models/cars').Car;
var request = require('request');
var app = require('../app');
var util = require('util');

var APIURL = 'http://localhost:3000';

var server;
var token;
var adminUser;

var clientUser;
var clientToken;

describe('Users API', function(){

    before(function(done){

        db.connect(function(err){

            if(err) throw err;

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function() {
                console.log('TEST Express server listening on port ' + server.address().port);

                adminUser = new User( {name:"pippo", email:"pippo@pippo.it", type:'admin'} );
                User.register(adminUser, "nascosta", function(err, val){
                    adminUser = val;
                    if(err) throw err;
                    var body = "username=pippo@pippo.it&password=nascosta";  //FIXME: plain, no json

                    request.post({ url:APIURL +"/token",
                            body:body,
                            headers:  {'content-type': 'application/x-www-form-urlencoded'}},
                        function(err,res,body){
                            if (err) throw err;
                            var data = JSON.parse(body);
                            token = data.token;
                            console.log('Token acquired for Admin test user');


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



  beforeEach(function(done){



    var range = _.range(100);

    var cars=[];


    //Add cars

    async.each(range, function(e,cb){
                  var car = new Car({
                    carplate: "AA123"+e+"CA",
                    notes: ""+e
                  });

                  car.save(function(err, car){
                    if (err) throw err;
                    cars.push(car._id);
                    cb();

                  });

    }, function(err){


            if(err) throw err;
            //add reservations
            async.each(range, function(e,cb){
                          var user = new User({

                            cars: [cars[_.random(0,99)],cars[_.random(0,99)]],
                            name: "Johnny " + e,
                            type: "client", //client | parker |  admin
                            payment:{},
                            class: {},
                            phone: "+3923456789"+e,
                            email: "johnny"+e+"@handy.com",
                       //     password: "miciomicio",
                            social:{},
                            notes : "Nessuna nota"

                          });

                          user.save(function(err, r){
                            if (err) throw err;
                            cb();

                          });

            }, function(err){


              done();

            });

      });


    });


  afterEach(function(done){
    Car.remove({},function(err, car){
      //  console.log(car);
        if(err) throw err;
        User.remove({type:'client', notes : "Nessuna nota"},function(err){
        //    console.log(err);
            if(err) throw err;
            done();
        });
    });
  });



  //TESTS


    describe('GET /users', function(){

        it('must return ONE user and _metadata, all fields', function(done){

            request.get({url:APIURL+'/users?skip=0&limit=1', headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{
                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(body);
                    results.should.have.property('_metadata');
                    results.should.have.property('users');
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(1);
                    results._metadata.totalCount.should.be.equal(102);
                    should.exist(results.users[0].cars);
                }

                done();

            });

        });

    });

  describe('GET /users', function(){

    it('must return 2 users and _metadata, all fields', function(done){

          request.get({url:APIURL+'/users?skip=0&limit=2', headers : {'Authorization' : "Bearer "+ token}}, function(error, response, body){

                if(error) throw err;
                else{
                      response.statusCode.should.be.equal(200);
                      var results = JSON.parse(body);
                      results.should.have.property('_metadata');
                      results.should.have.property('users');
                      results._metadata.skip.should.be.equal(0);
                      results._metadata.limit.should.be.equal(2);
                      results._metadata.totalCount.should.be.equal(102);
                      should.exist(results.users[0].cars);
                }

                done();

        });

    });

  });






    describe('POST /users', function(){

        it('should create a new user', function(done){
            var user = new User({
              cars: [],
              name: "Mario",
              type: "client", //client | admin
              payment:{},
              class: {},
              phone: "+3923456789",
              email: "mario@handy.com",
          //    password: "miciomicio",
              social:{},
              notes : "Nessuna nota"

            });
            var userBody = JSON.stringify(user);
            var url = APIURL+'/users';
            request.post({ url : url,
               body : userBody,
              headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}
            }, function(error, response){
                if(error) throw error;
                else{
                    response.statusCode.should.be.equal(201);
                    should.exist(response.headers.location);
                    var results = JSON.parse(response.body);
                    results.should.have.property('name');
                    results.name.should.be.equal(user.name);
                    results.should.have.property('cars');
                    results.should.have.property('_id');

                }

                done();

            });

        });

    });

/*
    describe('POST wrong /user', function(){

        it('should NOT create a new user with a wrong request, must return 400, bad request', function(done){
            var user = {
              cars: [],
              name: "LUIGI",
              type: "client", //client | admin
              payment:{},
              class: {},
              phone: "+3923456789",
              email: "mario@handy.com",
              password: "miciomicio",
              social:{},
              notes : "Nessuna nota"

            };
            var userBody = JSON.stringify(user);
            var url = APIURL+'/users';
            request.post({ url : url,
               body : userBody,
               headers: {'content-type': 'application/json'}
            }, function(error, response){
                if(error) throw error;
                else{
                    console.log("RESPONSE:" + util.inspect(response.body));

                    response.statusCode.should.be.equal(400);
                }

                done();

            });

        });

    });

*/
    //----

    describe('GET /users/:id as simple client not owner', function(){

        it('must return a not authenticated error', function(done){

            User.findOne({notes : "Nessuna nota"}, function(err, usr){

              if(err) throw err;
              else{

                    var url = APIURL+'/users/'+usr._id;
                    request.get({url:url,headers:{'Authorization' : "Bearer "+ clientToken}},function(error, response, body){
                        if(error) throw error;
                        else{
                            response.statusCode.should.be.equal(401);
                        }

                        done();
                    });

              }


            });


        });
    });


    describe('GET /users/:id as simple client owner', function(){

        it('must return a user by id, all fields', function(done){



            var url = APIURL+'/users/'+clientUser._id;
            request.get({url:url,headers:{'Authorization' : "Bearer "+ clientToken}},function(error, response, body){
                if(error) throw error;
                else{

                    response.statusCode.should.be.equal(200);
                    var results = JSON.parse(response.body);
                    results.should.have.property('name');
                    results.should.have.property('cars');
                    results.should.have.property('_id');

                }

                done();
            });


        });
    });




    //----

    describe('GET /users/:id', function(){

        it('must return a 404, user not found', function(done){

                var url = APIURL+'/users/123abcd';
                request.get({url:url, headers:{'Authorization' : "Bearer "+ token}},function(error, response, body){
                    if(error) throw err;
                    else{

                        response.statusCode.should.be.equal(404);

                    }

                    done();
                });

            });

        });



    //----

    describe('PUT /users/:id', function(){

          it('must update a user', function(done){

              User.findOne({}, function(err, usr){

                if(err) throw err;
                else{

                        var url = APIURL+'/users/'+usr._id;

                        var aUser = JSON.stringify({name:'Steven'
                            , password:'baubau'
                        });
                        request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}, body: aUser}, function(error, response, data){

                              if(error) throw err;
                              else{
                                  var results = JSON.parse(data);
                                  response.statusCode.should.be.equal(200);
                                  results.name.should.be.equal("Steven");
                              //    results.password.should.be.equal("baubau");
                        }

                        done();
                        });

                }
              });
          });
    });

    //----

    describe('PUT /users/:id', function(){

        it('must not update a user', function(done){

            User.findOne({notes : "Nessuna nota"}, function(err, usr){

                if(err) throw err;
                else{

                    var url = APIURL+'/users/'+usr._id;

                    var aUser = JSON.stringify({name:'Steven'
                        , password:'baubau'
                    });
                    request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ clientToken}, body: aUser}, function(error, response, data){

                        if(error) throw err;
                        else{
                            var results = JSON.parse(data);
                            response.statusCode.should.be.equal(401);
                            //results.name.should.be.equal("Steven");
                            //    results.password.should.be.equal("baubau");
                        }

                        done();
                    });

                }
            });
        });
    });


    //----

    describe('PUT /users/:id', function(){

          it('must NOT update a user a 400, bad request should be returned', function(done){


              User.findOne({}, function(err, usr){

                if(err) throw err;
                else{

                        var url = APIURL+'/users/'+usr._id;

                        var aUser = JSON.stringify({surname:'Steven'
//                                ,
                        //    password:'baubau'
                        }
                        );
                        request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}, body: aUser},function(error, response, body){

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
    describe('PUT /users/:id', function(){

          it('must NOT update a user a 404, not found should be returned', function(done){


              User.findOne({}, function(err, usr){

                if(err) throw err;
                else{

                        var url = APIURL+'/users/541ae25819baa50000d8fe00';

                        var aUser = JSON.stringify({name:'Steven'});
                        request.put({ url: url, headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token}, body: aUser},function(error, response, body){

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

    //----
    describe('DELETE /users/:id', function(){

        it('must delete a user by id', function(done){


          User.findOne({type:'client'}, function(err, usr){

            if(err) throw err;
            else{
                  var url = APIURL+'/users/'+usr._id;
                  request.del({url:url,headers:{'Authorization' : "Bearer "+ token}},function(error, response, body){

                      if(error) throw error;
                      else{
                              response.statusCode.should.be.equal(200);

                              User.findOne({_id:usr._id}, function(err, usr){

                                  should(usr).not.be.ok;
                                  done();
                              });
                          }
                  });//end req
            }
          });

        });
    });


    //----
    describe('DELETE /users/:id as admin ', function(){

        it('must return a 404 not found', function(done){


          User.findOne({type:'client'}, function(err, usr){

            if(err) throw err;
            else{
                  var url = APIURL+'/users/541ae25819baa50000d8fe00';
                  request.del({url:url, headers : {'Authorization' : "Bearer "+ token}},  function(error, response, body){

                      if(error) throw error;
                      else{

                          console.log(body);
                              response.statusCode.should.be.equal(404);
                              done();

                          }
                  });//end req
            }
          });

        });
    });





    //---- CARS

    describe('GET /users/:id/cars', function(){

        it('must return ALL the cars for a user', function(done){

            User.findOne({type:'client'}, function(err, usr){

                if(err) throw err;
                else{
                      var url = APIURL+'/users/'+usr._id+'/cars';
                      request.get({url:url,headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){
                          if(error) throw err;
                          else{

                              response.statusCode.should.be.equal(200);
                              var results = JSON.parse(body);
                              results.cars.length.should.be.exactly(2);

                          }

                          done();
                      });
                    }

        });
    });
  });


    describe('GET /users/:id/cars?_id={carId}', function(){

        it('must return a car by id', function(done){

            User.findOne({type:'client'}, function(err, usr){

                if(err) throw err;
                else{
                    var url = APIURL+'/users/'+usr._id+'/cars?_id='+usr.cars[0];
            //        console.log(usr.cars[0]);
                 //   var url = APIURL+'/users/'+usr._id+'/cars?_id=baklal';
                    request.get({url:url,headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){
                        if(error) throw err;
                        else{
                            response.statusCode.should.be.equal(200);
                            var results = JSON.parse(body);
                            results.cars.length.should.be.exactly(1);
                        }

                        done();
                    });
                }

            });
        });
    });


    describe('GET /users/:id/cars/:carId', function(){

        it('must return a car by id', function(done){

            User.findOne({type:'client'}, function(err, usr){

                if(err) throw err;
                else{
                    var url = APIURL+'/users/'+usr._id+'/cars/'+usr.cars[0];
                    //        console.log(usr.cars[0]);
                    //   var url = APIURL+'/users/'+usr._id+'/cars?_id=baklal';
                    request.get({url:url,headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){
                        if(error) throw err;
                        else{

                            response.statusCode.should.be.equal(200);

                            var results = JSON.parse(body);
                            console.log(body);
                           // results.cars.length.should.be.exactly(1);
                        }

                        done();
                    });
                }

            });
        });
    });


    //----
    describe('POST /users/:id/cars', function(){

        it('must add a car to a user', function(done){

            User.findOne({type:'client'}, function(err, usr){

                if(err) throw err;
                else{

                      var url = APIURL+'/users/'+usr._id+'/cars';

                      var car = {
                        carplate: "AA123CASTEDDU",
                        notes: "this is a new car"
                      };

                      request.post({url:url,
                                    headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token},
                                    body:JSON.stringify(car)
                                  }, function(error, response, car){
                                          if(error) throw err;
                                          else{
                                                response.statusCode.should.be.equal(201);
                                                should.exist(response.headers.location);
                                                var results = JSON.parse(car);
                                                results.carplate.should.be.equal('AA123CASTEDDU');
                                                results.notes.should.be.equal("this is a new car");

                                          }

                                          User.findOne({_id:usr._id}, function(err, usr){


                                            usr.cars.length.should.be.exactly(3);

                                            done();


                                          });



                                      }
                      );



              }
        });
    });
});

    //----

    describe('PUT /users/:userId/cars/:carId', function(){

        it('must update a car for a user', function(done){

            User.findOne({type:'client'}, function(err, usr){

                var url = APIURL+'/users/'+usr._id+'/cars/'+usr.cars[0];

                var car = {
                  carplate: "AA123CASTEDDU",
                  notes: "this is an updated CAR"
                };
                request.put({url:url,
                    headers: {'content-type': 'application/json','Authorization' : "Bearer "+ token},
                    body:JSON.stringify(car)
                }, function(error, response, body){
                    if(error) throw error;
                    else{

                        response.statusCode.should.be.equal(200);

                        User.findOne({_id:usr._id}).populate('cars').exec(function(err, user){


                            user.cars[0].carplate.should.be.equal("AA123CASTEDDU");
                            user.cars[0].notes.should.be.equal("this is an updated CAR");
                            done();


                        });

                    }

                });

                  });

            });



        });



    //----



    describe('DELETE /users/:userId/cars/:carId', function(){
        it('must delete a car for a user', function(done){
            User.findOne({type:'client'}, function(err, usr){
                //     console.log(usr.cars);
                var carToDelete = usr.cars[0];
                var url = APIURL+'/users/'+usr._id+'/cars/'+carToDelete;
                request.del({url:url,headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){
                    if(error) throw error;
                    else{
                        //    console.log(body);
                        response.statusCode.should.be.equal(200);
                        User.findOne({_id:usr._id}, function(err, usr){
                            //  console.log(usr.cars);
                            usr.cars.indexOf(carToDelete).should.be.exactly(-1);
                            Car.findOne({_id:carToDelete}, function(err, aCar){

                                should(aCar).not.be.ok;
                                done();
                            });
                        });
                    }
                });
            });

        });

    });

    /*
    eliminata prima della correzione mandta da mauro via email
    describe('DELETE /users/:userId/cars/:carId', function(){

        it('must delete a car for a user', function(done){


            User.findOne({type:'client'}, function(err, usr){
           //     console.log(usr.cars);
                var carToDelete = usr.cars[0];
                var url = APIURL+'/users/'+usr._id+'/cars/'+carToDelete;
                  request.del({url:url,headers:{'Authorization' : "Bearer "+ token}}, function(error, response, body){
                          if(error) throw error;
                          else{
                          //    console.log(body);
                              response.statusCode.should.be.equal(200);
                              User.findOne({_id:usr._id}, function(err, usr){
                                  //  console.log(usr.cars);
                                    usr.cars.indexOf(carToDelete).should.be.exactly(-1);
                                    Car.findOne({_id:carToDelete}, function(err, aCar){

                                      should(aCar).not.be.ok;
                                        done();
                                    });

                              });

                          }

                  });
            });

        });
    });
*/


});
