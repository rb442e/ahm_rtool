/**
 * Created by rbhatnagar on 5/15/2018.
 */

'use strict';
const mongoose = require('mongoose');
const conn = mongoose.createConnection('mongodb://localhost/auth');
module.exports = conn;
