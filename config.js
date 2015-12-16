var config = {

  dev:{
        dbHost:'localhost',
        dbPort:'27017',
        dbName:'hpcoreDEVDB',
        limit:50,
        skip:0
  },

  production:{

        dbHost:'localhost',
        dbPort:'27017',
        dbName:'hpcoreDB',
        limit:50,
        skip:0

  }


};
var conf;
if (process.env['NODE_ENV'] === 'dev') {
    conf = config.dev;
}
else{
    conf = config.production;
}

module.exports.conf = conf;
module.exports.generalConf = config;
