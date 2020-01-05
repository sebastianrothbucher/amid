exports.send = function (collection, query, options, util, req, res) {
    //console.log(options);
    return collection.find(query, options).toArray().then(docs => {
      if(req.params.id) {
        res.send(docs.map(doc => util.flavorize(doc, "out"))[0]);
      } else {
        res.send(docs.map(doc => util.flavorize(doc, "out")));
      }
    });
}
