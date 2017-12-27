// init project
const express = require('express');
const app = express();
const mongoose = require('mongoose')
const assert = require('assert')
const Query = require('./schema');

// initialize search API
const GoogleImages = require('google-images');
const client = new GoogleImages(process.env.API_ID, process.env.API_KEY);

// initialize DB connection
const url = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
mongoose.connect(url, {useMongoClient: true});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.static('public'));

app.get("/api", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/api/search/:query", (req, res) => {  
  // get image data
  let page = req.query.offset ? req.query.offset : 1
  let images = []
  client
    .search(req.params.query, {page: page})
    .then(data => {
      images = data.map( i => ({
        imageUrl: i.url,
        altText: i.description,
        pageUrl: i.parentPage,
        thumbnail: i.thumbnail.url
      }))
    
      // save query info into db for /latest endpoint
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const query = new Query({query: req.params.query, date: Date.now(), url: fullUrl});
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
      let result = queries.map(query => ({
        query: query.query,
        url: query.url,
        date: query.date
      }))
      res.json(result)
    })
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
