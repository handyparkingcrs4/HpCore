var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var async = require('async');
var db = require("../models/db");
var Parking = require('../models/parkings').Parking;
var l = require('../models/lots');


describe('Parking Model Extensions', function(){

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
                  park = new Parking({
                    description : 'A'+e,
//                    location : {
//                      lat : 39.219245,
//                      lng : 9.1143858
//                    },
                    address : 'Via Cammino Nuovo'+e,
                    city : 'Cagliari',
//                    locationDescr : 'Via Cammino Nuovo'+e+' , Cagliari',
                    pricePerHour : {},
                    location : { coordinates: [ 9.1143858 + (e *0.01),
                            39.219245 + (e *0.01)  ]},
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
          var mypark = Parking.findOne({"description":"A1"},function(err,res){
              res.addLot({"_id":"999ae25819baa50000d99999","status":"free", "reservable":true, location:{coordinates:[0,0]}});
              res.save(function(err,resu){
                  if (err) throw err;
//                  console.log(resu.lots);
                  done();
              });
          });

    });

  });

  afterEach(function(done){
    Parking.remove(function(err, product){
            if(err) throw err;
            done();
    });
  });



  describe('findAll({skip:2, limit:30})', function(){

    it('must include _metadata with correct values', function(done){

      Parking.findAll({}, null, {skip:2, limit:30}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.parkings.length.should.be.equal(30);
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

      Parking.findAll({}, null, {skip:0, limit:10}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.parkings.length.should.be.equal(10);
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

      Parking.findAll({}, null, null, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.parkings.length.should.be.equal(50);
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

      Parking.findAll({}, null, {skip:0, limit:2}, function(err, results){

          if(err) throw err;
          else{
            results.should.have.property('_metadata');
            results.parkings.length.should.be.equal(2);
            results._metadata.skip.should.be.equal(0);
            results._metadata.limit.should.be.equal(2);
            results._metadata.totalCount.should.be.equal(100);

          }
          done();

      });

    });

  });

//    describe('getLotsByQuery({status:"free"})', function(){
//
//        it('must return the free lots of a parking', function(done){
//
//            Parking.findOne({"description":"A1"}, null, null, function(err, results){
//
//                if(err) throw err;
//                else{
//                    should.exist(results);
//                    results.should.not.be.equal(null);
//                    results.should.not.be.equal(undefined);
//                    console.log("results");
//                    console.log(results);
//                    var lots = _.findWhere(results.lots, {reservable: true, status:"free"});
////"999ae25819baa50000d99999"
//                    lots.length.should.be.equal(1);
//                    console.log(lots);
//                }
//
//                done();
//
//            });
//
//        });
//
//    });

    describe('findOneAndUpdate({"description":"A1"},{serverType : "IPM"})', function(){

        it('must return the free lots of a parking', function(done){

            Parking.findOneAndUpdate({"description":"A1"}, {serverType : "IPM"},function(err, results){

                if(err) throw err;
                else{
                    should.exist(results);
                    results.should.not.be.equal(null);
                    results.should.not.be.equal(undefined);
                    results.serverType.should.be.equal("IPM");
                }
                done();

            });

        });

    });


    describe('geoNear(...)', function(){

        it('must return the parkings near some location', function(done){
            var searchOptions = {
                maxDistance : 0.04,
                distanceMultiplier: 1,
                spherical : true
            }
            Parking.geoNear({type:"Point", coordinates : [9.1143858, 39.219245]}, searchOptions, function(err,res){
                if(err) throw err;
                else{
                    should.exist(res);
                    res.should.not.be.equal(null);
                    res.should.not.be.equal(undefined);
                    //var lots = results.getLotsByQuery({_id: "999ae25819baa50000d99999"});
                    //         console.log(lots);
                    done();

                }
            });

        });

    });


});
