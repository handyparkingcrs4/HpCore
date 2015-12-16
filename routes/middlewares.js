var conf = require('../config').conf;

//Middleware to parse DB query fields selection from request URI
//Adds dbQueryFields to request
exports.parseFields = function(req, res, next){


  var fields = req.query.fields ? req.query.fields.split(","):null;
  if(fields){
        req.dbQueryFields = fields.join(' ');
  }
  else{
        req.dbQueryFields = null;
  }
  next();

};


//Middleware to parse pagination params from request URI
//Adds dbPagination to request
exports.parsePagination = function(req, res, next){


  var skip = req.query.skip && !isNaN(parseInt(req.query.skip)) ? parseInt(req.query.skip):conf.skip;
  var limit = req.query.limit && parseInt(req.query.limit) < conf.limit ? parseInt(req.query.limit):conf.limit;
  req.dbPagination = {"skip":skip, "limit":limit};
  next();

};


exports.ensureUserIsAdmin = function(req,res,next){
   // console.log(req);
    if (! req.user )
        return res.status(401).send({error:'you are not authorized to access the resource (no user in the request)'});
    if (req.user.type !== 'admin')
        return res.status(401).send({error:'only admins are authorized to access the resource'});
    else
        next();
};


exports.parseOptions = function(req, res, next){

    var sortDescRaw = req.query.sortDesc ? req.query.sortDesc.split(",") : null;
    var sortAscRaw = req.query.sortAsc ? req.query.sortAsc.split(",") : null;


    if(sortAscRaw || sortDescRaw)
        req.sort={ asc:sortAscRaw, desc:sortDescRaw}
    else
        req.sort = null;

    next();

};