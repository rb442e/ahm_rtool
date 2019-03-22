/**
 * Created by rbhatnagar on 5/13/2018.
 */

'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define our model
const userSchema = new Schema({
    email: { type: String, unique: true, lowercase: true },
    password: String
});
//create model class
//const ModalClass = mongoose.model('userLogin', userSchema);
module.exports = userSchema;
