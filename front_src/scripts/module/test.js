var clam_module = require('../../bower_components/clam/core/module');
var modifier = require('../../bower_components/clam/core/modifier');
var inherits = require('util').inherits;

var settings = {
    name: 'test',
    defConf: {
        highlightValue: true
    },
    events: [
        'preHiClick',
        'onHighlightClick'
    ],
    hooks: [
        'hi',
        'highlight'
    ]
};

function Test($jQObj, conf) {
    clam_module.apply(this, [$jQObj, settings, conf]);

    // this.expose();

    // These are now called automatically
    // this.registerEvents(settings.events);
    // this.registerHooks(settings.hook);
    // this.initializeHooks();
    // this.initializeProperties();
}

inherits(Test, clam_module);

Test.prototype.initializeHooks = function() {
    this.addHookEvent('highlight', 'click', true);
    this.addHookEvent('hi', 'click');
};

Test.prototype.initializeProperties = function() {
    this.hihlightMod = new modifier(this.getHook('highlight'), 'test');
};

// Events
Test.prototype.onHiClick = function(hook, e) {
    e.stopPropagation();
    this.triggerEvent('preHiClick');
    this.sayHi();
};

Test.prototype.onHighlightClick = function() {
    this.triggerEvent('onHighlightClick', ['[desc] data for onHighlightClick']);
    this.toggleHighlight();
};

// Methods
Test.prototype.sayHi = function() {
    this.log('Hi! I\'m a "' + this.module.type + '" type module.');
};

Test.prototype.toggleHighlight = function() {
    if (this.hihlightMod.get('highlight')) {
        this.hihlightMod.off('highlight');
    } else {
        this.hihlightMod.set('highlight', this.module.conf.highlightValue);
    }
};

module.exports = Test;
