exports.send =  function (collection, query, options, util, req, res,db, err) {
    //console.log(options);
    collection.find(query, options).count().then(count => {
        res.send({count});   
    });
}
