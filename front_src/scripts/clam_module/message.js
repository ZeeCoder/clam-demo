'use strict';
var clam_module = require('clam/core/module');
//var clam_module = require('clam/core/module');
//var clam_container = require('clam/core/container');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;

var settings = {
    type: 'singleton',
    hasGlobalHooks: true,
    conf: {
        fadeOutTime: 500
    }
};

function Message($jQObj, conf) {
    var self = this;
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();
    // throw this.prettify('error');
    // clam_container.get('clam-module');

    this.messageMod = new modifier(
        this.module.$object,
        this.module.name
    );

    this.isOpen = !!this.messageMod.get('type');
    
    this.getHooks('test-btn').each(function(){
        $(this).on('click', function() {
            self.testClick($(this));
        });
    });
    
    this.getHooks('close-btn').on('click', function(){
        self.close();
    });
}

inherits(Message, clam_module);

Message.prototype.message = function(message, type) {
    if (typeof type === 'undefined') {
        type = 'success';
    }

    this.messageMod.set('type', type);
    this.getHook('message').text(message);

    if (!this.isOpen) {
        this.module.$object.fadeIn(300);
        this.isOpen = true;
    }
};

Message.prototype.close = function(message, type) {
    this.module.$object.fadeOut(300);
};

Message.prototype.testClick = function($hook) {
    var conf = this.getHookConfiguration($hook);
    this.message(conf.message, conf.type);
};

module.exports = Message;
