'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;
var dynamic_config = require('../conf/dynamic_config');
var dynamic = require('./dynamic');
var $ = require('jquery');

function DynamicExt($jQObj, conf) {
    conf.prototypeHTML = '<div class="jsm-dynamic-ext b-dynamic"> <a href="javascript: void(0)" class="jsm-dynamic-ext__add-embedded-btn">New embedded</a> | <a href="javascript: void(0)" class="jsm-dynamic-ext__add-sibling-btn">New sibling</a> | <a href="javascript: void(0)" class="jsm-dynamic-ext__toggle-highlight">Highlight</a> | <a href="javascript: void(0)" class="jsm-dynamic-ext__destroy">Destroy</a> <div class="b-dynamic__additional-modules jsm-dynamic-ext__additional-modules"></div> </div>';
    dynamic.apply(this, arguments);

    this.addEventListener('add', this.add);
}

inherits(DynamicExt, dynamic);

DynamicExt.prototype.add = function() {
    console.log('DynamicExt.prototype.add');
    this.deferred = $.Deferred();
    this.addMore();
    return this.deferred;
};

DynamicExt.prototype.addMore = function() {
    var self = this;
    self.deferred.reject();
    setTimeout(function(){
        // self.deferred.resolve();
    }, 3000);
};

module.exports = DynamicExt;
