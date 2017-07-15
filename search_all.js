const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: '127.0.0.1:9200',
  log: 'error'
});

const search = function search(index, body) {
  return esClient.search({index: index, body: body});
};

// only for testing purposes
// all calls should be initiated through the module
const test = function test() {
  let body = {
    size: 1000,
    from: 0,
    query: {
      match_all: {}
    }
  };

  console.log(`retrieving all documents (displaying ${body.size} at a time)...`);
  search('library', body)
  .then(results => {
    results.hits.hits.map(function(item,idx){
      return console.log("%s at index %s",item._id,idx)
    })
  })
  .catch(console.error);
};

test();

module.exports = {
  search
};
