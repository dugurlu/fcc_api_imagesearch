const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const QuerySchema = new Schema({
  query: String,
  date: Date
})

module.exports = mongoose.model('QueryModel', QuerySchema);