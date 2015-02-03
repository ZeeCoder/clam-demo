var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var clam_container = require('clam/core/container');
var $ = require('jquery');
var highlighter = require('./clam_module/highlighter');
var dynamic = require('./clam_module/dynamic');
var dynamic_config = require('./conf/dynamic_config');
var message = require('./clam_module/message');
var highlighter_activator = require('./clam_module/highlighter_activator');
var clam_scroller = require('clam-scroller/module/scroller');
var clam_scroller_ext = require('./clam_module/scroller_ext');


clam_container.expose();

cutil.createPrototypes(message, {fadeOutTime: 300});
cutil.createPrototypes(highlighter, {}, $('#highlighter-1'));
cutil.createPrototypes(highlighter_activator);
cutil.createPrototypes(clam_scroller_ext);
cutil.createPrototypes(dynamic, dynamic_config);
