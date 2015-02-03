var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var clam_container = require('clam/core/container');
var $ = require('jquery');
var highlighter = require('./clam_module/highlighter');
var dynamic_ext = require('./clam_module/dynamic_ext');
var dynamic_config = require('./conf/dynamic_config');
var message = require('./clam_module/message');
var highlighter_activator = require('./clam_module/highlighter_activator');
var clam_scroller = require('clam-scroller/module/scroller');

clam_container.expose();

cutil.createPrototypes(message, {fadeOutTime: 300});
cutil.createPrototypes(highlighter, {}, $('#highlighter-1'));
cutil.createPrototypes(highlighter_activator);
cutil.createPrototypes(clam_scroller);
cutil.createPrototypes(dynamic_ext, dynamic_config);
