var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Car = require('../models/cars').Car;
var Parking = require('../models/parkings').Parking;
var Reservation = require('../models/reservations').Reservation;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var util = require('util');


describe('Reservation Model', function(){

  before(function(done){

    db.connect(function(){
      done();
    });
  });

  after(function(done){

    db.disconnect(function(){
      done();
    });
  });


  beforeEach(function(done){



    var range = _.range(100);

    var cars=[];
    var parkings=[];

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
                        coordinates : [39.219245,
                         9.1143858],
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

                            car: cars[_.random(0,99)],
                            //MISSING user as ObjectId
                            parking: parkings[_.random(0,99)],
                            lot: null,
                            date: new Date(),
                            validity: 1,
                            dateIn: new Date(),
                            dateOut: new Date(),
                            notes : "Nessuna nota " +e

                          });

                          reservation.save(function(err, r){
                            if (err) throw err;
                            cb();

                          });

            }, function(err){

              done();

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
                            done();
                    });
            });
    });
  });



  describe('findAll({skip:2, limit:30})', function(){

    it('must include _metadata with correct values', function(done){

      Reservation.findAll({}, null, {skip:2, limit:30}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.reservations.length.should.be.equal(30);
            results._metadata.skip.should.be.equal(2);
            results._metadata.limit.should.be.equal(30);
            results._metadata.should.have.property('totalCount');
            results._metadata.totalCount.should.be.equal(100);

          }
          done();

      });

    });

  });


  describe('findAll({skip:0, limit:10})', function(){

    it('must include _metadata with correct values', function(done){

      Reservation.findAll({}, null, {skip:0, limit:10}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.reservations.length.should.be.equal(10);
            results._metadata.skip.should.be.equal(0);
            results._metadata.limit.should.be.equal(10);
            results._metadata.totalCount.should.be.equal(100);

          }
          done();

      });

    });

  });

  describe('findAll() no pagination', function(){

    it('must include _metadata with default values', function(done){

      Reservation.findAll({}, null, null, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.reservations.length.should.be.equal(50);
            results._metadata.skip.should.be.equal(0);
            results._metadata.limit.should.be.equal(50);
            results._metadata.totalCount.should.be.equal(100);

          }
          done();

      });

    });

  });

  describe('findAll({skip:0, limit:2})', function(){

    it('must include _metadata with correct values and only 2 entries', function(done){

      Reservation.findAll({}, null, {skip:0, limit:2}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.reservations.length.should.be.equal(2);
            results._metadata.skip.should.be.equal(0);
            results._metadata.limit.should.be.equal(2);
            results._metadata.totalCount.should.be.equal(100);

          }
          done();

      });

    });

  });

  describe('findOne()', function(){

    it('must include all required properties', function(done){

      Reservation.findOne({}, null, function(err, reservation){

          if(err) throw err;
          else{
            reservation.should.have.property('car');
            reservation.should.have.property('notes');
            reservation.should.have.property('parking');
            reservation.should.have.property('validity');
            reservation.should.have.property('dateIn');
            reservation.should.have.property('dateOut');
            reservation.should.have.property('date');
            reservation.date.should.be.instanceOf(Date);
            reservation.dateIn.should.be.instanceOf(Date);
            reservation.dateOut.should.be.instanceOf(Date);
            }
          done();

      });

    });

  });



    describe('findAll({skip:0, limit:2} populated)', function(){

        it('must include _metadata with correct values and only 2 entries AND must be populated', function(done){

            Reservation.findAllPopulated({}, null, {skip:0, limit:2}, {car:["_id", "carplate"], parking:["_id", "description", "address", "city"]},function(err, results){

                if(err) throw err;
                else{
                    results.should.have.property('_metadata');
                    results.reservations.length.should.be.equal(2);
                    results._metadata.skip.should.be.equal(0);
                    results._metadata.limit.should.be.equal(2);
                    results._metadata.totalCount.should.be.equal(100);
                   // console.log("RESULTS: " + util.inspect(results));

                }
                done();

            });

        });

    });





});
