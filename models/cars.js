var mongoose = require('mongoose');
var findAllFn = require('./metadata').findAll;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;



var CarSchema = new Schema({
    carplate: { type:String, index: true, required: true},
    features: {
    },
    notes : String
},{strict: "throw"});


// Static method to retrieve parkings WITH metadata
CarSchema.statics.findAll = function(conditions, fields, options, callback){
   return findAllFn(this, 'cars', conditions, fields, options, callback);
};

var Car = mongoose.model('Car', CarSchema);



module.exports.CarSchema = CarSchema;
module.exports.Car = Car;
