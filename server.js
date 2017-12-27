// User Story: I can get the image URLs, alt text and page urls for a set of images relating to a given search string.

// User Story: I can paginate through the responses by adding a ?offset=2 parameter to the URL.

// User Story: I can get a list of the most recently submitted search strings.

// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongoose = require('mongoose')
var assert = require('assert')
var Query = require('./schema');

const GoogleImages = require('google-images');
const client = new GoogleImages(process.env.API_ID, process.env.API_KEY);

var url = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
mongoose.connect(url, {useMongoClient: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.get("/api/search/:query", (req, res) => {  
  // get image data
  let images = []
  client
    .search(req.params.query)
    .then(data => {
      data.forEach(i => {
        // construct result object by selection only relevant object keys
        let { url:imageUrl, description:altText, parentPage:pageUrl, thumbnail: { url:thumbnail } } = i
        images.push({'imageUrl': imageUrl, 'altText': altText, 'pageUrl': pageUrl, 'thumbnail': thumbnail})
      });
    
      // save query info into db for /latest endpoint
      var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      var query = new Query({query: req.params.query, date: Date.now(), url: fullUrl});
      query.save((err) => {
        if(err) {
          console.log(err)
          res.send(err)
        }
      });
      res.send(images)
    })
    .catch(reason => {
      res.json({'result': 'error', 'reason': reason})
    })
  
});

app.get("/api/latest", (req, res) => {
  Query.find()
    .sort({'date': -1})
    .limit(10)
    .exec((err, queries) => {
      if(err) res.json([]);
      res.json(queries)
    })
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
