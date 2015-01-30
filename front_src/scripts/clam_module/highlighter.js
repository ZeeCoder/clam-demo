'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;
var $ = require('jquery');

var settings = {
    conf: {
        highlightType: true
    },
    hasGlobalHooks: true
};

var globalCount = 0;

function Highlighter($jQObj, conf) {
    //var self = this;
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();

    this.localCount = 0;
    this.active = true;

    this.getHook('highlight').on('click', $.proxy(this.toggleHighlight, this));

    this.highlightMod = new modifier(
        this.getHook('highlight'),
        this.module.name
    );
}

inherits(Highlighter, clam_module);

Highlighter.prototype.toggleHighlight = function(e) {
    e.stopPropagation();

    if (!this.active) {
        return;
    }

    this.getHook('global-counter').text(++globalCount);
    this.getHook('local-counter').text(++this.localCount);

    if (this.highlightMod.get('highlight')) {
        this.highlightMod.off('highlight');
    } else {
        this.highlightMod.set('highlight', this.module.conf.highlightType);
    }
};

Highlighter.prototype.inactivate = function() {
    this.highlightMod.set('inactive', true);
    this.active = false;
};

Highlighter.prototype.activate = function() {
    this.highlightMod.set('inactive', false);
    this.active = true;
};

module.exports = Highlighter;
