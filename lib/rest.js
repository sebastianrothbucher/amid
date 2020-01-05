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
   var query = req.query.query ? JSON.parse(req.query.query, function (key, value) {
    var a;
    if (typeof value === 'string') {
        a = /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))?)Z$/.exec(value);
        if (a) {
            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[5],
                            +a[6], +a[7]));
        }
    }
    return value;
  }) : {};

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
    
    try {
        if(req.body) {

            var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true}));
            db.open(function(err, db) {
            db.authenticate(config.db.username, config.db.password, function () {
                db.collection(req.params.collection, function(err, collection) {
                //copre bug extjs 
                if(req.body["id"]==null) {
                        delete req.body["id"];
                }
                // We only support inserting one document at a time
                var toInsert = Array.isArray(req.body) ? req.body[0] : req.body;
                toInsert._id = new ObjectID();
                
                collection.insert(toInsert,{w:1}, function(err, docs) {
                    res.header('Location', '/'+req.params.db+'/'+req.params.collection+'/'+toInsert._id.toHexString());
                    res.header('Content-Type', 'application/json');
                    if(err) {res.send('{"ko":"'+err+'}', 500);}
                    else {res.send('{"ok":1}', 201);}
                    db.close();
                });
                });
            });
            });
        } else {
            res.header('Content-Type', 'application/json');
            res.send('{"ok":0}',200);
        }
    } catch (e) {
        res.header('Content-Type', 'application/json');
        res.send('{"ko":"'+e.message+'}',500);
    }
});

/**
 * Update
 */
app.put('/:db/:collection/:id', function(req, res) {
    try {
        var spec = {'_id': new BSON.ObjectID(req.params.id)};

        var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true}));
        db.open(function(err, db) {
            db.authenticate(config.db.username, config.db.password, function () {
            db.collection(req.params.collection, function(err, collection) {

                collection.update(spec, req.body, true,{w:1} ,function(err, docs) {

                res.header('Content-Type', 'application/json');
                if(err) {res.send('{"ko":"'+err+'}', 500);}
                else {res.send('{"ok":1}');}
                db.close();
                });

            });
            });
        });
    } catch (e) {
        res.header('Content-Type', 'application/json');
        res.send('{"ko":"'+e.message+'}',500);
    }
});

/*     
 * Delete
 */
app.delete('/:db/:collection/:id', function(req, res) {
    
    try {
        
        var spec = {'_id': new BSON.ObjectID(req.params.id)};    
        var db = new mongo.Db(req.params.db, new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true}));
        db.open(function(err, db) {
            db.authenticate(config.db.username, config.db.password, function () {
                
            db.collection(req.params.collection, function(err, collection) {
                
                collection.remove(spec,{w:1}, function(err, docs) {
                    
                    res.header('Content-Type', 'application/json');
                    if(err) {res.send('{"ko":"'+err+'}', 500);}
                    else {res.send('{"ok":1}');}
                    db.close();
                });
            });
            });
        });
    } catch (e) {
        res.header('Content-Type', 'application/json');
        res.send('{"ko":"'+e.message+'}',500);
    }
});
      
      