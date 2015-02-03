'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;
var dynamic_config = require('../conf/dynamic_config');
var $ = require('jquery');

var settings = {
    conf: {
        prototypeHTML: '<div class="jsm-dynamic b-dynamic"> <a href="javascript: void(0)" class="jsm-dynamic__add-embedded-btn">New embedded</a> | <a href="javascript: void(0)" class="jsm-dynamic__add-sibling-btn">New sibling</a> | <a href="javascript: void(0)" class="jsm-dynamic__toggle-highlight">Highlight</a> | <a href="javascript: void(0)" class="jsm-dynamic__destroy">Destroy</a> <div class="b-dynamic__additional-modules jsm-dynamic__additional-modules"></div> </div>',
        allowAddSibling: true,
        allowAddEmbedded: true
    }
    // hasGlobalHooks: true
};

function Dynamic($jQObj, conf) {
    //var self = this;
    console.log('Dynamic');
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();

    this.moduleModifier = new modifier(this.module.$object, 'dynamic');

    if (this.module.conf.allowAddEmbedded) {
        this.getHook('add-embedded-btn').on('click', $.proxy(this.addEmbedded, this));
    } else {
        this.getHook('add-embedded-btn').remove();
    }

    if (this.module.conf.allowAddSibling) {
        this.getHook('add-sibling-btn').on('click', $.proxy(this.addSibling, this));
    } else {
        this.getHook('add-sibling-btn').remove();
    }

    this.getHook('destroy').on('click', $.proxy(this.destroy, this));
    
    this.getHook('toggle-highlight').on('click', $.proxy(this.toggleHighlight, this));
}

inherits(Dynamic, clam_module);

// Dynamic.prototype.destroy = function() {
//     clam_module.prototype.destroy.call(this, false);
// };

Dynamic.prototype.addEmbedded = function() {
    var self = this;
    $.when(this.triggerEvent('add'))
    .fail(function() {
        console.log('ERRROR');
    })
    .always(function() {
        self.addAdditionalModule();
    });
};

Dynamic.prototype.addSibling = function() {
    this.addAdditionalModule(true);
};

Dynamic.prototype.toggleHighlight = function() {
    this.moduleModifier.toggle('highlight');
};

Dynamic.prototype.addAdditionalModule = function(asSibling) {
    var $embeddedModul = $($.parseHTML(this.module.conf.prototypeHTML));
    if (asSibling) {
        this.module.$object.after($embeddedModul);
    } else {
        this.getHook('additional-modules').append($embeddedModul);
    }
    
    cutil.createPrototypes(this.constructor, dynamic_config, $embeddedModul);
};

module.exports = Dynamic;
