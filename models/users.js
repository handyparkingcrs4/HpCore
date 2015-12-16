var mongoose = require('mongoose');
var findAllFn = require('./metadata').findAll;
var Car = require('./cars').Car;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var passportLocalMongoose = require('passport-local-mongoose');

var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

var UserSchema = new Schema({
    name: String,
    type: {type:String, enum:["client","parker","admin"], default:"client",index: true}, //client | admin
    payment:{},
    class: {},
    phone: String,
    email: { type: String,
        trim: true,
        unique: true,
        index: true,
        required: 'Email address is required',
        validate: [validateEmail, 'Please fill a valid email address'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
   // password: String,  // passportLocalMongoose manage hash and salt information
    social:{},
    cars:[{type:Schema.Types.ObjectId, ref:'Car',index: true}],
    notes : String
}, {strict: "throw"});



// Static method to retrieve resource WITH metadata
UserSchema.statics.findAll = function(conditions, fields, options, callback){
   return findAllFn(this, 'users', conditions, fields, options, callback);
};

UserSchema.plugin(passportLocalMongoose, {usernameField : 'email'});


var User = mongoose.model('User', UserSchema);


//User.prototype.validPassword = function(password){
//    return this.password === password;
//};

module.exports.UserSchema = UserSchema;
module.exports.User = User;
