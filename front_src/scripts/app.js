var cutil = require('clam/core/util');
var clam_container = require('clam/core/container');
var $ = require('jquery');
var highlighter = require('./clam_module/highlighter');
var dynamic = require('./clam_module/dynamic');
var dynamic_config = require('./conf/dynamic_config');
var message = require('./clam_module/message');
var highlighter_activator = require('./clam_module/highlighter_activator');

clam_container.expose();

cutil.createPrototypes(message, {fadeOutTime: 300});
cutil.createPrototypes(highlighter, {}, $('#highlighter-1'));
cutil.createPrototypes(highlighter_activator);
cutil.createPrototypes(dynamic, dynamic_config);
