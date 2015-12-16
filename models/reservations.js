var mongoose = require('mongoose');
var findAllFn = require('./metadata').findAll;
var findAllPopulatedFn = require('./metadata').findAllPopulated;
var Car = require('./cars').Car;
var Parking = require('./parkings').Parking;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;



var ReservationSchema = new Schema({
    car: {type: Schema.Types.ObjectId, ref: 'Car', index: true},
    parking: {type: Schema.Types.ObjectId, ref: 'Parking', index: true},
    lot: Schema.Types.ObjectId,
    date: {type:Date, index: true} ,
    validity: {type:Number, index: true},
    dateIn: Date,
    dateOut: Date,
    notes : String
}, {strict: "throw"});


// Static method to retrieve reservations WITH metadata
ReservationSchema.statics.findAll = function(conditions, fields, options, callback){
   return findAllFn(this, 'reservations', conditions, fields, options, callback);
};

// Static method to retrieve reservations WITH metadata and POPULATED
ReservationSchema.statics.findAllPopulated = function(conditions, fields, options, populate, callback){
    return findAllPopulatedFn(this, 'reservations', conditions, fields, options, populate, callback);
};

var Reservation = mongoose.model('Reservation', ReservationSchema);



module.exports.ReservationSchema = ReservationSchema;
module.exports.Reservation = Reservation;
