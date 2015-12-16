var should = require('should');
var mongoose = require('mongoose');
var db = require("../models/db");
var p = require('../models/parkings');
var l = require('../models/lots');



//Async Call, JUST AS AN EXAMPLE
// function anAsyncCall(callback){
//       setTimeout(function(){
//
//           callback("ciao");
//
//       },1000);
//
// }



describe('Models', function(){
  var park;
  var aPark;
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

  describe('Parking model', function(){

    beforeEach(function(done){

      park = new p.Parking({
        description : 'Nuovo Parking',
        location : {
          coordinates : [9.1143858,39.219245],
            type : "Point"
        },
          address:"Via Cammino Nuovo",
          city:"Cagliari",
        //location_descr : 'Via Cammino Nuovo, Cagliari',
        pricePerHour : {},

        lots : [],
        stats : {
          freeLots : 0,
          occupiedLots : 0,
          reservedLots : 0
        },
        admins : [],
          serverType : 'IPM'
      });

      park.save(function(err, product){
        if (err) throw err;
        done();
      });

    });

    afterEach(function(done){
      park.remove(function(err, product){
          if (err) throw err;
          p.Parking.findById( park.id, function (err, product) {
            if (err) throw err;

            done();
          });
      });
    });

    it('must be in db', function(done){

      p.Parking.find({'_id': park.id}, function (err, product) {

        should.not.exist(err);
        should.exist(product);
        aPark = product[0];
        should.exist(aPark);
        done();
      });

    });

    it('must have the right description', function(done){
      // console.log(park.id);
      p.Parking.find({'_id':park.id}, function (err, product) {

        should.not.exist(err);
        should.exist(product);
        //console.log(product);
        var first = product[0];
        should.exist(first);
        first.description.should.be.equal('Nuovo Parking');
        done();
      });

    });

    it('can have many lots', function(done){
      p.Parking.findById(park._id,function(err,product){
        should.not.exist(err);
        should.exist(product);
        product.addSimpleFreeLots(20);
        product.lots.length.should.be.equal(20);
        product.addSimpleOccupiedLots(6);
        product.lots.length.should.be.equal(26);
        product.addSimpleReservedLots(3);
        product.lots.length.should.be.equal(29);
        product.totalLots().should.be.equal(29);
        // var mylot = product.getLotsByQuery({status:'occupied'})[0];
        // mylot.isFree().should.be.equal(false);
        done();
      });
    });

    var lot;
    describe('Lot Model',function(){
      beforeEach(function(done){

        lot = new l.Lot({description : "my lot",location : { coordinates :[
          39.219245,
          9.1143858]
        }});

        lot.save(function(err,product){
          if (err) throw err;
          done();
        });
      });
      afterEach(function(done){
        l.Lot.remove({'_id':lot.id}, function (err, product) {
          if (err) throw err;
          done();
        });
      });

      it('must be in db', function(done){

        var Lot = l.Lot.findById(lot._id ,function(err,product){
          should.not.exist(err);
          product.description.should.be.equal('my lot');
          done();
        });

      });

      it('could be add to a Parking',function(done){

        var aLot = new l.Lot({description:"my lot"});

        // console.log(park.id);
        p.Parking.findById(park._id,  function(err, product){
          should.not.exist(err);
          // console.log(product);
          product.lots.push(aLot);
          product.save(function(err,product){
            should.not.exist(err);
            // console.log(product);
            product.lots[0].description.should.be.equal('my lot');
            done();
          });

        });
      });

      it('should be free',function(done){

        var aLot = new l.Lot({description:"my lot"});


        var status = aLot.isFree();
        status.should.be.equal(true);
        done();
      });

    });

  });


//TEST Async Call, JUST AS AN EXAMPLE
  // describe('Test Async', function(){
  //   it('must be ok', function(done){
  //
  //       anAsyncCall(function(result){
  //
  //           console.log(result);
  //           done();
  //
  //       });
  //
  //   });
  // });



});
