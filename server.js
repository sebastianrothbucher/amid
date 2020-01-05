/*
    server.js
    amid

    Created by Tom de Grunt on 2010-10-03 in mongodb-rest
    New version Copyright (c) 2013 Mariano Fiorentino, Andrea Negro
                This file is part of amid.
*/
var fs = require("fs");

config = JSON.parse(fs.readFileSync(process.cwd()+"/config.json"));

module.exports.config = config;

// Worker processes have a http server.
var express = require('express');
var bodyParser  = require('body-parser');
var app = module.exports.app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Bind to a port
require('./lib/main');
require('./lib/command');
require('./lib/rest');
app.listen(config.server.port, config.server.address);

