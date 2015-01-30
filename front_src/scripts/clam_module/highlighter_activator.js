'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var clam_container = require('clam/core/container');
var highlighter = require('./highlighter');
//var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;

var settings = {
    type: 'singleton',
    // hasGlobalHooks: true,
    conf: {}
};

function HighlighterActivator($jQObj, conf) {
    //var self = this;
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();
    // throw this.prettify('error');
    
    this.allActivated = false;

    this.getHook('activate-btn').on('click', $.proxy(this.activate, this));
}

inherits(HighlighterActivator, clam_module);

HighlighterActivator.prototype.activate = function() {
    if (this.allActivated) {
        return;
    }
    this.allActivated = true;

    clam_container.get('message').message('Successful modul activation!');

    this.getHook('activate-btn').fadeOut('300');

    var prototypes = cutil.createPrototypes(highlighter, {}, $('#highlighter-2'));
    $.each(prototypes, function() {
        this.activate();
    });
};

module.exports = HighlighterActivator;
