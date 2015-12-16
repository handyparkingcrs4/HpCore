var express = require('express');
var router = express.Router();
var User = require('../models/users').User;
var Car  = require('../models/cars').Car;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'HandyParking Core API dev' });
});


/* POST signup user */
router.post('/signup',function(req, res){

    //Authorization - anybody, without token

    console.log("SIGNUP");
    console.log(req);

    if(!req.body)         return res.status(400).send({error:'request body missing'});

    var user = req.body.user;
    var password = req.body.user.password;
    var carplate = req.body.carplate;
    if (!user) return res.status(500).send({error: 'no user sent'});
    if (!password) return res.status(500).send({error: 'no password sent'});
    delete user['password'];

    if(!user['type'] ||  user['type'] == 'admin' ||  (user['type'] != 'client' &&  user['type'] != 'parker') )
        user['type'] = 'client';

    User.register(user, password, function(err, newuser){
        if (err) return res.status(500).send({error: 'unable to register user (err:' + err + ')'});

        if (!carplate) return res.status(201).send('ok');
        else{

           Car.create({"carplate" : carplate},

            function(err, car){

                if(err){
                    res.status(500).send({ error: 'unable to create a new Car, check data, ERROR:'+err  });
                }
                else{
                    newuser.cars.push(car._id);

                    newuser.save(function(err,el){
//                        var fullUrl =  req.protocol + '://' + req.get('host') + req.originalUrl;
//
//                        res.set('Location', fullUrl + "/"+car._id);
                        res.status(201).send("ok");
                    });

                }

            });
        }

    });
});



module.exports = router;
