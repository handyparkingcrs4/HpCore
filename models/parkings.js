var mongoose = require('mongoose');
var lots = require('./lots');
var LotSchema = lots.LotSchema;
var Lot = lots.Lot;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var _ = require('underscore')._;

var findAllFn = require('./metadata').findAll;


var ParkingSchema = new Schema({

    description: {type: String, required: true},

    location: {coordinates: {type: [Number], default: [0, 0] }, 'type': {
        type: String,
        required: true,
        enum: ['Point', 'LineString', 'Polygon'],
        default: 'Point'} },  // [ lng (-180,+180)  , lat(-90,+90) ]
    address: {type: String, required: true },
    city: {type: String, required: true, index: true},
    //locationDescr : String,
    pricePerHour: {
        first: { price: { type: Number }, interval: {type: String} },
        second: { price: { type: Number }, interval: {type: String} }
    },
    days: [],
    hours: [],
    img: {type: String, default: "http://handyparking.crs4.it/wp-content/uploads/2014/10/no_image_available.png"},
    web: String,
    reservable: {type: Boolean, required: true, default: false, index: true},
    ltReservable: {type: Boolean, required: true, default: false,  index: true},
    validity: Number,
    prices: {},
    lots: [LotSchema],  //Array of lots
    stats: {
        freeLots: {type: Number, min: 0, default: 0, index: true},
        occupiedLots: {type: Number, min: 0, default: 0},
        reservedLots: {type: Number, min: 0, default: 0},
        notAvailableLots: {type: Number, min: 0, default: 0},
    },
    admins: [{type:Schema.Types.ObjectId, ref:'User'}],
    serverURL: String,
    serverType: {type: String, enum: ['ARP', 'IPM'], index: true}

}, {strict:"throw"});
ParkingSchema.index({ "location": '2dsphere' });


var locationDescr = ParkingSchema.virtual('locationDescr');
locationDescr.get(function () {
    return this.address + ', ' + this.city;
});


// Static method to retrieve parkings WITH metadata
ParkingSchema.statics.findAll = function(conditions, fields, options, callback){
   return findAllFn(this, 'parkings', conditions, fields, options, callback);
};


var Parking = mongoose.model('Parking', ParkingSchema);

Parking.prototype.addLot = function(lot){
    this.lots.push(new Lot(lot));
    if (lot.status == 'free')
        this.stats.freeLots += 1;
    if (lot.status == 'occupied')
        this.stats.occupiedLots += 1;
    if (lot.status == 'reserved')
        this.stats.reservedLots += 1;
    if (lot.status == 'notavailable')
        this.stats.notAvailableLots += 1;
    this.checkLotsNum();
    //FIXME: save or not?
};


Parking.prototype.addSimpleFreeLots = function(num){
  for (var i=0; i<num; i++)
    this.lots.push(new Lot());
  this.stats.freeLots += num;
};

Parking.prototype.addSimpleOccupiedLots = function(num){
  for (var i=0; i<num; i++)
    this.lots.push(new Lot({status : 'occupied'}));
  this.stats.occupiedLots += num;
};
Parking.prototype.addSimpleReservedLots = function(num){
  for (var i=0; i<num; i++)
    this.lots.push(new Lot({status : 'reserved'}));
  this.stats.reservedLots += num;
};
Parking.prototype.checkLotsNum = function(){
    var lTot = this.lots.length;
    var sTot = this.stats.freeLots + this.stats.occupiedLots + this.stats.reservedLots + this.stats.notAvailableLots;
    if (lTot !== sTot)
        throw 'Incoerence between lots ('+lTot+') and stats ('+sTot+')';
};

Parking.prototype.totalLots = function(){
  this.checkLotsNum();
  var lTot = this.lots.length;
  return lTot;
};


Parking.prototype.getLotsByQuery = function(query){ //Maybe already in mongoose? NO, it's not.

   return  _.filter(this.lots,query);


//  var res = this.lots.filter(function(el){
//    var q = true;
//    for (var attribute in query){
//
//
//      q = q && _.isEqual(el[attribute],query[attribute]);
//    }
//    return q;
//  });
//
//  return res;
};

// Parking.prototype.reserveLot = function(){
//   this.lots.()
// }

//var PricingSchema = new Schema({
//   days : [{type: String, enum: ['SUN', 'MON','TUE','WED','THU','FRI','SAT']}],
//   timeInterval : {
//       startTime : {hour: {type:Number, min:0, max:23}, minute:{type:Number, min:0, max:59}},
//       endTime : {hour: {type:Number, min:0, max:23}, minute:{type:Number, min:0, max:59}}
//   },
//   holidays : {type:String, status:{type:String, enum : ['normal','free','closed'] }},
//   hours :
//
//});






// module.exports.ParkingSchema = ParkingSchema;
module.exports.Parking = Parking;
