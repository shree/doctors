// Packages
const express = require("express");
const bodyParser = require("body-parser");
const rp = require('request-promise');
const elasticsearch = require('elasticsearch');

//Create App
const app = express();

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Elasticsearch
const esClient = new elasticsearch.Client({
  host: '127.0.0.1:9200',
  log: 'error'
});

const search = function search(index, body) {
  return esClient.search({index: index, body: body});
};

const addDoctors = function addDoctors(index, type, doctors) {
  let bulkBody = [];

  doctors.forEach(item => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _id: item.uid
      }
    });
    bulkBody.push(item);
  });

  esClient.bulk({body: bulkBody})
  .then(response => {
    let errorCount = 0;
    response.items.forEach(item => {
      if (item.index && item.index.error) {
        console.log(++errorCount, item.index.error);
      }
    });
    console.log(`Successfully indexed ${doctors.length - errorCount} out of ${doctors.length} items`);
  })
  .catch(console.err);
};

//Endpoints
app.get('/api/v1/doctors/search', function(req,res){

  var options = {
    uri: "https://api.betterdoctor.com/2016-03-01/doctors",
    qs: {
        user_key: process.env.USER_KEY,
        name: req.query.name || "a",
        skip: req.query.skip || "0",
        limit: req.query.limit || "100"
        //...can include all other query parameters as well...
    },
    json: true
  };

  //Make a request and get max results
  rp(options)
  .then(function(resp){
    //Add the doctors to elastic search if they don't already exist
    addDoctors('library','doctor',resp.data);
    res.send("Success");
  })
  .catch(function(err){
    console.log(err);
    res.send(err);
  })
});

//Error Handling for other requests
app.use(function(err,req,res,next){
  res.status(err.status || 500);
});

// module.exports = app;
var port = process.env.PORT || 8000;
app.listen(port,  function() {
  console.log("Running on port: %s", port);
});
