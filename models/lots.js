var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var LotSchema = new Schema({
  id : ObjectId,
  location: {
    coordinates: [Number],
    type : {type:String, default : "Point"}
  },
    number : String,
    reservable : {type:Boolean, required:true, default:false, index :true},
  status : { type:String, index :true, enum:['occupied','free','reserved', 'notavailable'], default: 'free', required : 'true'},
  description : String
}, {strict : "throw"});

var Lot = mongoose.model('Lot', LotSchema);

Lot.prototype.occupy = function(){
  this.status = 'occupied';
};

Lot.prototype.free = function(){
  this.status = 'free';
};

Lot.prototype.isFree = function(){
  return this.status === 'free';
};

Lot.prototype.reserve = function(){
  this.status = 'reserved';
};

module.exports.LotSchema = LotSchema;
module.exports.Lot = Lot;
