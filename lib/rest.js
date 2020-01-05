/* 
    rest.js
    amid

    Created by Tom de Grunt on 2010-10-03 in mongodb-rest
    New version Copyright (c) 2013 Mariano Fiorentino, Andrea Negro	
		This file is part of amid.
*/ 

var ObjectID = require('mongodb').ObjectID;

var MongoClient = require('mongodb').MongoClient,
    app = module.parent.exports.app,
    config = module.parent.exports.config,
    util = require("./util"),
    BSON = require('bson')

//return all db/collection
app.get('/db', function(req, res) {
    var client = new MongoClient('mongodb://'+config.db.host+':'+config.db.port);

    client.connect().then(() => {
        var db = client.db('admin');
        return db.admin().listDatabases().then(dbs => {
            var ret=[];
            return Promise.all(dbs.databases.map(db => 
                client.db(db.name).collections().then(coll => {
                    ret.push({
                        name: db.name,
                        collections: coll.map(c => ({name: c.collectionName})),
                    });
                })
            )).then(() => {
                res.send(ret);
            });
        });
    }).catch(err => {
        console.error(err);
        res.status(500).end();
    }).finally(() => client.close());
});

//return key of collection
app.get('/:db/:collection/:id?', function(req, res) {
  var query = {};
  if (Object.keys(req.body).length > 0) {
   query = req.body;
  } else if (req.query.query) {
   query = JSON.parse(req.query.query, function (key, value) {
    var a;
    if (typeof value === 'string') {
        a = /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))?)Z$/.exec(value);
        if (a) {
            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[5],
                            +a[6], +a[7]));
        }
    }
    return value;
   });
  }
  // Providing an id overwrites giving a query in the URL
  if (req.params.id) {
    query = {'_id': new BSON.ObjectID(req.params.id)};
  }
  var options = req.params.options || {};

  var test = ['limit','sort','fields','skip','hint','explain','snapshot','timeout'];

  for( o in req.query ) {
    if( test.indexOf(o) >= 0 ) {
	try {
		options[o] = JSON.parse(req.query[o]);
	} catch (e) {
		options[o] = req.query[o];
	}
    } 
  }
  var operation = req.query.operation || 'find';

  var client = new MongoClient('mongodb://'+config.db.host+':'+config.db.port);
  client.connect().then(() => {
      var db = client.db(req.params.db);
      var collection = db.collection(req.params.collection);
      var operationModule = require('./operations/'+operation);
      return operationModule.send(collection, query, options, util, req, res, db);
  }).catch(err => {
      console.error(err);
      res.status(500).end();
  }).finally(() => client.close());
});    

/**
 * Insert
 */
app.post('/:db/:collection', function(req, res) {
    var client = new MongoClient('mongodb://'+config.db.host+':'+config.db.port);
    client.connect().then(() => {
        var db = client.db(req.params.db);
        var collection = db.collection(req.params.collection);
        return collection.insert(req.body || {}).then((ins) => {
            res.status(201).send(Array.isArray() ? 
            ins.insertedIds.map(id => ({_id: id})) : 
                ({_id: ins.insertedIds[0]}));
        });
    }).catch(err => {
        console.error(err);
        res.status(500).end();
    }).finally(() => client.close());
});

/**
 * Update
 */
app.put('/:db/:collection/:id', function(req, res) {
    var client = new MongoClient('mongodb://'+config.db.host+':'+config.db.port);
    client.connect().then(() => {
        var db = client.db(req.params.db);
        var collection = db.collection(req.params.collection);
        var spec = {'_id': new BSON.ObjectID(req.params.id)};
        return collection.update(spec, req.body).then(() => {
            res.status(201).send({_id: req.params.id});
        });
    }).catch(err => {
        console.error(err);
        res.status(500).end();
    }).finally(() => client.close());
});

/*     
 * Delete
 */
app.delete('/:db/:collection/:id', function(req, res) {
    var client = new MongoClient('mongodb://'+config.db.host+':'+config.db.port);
    client.connect().then(() => {
        var db = client.db(req.params.db);
        var collection = db.collection(req.params.collection);
        var spec = {'_id': new BSON.ObjectID(req.params.id)};
        return collection.deleteOne(spec).then(() => {
            res.status(200).send({_id: req.params.id});
        });
    }).catch(err => {
        console.error(err);
        res.status(500).end();
    }).finally(() => client.close());
});