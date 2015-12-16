var should = require('should');
var mongoose = require('mongoose');
var _ = require('underscore')._;
var db = require("../models/db");
var User = require('../models/users').User;
var Car = require('../models/cars').Car;
var request = require('request');
var app = require('../app');
var util = require('util');



var jwt = require('jwt-simple');


var APIURL = 'http://localhost:3000';

var server;

describe('Token Authentication', function() {

    before(function(done){

        db.connect(function(){

            app.set('port', process.env.PORT || 3000);

            server = app.listen(app.get('port'), function() {
                console.log('TEST Express server listening on port ' + server.address().port);
                done();
            });


        });
    });

    after(function(done){

        db.disconnect(function(){
            done();
        });

        server.close();
    });


    beforeEach(function(done){
        var user = new User( {name:"pippo", email:"pippo@pippo.it"} );
        User.register(user,"nascosta" , function(err, val) {
            if (err) throw err;

             //      console.log("val "+val);
            User.find({email:"pippo@pippo.it"}, function (err, values) {
                if (err) throw err;
               // console.log(values);

            done();
            });
        });
    });

    afterEach(function(done){
        User.remove(function(err, product){
        //    console.log("err "+err);
            if(err) throw err;
            done();
        });

    });


    describe("POST token request by user and password in json format",function(){
        it("should return a token", function(done){

        var body = JSON.stringify({"username":"pippo@pippo.it","password":"nascosta"});

        request.post({ url:APIURL +"/token",
                       body:body,
                       headers: {'content-type': 'application/json'}},
            function(err,res,body){
                if (err) throw err;

                res.statusCode.should.be.equal(200);
                should.not.exist(err);
                should.exist(res);
                should.exist(res.body);
                var data = JSON.parse(body);
                should.exist(data.token);

               // console.log(util.inspect(res));
               // console.log(res.body.token);
                done();
            }
        );

        });
    });

    describe("POST token request by user and password (application/x-www-form-urlencoded)",function(){
        it("should return a token", function(done){

            var body = "username=pippo@pippo.it&password=nascosta";

            request.post({ url:APIURL +"/token",
                    body:body,
                    headers: {'content-type': 'application/x-www-form-urlencoded'}},
                function(err,res,body){
//                    console.log("RESPONSE");
//                    console.log(res);
                    if (err) throw err;
                    //         console.log(body);
//                    console.log("RESPONSE");
//                    console.log(res);
                    res.statusCode.should.be.equal(200);
                    should.not.exist(err);
                    should.exist(res);
                    should.exist(res.body);
                    var data = JSON.parse(body);
                    should.exist(data.token);

                    // console.log(util.inspect(res));
                    // console.log(res.body.token);
                    done();
                }
            );

        });
    });


    describe("POST token request by user and wrong password",function(){
        it("should not return a token", function(done){

            var body = JSON.stringify({"name":"pippo", email:"pippo@pippo.it","password":"sbagliata"});

            request.post({ url:APIURL +"/token",
                    body:body,
                    headers: {'content-type': 'application/json'}},
                function(err,res,body){
                    if (err) throw err;
                    res.statusCode.should.be.equal(403);
                    done();
                }
            );

        });
    });

    describe("POST token request by user without password",function(){
        it("should not return a token", function(done){

            var body = JSON.stringify({"name":"pippo"});

            request.post({ url:APIURL +"/token",
                    body:body,
                    headers: {'content-type': 'application/json'}},
                function(err,res,body){
                    if (err) throw err;
                    res.statusCode.should.be.equal(403);
                    done();
                }
            );
        });
    });


    describe("POST token request by wrong user",function(){
        it("should not return a token", function(done){

            var body = JSON.stringify({"name":"ziggy","password":"sbagliata"});

            request.post({ url:APIURL +"/token",
                    body:body,
                    headers: {'content-type': 'application/json'}},
                function(err,res,body){
                    if (err) throw err;
                    res.statusCode.should.be.equal(403);
                    done();
                }
            );

        });
    });
    describe("POST token request without user and password",function(){
        it("should not return a token", function(done){

            var body = JSON.stringify({});

            request.post({ url:APIURL +"/token",
                    body:body,
                    headers: {'content-type': 'application/json'}},
                function(err,res,body){
                    if (err) throw err;
                    res.statusCode.should.be.equal(400); //empty body
                    done();
                }
            );

        });
    });

});