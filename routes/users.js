var express = require('express');
var middlewares = require('./middlewares');
var User = require('../models/users').User;
var Car = require('../models/cars').Car;
var util = require('util');
var _ = require('underscore')._;
var router = express.Router();


router.use(middlewares.parsePagination);
router.use(middlewares.parseFields);

//router.use(middlewares.ensureUserIsAdmin);


router.get('/', [middlewares.ensureUserIsAdmin], function(req, res) {

    //TODO: returns ALL users, must be changed to return only authorized users
    //given an authenticated user (by token)

    //console.log(req);


    var fields = req.dbQueryFields;
    if (!fields){
        fields = '-hash -salt';
    }else{
        try{
            fields += ' -hash -salt';
        }
        catch(e){
            fields = '-hash -salt';
        }
    }
    var query = {};

    for (var v in req.query)
        if (User.schema.path(v))
            query[v] = req.query[v];

        User.findAll(query, fields, req.dbPagination, function(err, results){

        if(!err){

            if (results)
                res.status(200).send(results);
            else
                res.status(204).send();
        }
        else{
            res.status(500).send({ error: 'something blew up, ERROR:'+err  });
        }

    });


});

/* POST user creation. */
router.post('/',[middlewares.ensureUserIsAdmin], function(req, res) {   //FIXME: replace with signup???

    //TODO: add user, must be changed to allow authorized calls
    //given an authenticated user (by token)

  if(!req.body || _.isEmpty(req.body) ) {

    return res.status(400).send({error:'request body missing'});
  }
    //req.body['type'] = 'client';
    if ('password' in req.body) delete req.body['password'];
  User.create(req.body, function(err, usr){
        if(!err){
            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.set('Location', fullUrl + "/"+ usr._id);
            delete usr.password;
            res.status(201).send(usr);

        }
        else{
            res.status(500).send({ error: 'something blew up, ERROR:'+err  });

        }

    });
});




/* GET user by id. */
router.get('/:id', function(req, res) {

    //TODO: must be changed to return only authorized users
    //given an authenticated user (by token)



    var fields = req.dbQueryFields;
    if (!fields){
        fields = '-hash -salt';
    }else{
        try{
            fields += ' -hash -salt';
        }
        catch(e){
            fields = '-hash -salt';
        }
    }

    var id = req.param('id').toString();

    if (req.user['type'] != 'admin' && req.user['_id'] != id )
        return res.status(401).send({error:'you are not authorized to access the resource'});

    User.findById(id, fields, function(err, results){
        if(!err){
                res.send(results);
        }
        else{
            if (results === {} || results === undefined)   res.status(404).send({ error: 'user not found'  });
            else res.status(500).send({ error: 'something blew up, ERROR:'+err  });
        }

    });


});

/* PUT, update user by id. */
router.put('/:id', function(req, res) {

    //TODO: must be changed to return only authorized user
    //given an authenticated user (by token)


    if(!req.body || _.isEmpty(req.body)) { return res.status(400).send({error:'request body missing'}); }

    var id = req.param('id').toString();

    if (req.user['type'] != 'admin' && req.user['_id'] != id )
        return res.status(401).send({error:'you are not authorized to access the resource'});

    var newVals;
    try {
        newVals = req.body; // body already parsed
    }catch (e){
        res.status(500).send({error:'no user updated (error:'+e+')'});
    }
    var password = null;
    if (newVals.password) {
        password = newVals.password;
        delete newVals.password;
    }

    User.findOneAndUpdate({_id:id}, newVals, {new: true}, function(err, results){

        if(!err){
            if (results){

                if (password)
                    results.setPassword(password,function(err,obj){
                        delete obj.hash;
                        delete obj.salt;
                        return res.send(obj);
                    });
                else {

                    delete results.hash;
                    delete results.salt;
                    res.send(results);
                }
            }
            else{

              res.status(404).send({error:'no user found with specified id'});

            }

        }
        else{
            console.log("ERROR:", err);
            res.status(400).send({ error: 'something blew up, ERROR:'+err  });

        }

    });


});

/* DELETE user by id. */
router.delete('/:id',[middlewares.ensureUserIsAdmin], function(req, res) {
    var id = req.param('id').toString();

    console.log('DELETE USER '+id);
    User.findOneAndRemove({_id:id},  function(err, results){
        if(!err){
            if (results){
                res.status(200).end();
            }
            else
                  res.status(404).send({error:'no user found with specified id'});
        }
        else{
            res.status(500).send({ error: 'something blew up, ERROR:'+err  });
        }

    });
});



/* GET all the cars for a user*/
router.get('/:id/cars', function(req, res) {

    var query = req.query || {};
    var id = req.param('id').toString();

    if (req.user['type'] != 'admin' && req.user['_id'] != id )
        return res.status(401).send({error:'you are not authorized to access the resource'});

    User.findOne({_id:id}).populate({path:'cars', match :query}).exec(function(err, results){
        if(!err){
            if (results)
                res.send({ cars: results.cars });
            else
                res.status(204).send();
        }
        else{
            res.status(404).send({ error: 'car not found, ERROR:'+err  });

        }

    });
});

/* POST new car for a user */
router.post('/:id/cars', function(req, res) {

    if(!req.body || _.isEmpty(req.body) ) { return res.status(400).send({error:'request body missing'}); }
    var newVals = req.body;
    var id = req.param('id').toString();

    if (req.user['type'] != 'admin' && req.user['_id'] != id )
        return res.status(401).send({error:'you are not authorized to access the resource'});

    User.findById(id, function(err, user){

        if(!err){
            if (user){
                Car.create(newVals, function(err, car){

                    if(err){
                      res.status(500).send({ error: 'unable to create a new Car, check data, ERROR:'+err  });
                    }
                    else{
                      user.cars.push(car._id);

                      user.save(function(err,el){
                          var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

                          res.set('Location', fullUrl + "/"+car._id);
                          res.status(201).send(car);
                      });

                    }

                });

            }
            else
                res.status(404).send({ error: 'user not found'});
        }
        else{
            res.status(500).send({ error: 'something blew up, ERROR:'+err  });

        }

    });
});


/* GET a car by user and car id*/
router.get('/:userId/cars/:carId', function(req, res) {

    var query = req.query || {};
    var id = req.param('userId').toString();
    var carId = req.param('carId').toString();

    if (req.user['type'] != 'admin' && req.user['_id'] != id )
        return res.status(401).send({error:'you are not authorized to access the resource'});

    User.findOne({_id:id}).populate({path:'cars', match :{'_id':carId}}).exec( function(err, results){
        if(!err){
            if (results && results.cars && results.cars.length >0)
                res.send( results.cars[0] );
            else
                res.status(404).send({ error: 'car not found, ERROR:'+err  });
        }
        else{
            res.status(404).send({ error: 'car not found, ERROR:'+err  });

        }

    });
});


/* PUT, update a car by id. */
router.put('/:userId/cars/:carId', function(req, res) {

    //TODO: must be changed to update only authorized resources
    //given an authenticated user (by token)
    if(!req.body || _.isEmpty(req.body)) { return res.status(400).send({error:'request body missing'}); }

    var id = req.param('carId').toString();

    if (req.user['type'] != 'admin' && req.user['_id'] != id )
        return res.status(401).send({error:'you are not authorized to access the resource'});

    var newCar;
    try {
        newCar = req.body; // body already parsed
    }catch (e){
        res.status(400).send({error:'bad request, please check body (error:'+e+')'});
        return;
    }

    var userId = req.param('userId').toString();

    User.findById(userId, function(err, user){
       if (!user) {
           res.status(404).send({error: 'no user found (err:' + err + ')'});
       }
       else{

          if (user.cars.indexOf(id)!==-1){

              Car.update({_id:id}, newCar, function(err, car){

                if(err){
                  res.status(500).send({error: 'error updating a car (err:' + err + ')'});
                }
                else{

                  res.status(200).end();

                }

              });
          }else{

              res.status(404).send({error: 'no car found (err:' + err + ')'});

          }

       }

    });


});

/* DELETE car by id. */
router.delete('/:userId/cars/:carId', function(req, res) {

    var userId = req.param('userId').toString();
    var carId = req.param('carId').toString();

    if (req.user['type'] != 'admin' && req.user['_id'] != userId ) {
   //     console.log(req.user);
        return res.status(401).send({error: 'you are not authorized to access the resource'});
    }

    User.findById(userId, function(err, user){
        if (!user) {
            res.status(404).send({error: 'user not found (err:' + err + ')'});
        }

        var car = user.cars[user.cars.indexOf(carId)];
        if(!car){

          res.status(404).send({error: 'car not found (err:' + err + ')'});

        }
        else{

          Car.remove({_id:car}, function(err, c){

            if(err){

              res.status(500).send({error: 'unable to delete car (err:' + err + ')'});

            }
            else{
              user.cars.pull({_id:car});
              user.save(function(err){

                if(!err){
                  res.status(200).end();
                }
                else{
                  res.status(500).send({error: 'unable to delete car (err:' + err + ')'});
                }

              });

            }

          });

        }

    });
});





module.exports = router;
