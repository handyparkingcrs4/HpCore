var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Car = require('../models/cars').Car;



describe('Car Model', function(){

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

      async.each(range, function(e,cb){
                  car = new Car({
                    carplate: "AA123"+e+"CA",
                    notes: ""+e
                  });

                  car.save(function(err, car){
                    if (err) throw err;
                    cb();

                  });

    }, function(err){

      done();

    });

  });

  afterEach(function(done){
    Car.remove(function(err, car){
            if(err) throw err;
            done();
    });
  });



  describe('findAll({skip:2, limit:30})', function(){

    it('must include _metadata with correct values', function(done){

      Car.findAll({}, null, {skip:2, limit:30}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.cars.length.should.be.equal(30);
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

      Car.findAll({}, null, {skip:0, limit:10}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.cars.length.should.be.equal(10);
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

      Car.findAll({}, null, null, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.cars.length.should.be.equal(50);
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

      Car.findAll({}, null, {skip:0, limit:2}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.cars.length.should.be.equal(2);
            results._metadata.skip.should.be.equal(0);
            results._metadata.limit.should.be.equal(2);
            results._metadata.totalCount.should.be.equal(100);

          }
          done();

      });

    });

  });

  describe('findOne()', function(){

    it('check data', function(done){

      Car.findOne({}, null, function(err, car){

          if(err) throw err;
          else{
            car.should.have.property('carplate');
            car.should.have.property('notes');


          }
          done();

      });

    });

  });
});
