var cutil = require('clam/core/util');
var clam_container = require('clam/core/container');
var $ = require('jquery');
var highlighter = require('./clam_module/highlighter');
var message = require('./clam_module/message');
var highlighter_creator = require('./clam_module/highlighter_creator');

clam_container.expose();

cutil.createPrototypes(message, {fadeOutTime: 300});
cutil.createPrototypes(highlighter, {}, $('#highlighter-1'));
cutil.createPrototypes(highlighter_creator);
