var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Car = require('../models/cars').Car;
var User = require('../models/users').User;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var util = require('util');


describe('User Model', function(){

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


            //add reservations
            async.each(range, function(e,cb){
                          user = new User({

                            cars: [cars[_.random(0,99)]],
                            name: "Johnny " + e,
                            type: "client", //client | admin
                            payment:{},
                            class: {},
                            phone: "+3923456789"+e,
                            email: "johnny"+e+"@handy.com",
                         //   password: "miciomicio",
                            social:{},
                            notes : "Nessuna nota " +e

                          });

                          user.save(function(err, r){
                            if (err) throw err;
//                            console.log();
//                              r.setPassword("miciomicio", function(er){
//                                      if (er) throw er;
//                                      cb();
//                                  }
//                              );
                            cb();

                          });

            }, function(err){

              done();

            });

      });


    });










  afterEach(function(done){
    Car.remove(function(err, car){
            if(err) throw err;
            User.remove(function(err, p){
                    if(err) throw err;

                            done();

            });
    });
  });



  describe('findAll({skip:2, limit:30})', function(){

    it('must include _metadata with correct values', function(done){

      User.findAll({}, null, {skip:2, limit:30}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.users.length.should.be.equal(30);
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

      User.findAll({}, null, {skip:0, limit:10}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.users.length.should.be.equal(10);
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

      User.findAll({}, null, null, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.users.length.should.be.equal(50);
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

      User.findAll({}, null, {skip:0, limit:2}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.users.length.should.be.equal(2);
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

      User.findOne({}, null, function(err, user){

          if(err) throw err;
          else{
            user.should.have.property('cars');
            user.should.have.property('notes');
            user.should.have.property('name');
            user.should.have.property('type');
            user.should.have.property('phone');
            user.should.have.property('email');
            }
          done();

      });

    });

  });

  describe('findOne with populate', function(){

    it('must include all required properties', function(done){

      User.findOne({}).populate('cars').exec(function(err, user){

          if(err) throw err;
          else{
            user.should.have.property('cars');
            user.cars[0].should.have.property('carplate');
            user.should.have.property('notes');
            user.should.have.property('name');
            user.should.have.property('type');
            user.should.have.property('phone');
            user.should.have.property('email');
          }
          done();

      });

    });

  });
});
