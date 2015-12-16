var should = require('should');
var config = require("../config").generalConf;


describe('Configuration', function(){

  describe('Dev Database', function(){
    it('must be localhost:27017/hpcoreDEVDB', function(){

      config.dev.dbHost.should.be.equal("localhost");
      config.dev.dbPort.should.be.equal("27017");
      config.dev.dbName.should.be.equal("hpcoreDEVDB");

    });
  });

  describe('Skip, limit in Dev mode', function(){
    it('must be 0, 50', function(){

      config.dev.skip.should.be.equal(0);
      config.dev.limit.should.be.equal(50);

    });
  });



  describe('Skip, limit in Production mode', function(){
  it('must be 0,50', function(){

    config.production.skip.should.be.equal(0);
    config.production.limit.should.be.equal(50);    


  });
});



});
