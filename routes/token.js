var express = require('express');
var _ = require('underscore')._;
var User = require('../models/users').User;
var jwt = require('jwt-simple');
var moment = require('moment');
var passport = require('passport');

var router = express.Router();


/** POST token request */
router.post('/', function(req, res){

    if(!req.body || _.isEmpty(req.body) ) {
        return res.status(400).send({error:'request body missing'});
    }
//    console.log(req);
    passport.authenticate('local', function(err, user, info) {

            if (err) { return res.status(403).send( { error: 'authentication error' }); }

            if (!user) { return res.status(403).send( { error: 'no user found' }); }

            var expires = moment().add(7, 'days').valueOf();
            var secret = require('../app').get('jwtTokenSecret');

            var token = jwt.encode({
                iss: user.id,
                exp: expires
            }, secret  );

            var encodedToken = JSON.stringify({
                token : token,
                expires: expires,
                userId : user.id
            });

            res.status(200).send(encodedToken);
    })(req,res);
});


module.exports = router;
