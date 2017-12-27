const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const QuerySchema = new Schema({
  query: String,
  date: Date,
  url: String
})

module.exports = mongoose.model('QueryModel', QuerySchema);