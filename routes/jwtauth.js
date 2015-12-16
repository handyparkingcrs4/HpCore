// @file jwtauth.js

var User = require('../models/users').User;
var jwt = require('jwt-simple');

module.exports = function(req, res, next) {



    var token = (req.body && req.body.access_token) || (req.query && req.query.access_token); // || req.headers['x-access-token'];
    if (req.headers['authorization']) {
        var value = req.headers['authorization'];
        header = value.split(" ");
        if (header.length==2)
            if (header[0] == "Bearer") {
                token = header[1];
             }
    }

    var exampleUrl = "http://handyparking.crs4.it";

    if (token) {
        try {
            var decoded = jwt.decode(token, require('../app').get('jwtTokenSecret'));
        } catch (err) {
            console.log(err);
            return res.status(500).send({error:"Internal error"});
        }

         //   console.log(decoded.iss);
            if (decoded.exp <= Date.now()) {
                return res.status(401)
                    .set({'WWW-Authenticate':'Bearer realm='+exampleUrl+', error="invalid_token", error_description="The access token expired"'})
                    .send({error:'Unauthorized: Access token has expired'});
            }
          //  console.log(decoded);
            User.findById(decoded.iss, function(err, user) {
                if (err)
                    return res.status(401)
                        .set({'WWW-Authenticate':'Bearer realm='+exampleUrl+', error="insufficient_scope", error_description="You do not have privileges to access"'})
                        .send({error:"Unauthorized: Access token error, you are not allowed to use the resource"});
            //    console.log(user);
                if (user) {
                    req.user = user;
                    next();
                }else return res.status(401)
                    .set({'WWW-Authenticate':'Bearer realm='+exampleUrl+', error="insufficient_scope", error_description="You do not have privileges to access"'})
                    .send({error:"Unauthorized: Access token error, you are not a registered user, not allowed to use the resource"});

            });


    } else {
        res.status(401)
            .set({'WWW-Authenticate':'Bearer realm='+exampleUrl+', error="invalid_request", error_description="The access token is required"'})
            .send({error:"Unauthorized: Access token required, you are not allowed to use the resource"});
    }


};