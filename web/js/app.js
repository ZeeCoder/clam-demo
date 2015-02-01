(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var cutil = require('clam/core/util');
var clam_container = require('clam/core/container');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./clam_module/dynamic":6,"./clam_module/highlighter":7,"./clam_module/highlighter_activator":8,"./clam_module/message":9,"./conf/dynamic_config":10,"clam/core/container":2,"clam/core/util":5}],2:[function(require,module,exports){
(function (global){
'use strict';
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

module.exports = {
    modules: {},

    add: function(clam_module) {
        var moduleName;
        if ($.isArray(clam_module)) {
            moduleName = clam_module[0].module.name;
        } else {
            moduleName = clam_module.module.name;
        }

        if (typeof this.modules[moduleName] !== 'undefined') {
            if ($.isArray(this.modules[moduleName]) && $.isArray(clam_module)) {
                $.merge(this.modules[moduleName], clam_module);
            } else {
                throw 'The "' + moduleName + '" key is already set in the container. Adding the module to the container failed.';
            }
        } else {
            this.modules[moduleName] = clam_module;
        }
    },

    get: function(moduleName) {
        if (typeof this.modules[moduleName] === 'undefined') {
            throw 'Nothing is set under the "' + moduleName + '" key in the container.';
        }

        return this.modules[moduleName];
    },

    expose: function() {
        window.container = this;
        console.warn('The clam container is now exposed as "container".');
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
var cutil = require('./util');

// Constructor
// ===========
function Modifier($object, name, prefix) {
    if (typeof prefix !== 'string') {
        prefix = 'b';
    }

    // Attributes
    this.modifier = {
        $object: $object,
        prefix: prefix,
        name: name,
        prefixedName: prefix + '-' + name
    };

    try {
        cutil.validateJQueryObject($object, 1);
    } catch (e) {
        // console.error($object);
        throw '[modifier: "' + name + '"]' + e;
    }
}

// API
//====
Modifier.prototype.on = function(name) {
    return this.set(name, true);
};

Modifier.prototype.off = function(name) {
    return this.set(name, false);
};

Modifier.prototype.toggle = function(name) {
    if (this.get(name)) {
        return this.set(name, false);
    }

    return this.set(name, true);
};

// Gets a modifier on a BEM object.
Modifier.prototype.get = function(name) {
    var modPrefix = this.typeID;
    var modifierClass = cutil.getModifierClass(this.modifier.prefixedName, name);

    var classes = cutil.getClassesByPrefix(modifierClass, this.modifier.$object);
    // Modifier not found
    if (classes.length === 0) {
        return false;
    }

    value = classes[0].split('_');

    // Modifier found, but doesn't have a specific value
    if (typeof value[1] == 'undefined') {
        return true;
    }

    // Modifier found with a value
    return value[1];
};

// Sets a modifier on a BEM object.
Modifier.prototype.set = function(name, value) {
    if (
        typeof value != 'string' &&
        typeof value != 'boolean'
    ) {
        throw 'A BEM modifier value can only either be "string", or "boolean". The given value was of type "' + (typeof value) + '".';
    }

    var modifierClass = cutil.getModifierClass(this.modifier.prefixedName, name);
    cutil.removeClassesByPrefix(modifierClass, this.modifier.$object);
    if (value !== false) {
        modifierClass = cutil.getModifierClass(this.modifier.prefixedName, name, value);
        this.modifier.$object.addClass(modifierClass);
    }

    return this;
};

// Export module
//==============
module.exports = Modifier;

},{"./util":5}],4:[function(require,module,exports){
(function (global){
'use strict';
var cutil = require('./util');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

// Constructor
// ===========
function Module($object, settings, conf) {
    var moduleName = cutil.getModuleName(this);
    var className = cutil.getModuleClass(moduleName);

    var depth = 1;
    if (typeof settings.hasGlobalHooks === 'undefined') {
        settings.hasGlobalHooks = false;
    }
    // Converting possible thruthy values to true
    settings.hasGlobalHooks = !!settings.hasGlobalHooks;

    if (settings.type !== 'singleton') {
        settings.type = 'basic';

        depth = $object.parents('.' + className).length + 1;
    } else {
        // Check whether the module can be a singleton or not
        var classElementCount = $('.' + className).length;
        if (classElementCount > 1) {
            throw 'The module' + ' [' + moduleName + '] ' + 'could not be instantiated as a singleton. ' + classElementCount + ' DOM elements were found with the "' + className + '" class instead of just one.';
        }
    }

    this.module = {
        $object: $object,
        name: moduleName,
        class: className,
        conf: {},
        events: {},
        hooks: {},
        type: settings.type,
        depth: depth,
        hasGlobalHooks: settings.hasGlobalHooks
    };

    try {
        cutil.validateJQueryObject($object, 1);
    } catch (e) {
        console.error(e);
    }

    // Checking if the jQuery object has the needed jsm class
    if (!$object.hasClass(this.module.class)) {
        console.error('The given jQuery Object does not have this module\'s class.');
    }

    // Setting up default configuration
    if (settings.conf !== null) {
        $.extend(true, this.module.conf, settings.conf);
    }

    // Merging in data- configuration
    $.extend(true, this.module.conf, this.getDataConfiguration());

    // Merging in passed configuration
    if (typeof conf === 'object') {
        $.extend(true, this.module.conf, conf);
    }
};

// API
//====
Module.prototype.addHookEvent = function(hookName, eventType, addPrePostEvents) {
    var self = this;
    var $hook = this.getHooks(hookName);
    if ($hook.length === 0) {
        return false;
    }

    var eventName = hookName.split('-');
    eventName.push(eventType);
    var eventNameLength = eventName.length;
    for (var i = eventNameLength - 1; i >= 0; i--) {
        eventName[i] = cutil.ucfirst(eventName[i]);
    };
    var eventName = eventName.join('');

    $hook.each(function() {
        $(this).on(eventType, function(e) {
            if (addPrePostEvents) {
                self.triggerEvent('pre' + eventName, [e, $(this)]);
            }
            self['on' + eventName].apply(self, [e, $(this)]);
            if (addPrePostEvents) {
                self.triggerEvent('post' + eventName, [e, $(this)]);
            }
        });
    });
};

Module.prototype.addEventListener = function(eventName, callback) {
    this.module.events[eventName] = callback;
};

Module.prototype.getModuleName = function() {
    return cutil.getModuleName(this);
};

Module.prototype.triggerEvent = function(eventName, args) {
    if (typeof this.module.events[eventName] !== 'function') {
        return false;
    }

    this.module.events[eventName].apply(this, args);
};

Module.prototype.prettify = function(message, subject) {
    return '[' + this.module.name + (subject ? ': ' + subject: '') + '] ' + message;
};

/**
 * Gets a single - or no - hook jQuery object from the module context.
 * The found hook will be saved, using the hookName as a key. This way, only one
 * search occurs for any given hookName in the DOM tree.  
 * Finding more than one hook will result in an exception. (An empty result is
 * allowed by default.)
 * @param string hookName The searched hook name.
 * @param boolean emptyResultNotAllowed If set to true, then not finding a hook
 * will also throw an exception.
 * @return jQuery Object (Clam Hook)
 */
Module.prototype.getHook = function(hookName, emptyResultNotAllowed) {
    return this.getHooks(hookName, 1, emptyResultNotAllowed);
};

/**
 * Gets any number of jQuery object - including none - from the module context.
 * The found hook will be saved, using the hookName as a key. This way, only one
 * search occurs for any given hookName in the DOM tree.
 * @param string hookName The searched hook name.
 * @param int expectedHookNum (optional) Defines exactly how many hook objects
 * must be returned in the jQuery collection. If given, but the found hooks
 * count does not equal that number, then an exception will be thrown. 
 * @param boolean emptyResultNotAllowed If set to true, then not finding hooks
 * will also throw an exception.
 * @return jQuery Object (Clam Hook)
 */
Module.prototype.getHooks = function(hookName, expectedHookNum, emptyResultNotAllowed) {
    if (typeof this.module.hooks[hookName] === 'undefined') {
        this.module.hooks[hookName] = this.findHooks(hookName, expectedHookNum, emptyResultNotAllowed);
    }

    return this.module.hooks[hookName];
};

/**
 * Gets a single - or no - hook jQuery object from the module context using
 * jQuery selectors. Useful when hooks can be added dinamically to the module.
 * Finding more than one hook will result in an exception. (An empty result is
 * allowed by default.)
 * @param string hookName The searched hook name.
 * @param boolean emptyResultNotAllowed If set to true, then not finding a hook
 * will also throw an exception.
 * @return jQuery Object (Clam Hook)
 */
Module.prototype.findHook = function(hookName, emptyResultNotAllowed) {
    return this.findHooks(hookName, 1, emptyResultNotAllowed);
};


/**
 * Gets any number of jQuery object - including none - from the module context
 * using jQuery selectors. Useful when hooks can be added dinamically to the
 * module.
 * @param string hookName The searched hook name.
 * @param int expectedHookNum (optional) Defines exactly how many hook objects
 * must be returned in the jQuery collection. If given, but the found hooks
 * count does not equal that number, then an exception will be thrown. 
 * @return jQuery Object (Clam Hook)
 */
Module.prototype.findHooks = function(hookName, expectedHookNum, emptyResultNotAllowed) {
    var self = this;
    var hookClassName = this.getHookClassName(hookName);
    var $hooks;
    var $inContextHooks;

    if (this.module.type == 'singleton') {
        if (this.module.hasGlobalHooks) {
            $hooks = $('.' + hookClassName);
        } else {
            $hooks = this.module.$object.find('.' + hookClassName);

            // Adding the main module element if it has the hook class
            if (this.module.$object.hasClass(hookClassName)) {
                $hooks = $hooks.add(this.module.$object);
            }
        }
    } else {
        // Getting all hooks in the module, excluding other instances of the
        // same module inside the current one.

        // Creating a "depthClass" to exclude the same types of modules inside
        // the actual one when searching for a hook.
        var depthClass = [];
        for (var i = this.module.depth; i >= 0; i--) {
            depthClass.push('.' + this.module.class);
        }
        depthClass = depthClass.join(' ');

        $hooks =
            this.module.$object
            .find('.' + hookClassName)
            // Excluding all hooks inside other module instances
            .not(depthClass + ' .' + hookClassName)
            // Excluding all other modules that has the hook class
            .not(depthClass + '.' + hookClassName);

        // Adding every hook outside of the module instances.
        if (this.module.hasGlobalHooks) {
            var $globalHooks =
                $('.' + hookClassName)
                // Excluding hooks from within modules
                .not('.' + this.module.class + ' .' + hookClassName)
                .not('.' + this.module.class + '.' + hookClassName);
                    
            if ($globalHooks.length) {
                $hooks = $hooks.add($globalHooks);
            }
        }

        // Adding the main module element if it has the hook class
        if (this.module.$object.hasClass(hookClassName)) {
            $hooks = $hooks.add(this.module.$object);
        }
    }

    if (
        typeof expectedHookNum === 'number' &&
        expectedHookNum != $hooks.length
    ) {
        if (
            $hooks.length !== 0 ||
            emptyResultNotAllowed
        ) {
            console.error($hooks);
            throw 'An incorrect number of hooks were found. Expected: ' + expectedHookNum + '. Found: ' + $hooks.length + '. Hook name: "' + hookClassName + '"';
        }
    }

    return $hooks;
};

Module.prototype.getHookClassName = function(hookName) {
    return this.module.class + '__' + hookName;
};

Module.prototype.getDataConfiguration = function() {
    var dataConf = this.module.$object.data(cutil.getModuleClass(this.module.name));
    if (typeof dataConf === 'undefined') {
        dataConf = {};
    }

    if (typeof dataConf !== 'object') {
        console.error('The data-* attribute\'s content was not a valid JSON. Fetched value: ' + dataConf);
    }

    return dataConf;
};

Module.prototype.getHookConfiguration = function($hook) {
    return $hook.data(this.module.class);
};

Module.prototype.expose = function(containerName) {
    if (typeof containerName === 'undefined') {
        containerName = 'exposed_modules';
    }
    
    if (typeof window[containerName] === 'undefined') {
        window[containerName] = {};
    }

    var moduleName = this.module.name.replace(/\-/g, '_');

    if (this.module.type == 'singleton') {
        window[containerName][moduleName] = this;

        console.warn('Exposed as: "' + containerName + '.' + moduleName + '".');
    } else {
        if (typeof window[containerName][moduleName] === 'undefined') {
            window[containerName][moduleName] = [];
        }

        var moduleCount = window[containerName][moduleName].length;

        window[containerName][moduleName].push(this);

        console.warn('Exposed as: "' + containerName + '.' + moduleName + '[' + moduleCount + ']".');
    }
};

// Export module
//==============
module.exports = Module;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./util":5}],5:[function(require,module,exports){
(function (global){
'use strict';
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var container = require('./container');

module.exports = {
    moduleConf: {
        prefix: 'jsm'
    },

    modifierConf: {
        prefix: {
            name: '--',
            value: '_'
        }
    },

    // Creates module instances for every DOM element that has the appropriate
    // module class. If the $containerObj jQuery object is given - containing
    // one element -, then the function will look for the module classes in that
    // container.
    createPrototypes: function(module, config, $containerObj) {
        // Getting the module name, to select the DOM elements.
        var moduleName = this.getModuleName(module);
        var moduleClass = this.getModuleClass(moduleName);

        if (
            typeof config === 'undefined' ||
            !config // falsy values
        ) {
            config = {};
        }

        // Get appropriate module DOM objects
        var $modules = null;
        if (typeof $containerObj !== 'undefined') {
            this.validateJQueryObject($containerObj);
            $modules = $containerObj.find('.' + moduleClass);
            if ($containerObj.hasClass(moduleClass)) {
                $modules = $modules.add($containerObj);
            }
        } else {
            $modules = $('.' + moduleClass);
        }

        // Create module instances
        var instances = [];
        if ($modules.length > 0) {
            $modules.each(function() {
                instances.push(new module($(this), config));
            });
        }

        if (instances.length > 0) {
            if (instances.length == 1 && instances[0].module.type == 'singleton') {
                instances = instances[0];
            }

            container.add(instances);

            return instances;
        }

        return null;
    },

    // Get's a modul's name from it's definition, or from a prototype
    getModuleName: function(module) {
        var funcDef = typeof module === 'function' ? String(module) : String(module.constructor);
        var funcName = funcDef.substr('function '.length);
        funcName = funcName.substr(0, funcName.indexOf('('));

        return funcName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },

    // Checks whether the given collection is a valid jQuery object or not.
    // If the collectionSize (integer) parameter is specified, then the
    // collection's size will be validated accordingly.
    validateJQueryObject: function($collection, collectionSize) {
        if (
            typeof collectionSize !== 'undefined' &&
            typeof collectionSize !== 'number'
        ) {
            throw 'The given "collectionSize" parameter for the jQuery collection validation was not a number. Passed value: ' + collectionSize + ', type: ' + (typeof collectionSize) + '.';
        }
        
        if ($collection instanceof jQuery === false) {
            throw 'This is not a jQuery Object. Passed type: ' + (typeof $collection);
        }

        if (
            typeof collectionSize !== 'undefined' &&
            $collection.length != collectionSize
        ) {
            throw 'The given jQuery collection contains an unexpected number of elements. Expected: ' + collectionSize + ', given: ' + $collection.length + '.';
        }
    },

    ucfirst: function(string) {
        return string.charAt(0).toUpperCase() + string.substr(1);
    },

    getModuleClass: function(name) {
        return this.moduleConf.prefix + '-' + name;
    },

    getModifierClass: function(baseName, modifierName, value) {
        if (typeof value !== 'string') {
            value = '';
        } else {
            value = this.modifierConf.prefix.value + value;
        }

        return baseName + this.modifierConf.prefix.name + modifierName + value;
    },

    getClassesByPrefix: function(prefix, $jQObj) {
        var classes = $jQObj.attr('class');
        if (!classes) { // if "falsy", for ex: undefined or empty string
            return [];
        }

        classes = classes.split(' ');
        var matches = [];
        for (var i = 0; i < classes.length; i++) {
            var match = new RegExp('^(' + prefix + ')(.*)').exec(classes[i]);
            if (match != null) {
                matches.push(match[0]);
            }
        }

        return matches;
    },

    removeClassesByPrefix: function(prefix, $jQObj) {
        var matches = this.getClassesByPrefix(prefix, $jQObj);
        matches = matches.join(' ');
        $jQObj.removeClass(matches);
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./container":2}],6:[function(require,module,exports){
(function (global){
'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;
var cutil = require('clam/core/util');
var dynamic_config = require('../conf/dynamic_config');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

var settings = {
    conf: {
        prototypeHTML: '<div class="jsm-dynamic b-dynamic"> <a href="javascript: void(0)" class="jsm-dynamic__add-embedded-btn">New embedded</a> | <a href="javascript: void(0)" class="jsm-dynamic__add-sibling-btn">New sibling</a> | <a href="javascript: void(0)" class="jsm-dynamic__toggle-highlight">Highlight</a> <div class="b-dynamic__additional-modules jsm-dynamic__additional-modules"></div> </div>',
        allowAddSibling: true,
        allowAddEmbedded: true
    }
    // hasGlobalHooks: true
};

function Dynamic($jQObj, conf) {
    //var self = this;
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();

    this.moduleModifier = new modifier(this.module.$object, this.module.name);

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
    
    this.getHook('toggle-highlight').on('click', $.proxy(this.toggleHighlight, this));
}

inherits(Dynamic, clam_module);

Dynamic.prototype.addEmbedded = function() {
    this.addAdditionalModule();
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
    
    cutil.createPrototypes(Dynamic, dynamic_config, $embeddedModul);
};

module.exports = Dynamic;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../conf/dynamic_config":10,"clam/core/modifier":3,"clam/core/module":4,"clam/core/util":5,"util":14}],7:[function(require,module,exports){
(function (global){
'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"clam/core/modifier":3,"clam/core/module":4,"clam/core/util":5,"util":14}],8:[function(require,module,exports){
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

},{"./highlighter":7,"clam/core/container":2,"clam/core/module":4,"clam/core/util":5,"util":14}],9:[function(require,module,exports){
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
        $(this).on('click', $.proxy(self.testClick, self, $(this)));
    });
    
    this.getHooks('close-btn').on('click', $.proxy(this.close, this));
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
    this.isOpen = false;
};

Message.prototype.testClick = function($hook) {
    var conf = this.getHookConfiguration($hook);
    this.message(conf.message, conf.type);
};

module.exports = Message;

},{"clam/core/modifier":3,"clam/core/module":4,"util":14}],10:[function(require,module,exports){
// Configuration for the dynamic.js module. Since some prototypes are
// instantiated in the app.js and also in the module itself later on,
// I saved the configuration, so that I don't have to update it at two
// different if changes were needed.
// To experiment, just change one of the values from true to false.
module.exports = {
    allowAddSibling: true,
    allowAddEmbedded: true
};

},{}],11:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],14:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":13,"_process":12,"inherits":11}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZnJvbnRfc3JjXFxzY3JpcHRzXFxhcHAuanMiLCJmcm9udF9zcmNcXGJvd2VyX2NvbXBvbmVudHNcXGNsYW1cXGNvcmVcXGNvbnRhaW5lci5qcyIsImZyb250X3NyY1xcYm93ZXJfY29tcG9uZW50c1xcY2xhbVxcY29yZVxcbW9kaWZpZXIuanMiLCJmcm9udF9zcmNcXGJvd2VyX2NvbXBvbmVudHNcXGNsYW1cXGNvcmVcXG1vZHVsZS5qcyIsImZyb250X3NyY1xcYm93ZXJfY29tcG9uZW50c1xcY2xhbVxcY29yZVxcdXRpbC5qcyIsImZyb250X3NyY1xcc2NyaXB0c1xcY2xhbV9tb2R1bGVcXGR5bmFtaWMuanMiLCJmcm9udF9zcmNcXHNjcmlwdHNcXGNsYW1fbW9kdWxlXFxoaWdobGlnaHRlci5qcyIsImZyb250X3NyY1xcc2NyaXB0c1xcY2xhbV9tb2R1bGVcXGhpZ2hsaWdodGVyX2FjdGl2YXRvci5qcyIsImZyb250X3NyY1xcc2NyaXB0c1xcY2xhbV9tb2R1bGVcXG1lc3NhZ2UuanMiLCJmcm9udF9zcmNcXHNjcmlwdHNcXGNvbmZcXGR5bmFtaWNfY29uZmlnLmpzIiwibm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGluaGVyaXRzXFxpbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXHByb2Nlc3NcXGJyb3dzZXIuanMiLCJub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcdXRpbFxcc3VwcG9ydFxcaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXHV0aWxcXHV0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xyXG52YXIgY2xhbV9jb250YWluZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvY29udGFpbmVyJyk7XHJcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xyXG52YXIgaGlnaGxpZ2h0ZXIgPSByZXF1aXJlKCcuL2NsYW1fbW9kdWxlL2hpZ2hsaWdodGVyJyk7XHJcbnZhciBkeW5hbWljID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9keW5hbWljJyk7XHJcbnZhciBkeW5hbWljX2NvbmZpZyA9IHJlcXVpcmUoJy4vY29uZi9keW5hbWljX2NvbmZpZycpO1xyXG52YXIgbWVzc2FnZSA9IHJlcXVpcmUoJy4vY2xhbV9tb2R1bGUvbWVzc2FnZScpO1xyXG52YXIgaGlnaGxpZ2h0ZXJfYWN0aXZhdG9yID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9oaWdobGlnaHRlcl9hY3RpdmF0b3InKTtcclxuXHJcbmNsYW1fY29udGFpbmVyLmV4cG9zZSgpO1xyXG5cclxuY3V0aWwuY3JlYXRlUHJvdG90eXBlcyhtZXNzYWdlLCB7ZmFkZU91dFRpbWU6IDMwMH0pO1xyXG5jdXRpbC5jcmVhdGVQcm90b3R5cGVzKGhpZ2hsaWdodGVyLCB7fSwgJCgnI2hpZ2hsaWdodGVyLTEnKSk7XHJcbmN1dGlsLmNyZWF0ZVByb3RvdHlwZXMoaGlnaGxpZ2h0ZXJfYWN0aXZhdG9yKTtcclxuY3V0aWwuY3JlYXRlUHJvdG90eXBlcyhkeW5hbWljLCBkeW5hbWljX2NvbmZpZyk7XHJcbiIsIid1c2Ugc3RyaWN0JztcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtb2R1bGVzOiB7fSxcblxuICAgIGFkZDogZnVuY3Rpb24oY2xhbV9tb2R1bGUpIHtcbiAgICAgICAgdmFyIG1vZHVsZU5hbWU7XG4gICAgICAgIGlmICgkLmlzQXJyYXkoY2xhbV9tb2R1bGUpKSB7XG4gICAgICAgICAgICBtb2R1bGVOYW1lID0gY2xhbV9tb2R1bGVbMF0ubW9kdWxlLm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVOYW1lID0gY2xhbV9tb2R1bGUubW9kdWxlLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMubW9kdWxlc1ttb2R1bGVOYW1lXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkodGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdKSAmJiAkLmlzQXJyYXkoY2xhbV9tb2R1bGUpKSB7XG4gICAgICAgICAgICAgICAgJC5tZXJnZSh0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0sIGNsYW1fbW9kdWxlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RoZSBcIicgKyBtb2R1bGVOYW1lICsgJ1wiIGtleSBpcyBhbHJlYWR5IHNldCBpbiB0aGUgY29udGFpbmVyLiBBZGRpbmcgdGhlIG1vZHVsZSB0byB0aGUgY29udGFpbmVyIGZhaWxlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdID0gY2xhbV9tb2R1bGU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbihtb2R1bGVOYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgJ05vdGhpbmcgaXMgc2V0IHVuZGVyIHRoZSBcIicgKyBtb2R1bGVOYW1lICsgJ1wiIGtleSBpbiB0aGUgY29udGFpbmVyLic7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdO1xuICAgIH0sXG5cbiAgICBleHBvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuY29udGFpbmVyID0gdGhpcztcbiAgICAgICAgY29uc29sZS53YXJuKCdUaGUgY2xhbSBjb250YWluZXIgaXMgbm93IGV4cG9zZWQgYXMgXCJjb250YWluZXJcIi4nKTtcbiAgICB9XG59O1xuIiwidmFyIGN1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8vIENvbnN0cnVjdG9yXG4vLyA9PT09PT09PT09PVxuZnVuY3Rpb24gTW9kaWZpZXIoJG9iamVjdCwgbmFtZSwgcHJlZml4KSB7XG4gICAgaWYgKHR5cGVvZiBwcmVmaXggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHByZWZpeCA9ICdiJztcbiAgICB9XG5cbiAgICAvLyBBdHRyaWJ1dGVzXG4gICAgdGhpcy5tb2RpZmllciA9IHtcbiAgICAgICAgJG9iamVjdDogJG9iamVjdCxcbiAgICAgICAgcHJlZml4OiBwcmVmaXgsXG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIHByZWZpeGVkTmFtZTogcHJlZml4ICsgJy0nICsgbmFtZVxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgICBjdXRpbC52YWxpZGF0ZUpRdWVyeU9iamVjdCgkb2JqZWN0LCAxKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoJG9iamVjdCk7XG4gICAgICAgIHRocm93ICdbbW9kaWZpZXI6IFwiJyArIG5hbWUgKyAnXCJdJyArIGU7XG4gICAgfVxufVxuXG4vLyBBUElcbi8vPT09PVxuTW9kaWZpZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLnNldChuYW1lLCB0cnVlKTtcbn07XG5cbk1vZGlmaWVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIGZhbHNlKTtcbn07XG5cbk1vZGlmaWVyLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYgKHRoaXMuZ2V0KG5hbWUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldChuYW1lLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIHRydWUpO1xufTtcblxuLy8gR2V0cyBhIG1vZGlmaWVyIG9uIGEgQkVNIG9iamVjdC5cbk1vZGlmaWVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1vZFByZWZpeCA9IHRoaXMudHlwZUlEO1xuICAgIHZhciBtb2RpZmllckNsYXNzID0gY3V0aWwuZ2V0TW9kaWZpZXJDbGFzcyh0aGlzLm1vZGlmaWVyLnByZWZpeGVkTmFtZSwgbmFtZSk7XG5cbiAgICB2YXIgY2xhc3NlcyA9IGN1dGlsLmdldENsYXNzZXNCeVByZWZpeChtb2RpZmllckNsYXNzLCB0aGlzLm1vZGlmaWVyLiRvYmplY3QpO1xuICAgIC8vIE1vZGlmaWVyIG5vdCBmb3VuZFxuICAgIGlmIChjbGFzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFsdWUgPSBjbGFzc2VzWzBdLnNwbGl0KCdfJyk7XG5cbiAgICAvLyBNb2RpZmllciBmb3VuZCwgYnV0IGRvZXNuJ3QgaGF2ZSBhIHNwZWNpZmljIHZhbHVlXG4gICAgaWYgKHR5cGVvZiB2YWx1ZVsxXSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBNb2RpZmllciBmb3VuZCB3aXRoIGEgdmFsdWVcbiAgICByZXR1cm4gdmFsdWVbMV07XG59O1xuXG4vLyBTZXRzIGEgbW9kaWZpZXIgb24gYSBCRU0gb2JqZWN0LlxuTW9kaWZpZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKFxuICAgICAgICB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlICE9ICdib29sZWFuJ1xuICAgICkge1xuICAgICAgICB0aHJvdyAnQSBCRU0gbW9kaWZpZXIgdmFsdWUgY2FuIG9ubHkgZWl0aGVyIGJlIFwic3RyaW5nXCIsIG9yIFwiYm9vbGVhblwiLiBUaGUgZ2l2ZW4gdmFsdWUgd2FzIG9mIHR5cGUgXCInICsgKHR5cGVvZiB2YWx1ZSkgKyAnXCIuJztcbiAgICB9XG5cbiAgICB2YXIgbW9kaWZpZXJDbGFzcyA9IGN1dGlsLmdldE1vZGlmaWVyQ2xhc3ModGhpcy5tb2RpZmllci5wcmVmaXhlZE5hbWUsIG5hbWUpO1xuICAgIGN1dGlsLnJlbW92ZUNsYXNzZXNCeVByZWZpeChtb2RpZmllckNsYXNzLCB0aGlzLm1vZGlmaWVyLiRvYmplY3QpO1xuICAgIGlmICh2YWx1ZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgbW9kaWZpZXJDbGFzcyA9IGN1dGlsLmdldE1vZGlmaWVyQ2xhc3ModGhpcy5tb2RpZmllci5wcmVmaXhlZE5hbWUsIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgdGhpcy5tb2RpZmllci4kb2JqZWN0LmFkZENsYXNzKG1vZGlmaWVyQ2xhc3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gRXhwb3J0IG1vZHVsZVxuLy89PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBNb2RpZmllcjtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyICQgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy4kIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC4kIDogbnVsbCk7XG5cbi8vIENvbnN0cnVjdG9yXG4vLyA9PT09PT09PT09PVxuZnVuY3Rpb24gTW9kdWxlKCRvYmplY3QsIHNldHRpbmdzLCBjb25mKSB7XG4gICAgdmFyIG1vZHVsZU5hbWUgPSBjdXRpbC5nZXRNb2R1bGVOYW1lKHRoaXMpO1xuICAgIHZhciBjbGFzc05hbWUgPSBjdXRpbC5nZXRNb2R1bGVDbGFzcyhtb2R1bGVOYW1lKTtcblxuICAgIHZhciBkZXB0aCA9IDE7XG4gICAgaWYgKHR5cGVvZiBzZXR0aW5ncy5oYXNHbG9iYWxIb29rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2V0dGluZ3MuaGFzR2xvYmFsSG9va3MgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ29udmVydGluZyBwb3NzaWJsZSB0aHJ1dGh5IHZhbHVlcyB0byB0cnVlXG4gICAgc2V0dGluZ3MuaGFzR2xvYmFsSG9va3MgPSAhIXNldHRpbmdzLmhhc0dsb2JhbEhvb2tzO1xuXG4gICAgaWYgKHNldHRpbmdzLnR5cGUgIT09ICdzaW5nbGV0b24nKSB7XG4gICAgICAgIHNldHRpbmdzLnR5cGUgPSAnYmFzaWMnO1xuXG4gICAgICAgIGRlcHRoID0gJG9iamVjdC5wYXJlbnRzKCcuJyArIGNsYXNzTmFtZSkubGVuZ3RoICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBtb2R1bGUgY2FuIGJlIGEgc2luZ2xldG9uIG9yIG5vdFxuICAgICAgICB2YXIgY2xhc3NFbGVtZW50Q291bnQgPSAkKCcuJyArIGNsYXNzTmFtZSkubGVuZ3RoO1xuICAgICAgICBpZiAoY2xhc3NFbGVtZW50Q291bnQgPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyAnVGhlIG1vZHVsZScgKyAnIFsnICsgbW9kdWxlTmFtZSArICddICcgKyAnY291bGQgbm90IGJlIGluc3RhbnRpYXRlZCBhcyBhIHNpbmdsZXRvbi4gJyArIGNsYXNzRWxlbWVudENvdW50ICsgJyBET00gZWxlbWVudHMgd2VyZSBmb3VuZCB3aXRoIHRoZSBcIicgKyBjbGFzc05hbWUgKyAnXCIgY2xhc3MgaW5zdGVhZCBvZiBqdXN0IG9uZS4nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5tb2R1bGUgPSB7XG4gICAgICAgICRvYmplY3Q6ICRvYmplY3QsXG4gICAgICAgIG5hbWU6IG1vZHVsZU5hbWUsXG4gICAgICAgIGNsYXNzOiBjbGFzc05hbWUsXG4gICAgICAgIGNvbmY6IHt9LFxuICAgICAgICBldmVudHM6IHt9LFxuICAgICAgICBob29rczoge30sXG4gICAgICAgIHR5cGU6IHNldHRpbmdzLnR5cGUsXG4gICAgICAgIGRlcHRoOiBkZXB0aCxcbiAgICAgICAgaGFzR2xvYmFsSG9va3M6IHNldHRpbmdzLmhhc0dsb2JhbEhvb2tzXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAgIGN1dGlsLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRvYmplY3QsIDEpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9XG5cbiAgICAvLyBDaGVja2luZyBpZiB0aGUgalF1ZXJ5IG9iamVjdCBoYXMgdGhlIG5lZWRlZCBqc20gY2xhc3NcbiAgICBpZiAoISRvYmplY3QuaGFzQ2xhc3ModGhpcy5tb2R1bGUuY2xhc3MpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBnaXZlbiBqUXVlcnkgT2JqZWN0IGRvZXMgbm90IGhhdmUgdGhpcyBtb2R1bGVcXCdzIGNsYXNzLicpO1xuICAgIH1cblxuICAgIC8vIFNldHRpbmcgdXAgZGVmYXVsdCBjb25maWd1cmF0aW9uXG4gICAgaWYgKHNldHRpbmdzLmNvbmYgIT09IG51bGwpIHtcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5tb2R1bGUuY29uZiwgc2V0dGluZ3MuY29uZik7XG4gICAgfVxuXG4gICAgLy8gTWVyZ2luZyBpbiBkYXRhLSBjb25maWd1cmF0aW9uXG4gICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5tb2R1bGUuY29uZiwgdGhpcy5nZXREYXRhQ29uZmlndXJhdGlvbigpKTtcblxuICAgIC8vIE1lcmdpbmcgaW4gcGFzc2VkIGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHlwZW9mIGNvbmYgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICQuZXh0ZW5kKHRydWUsIHRoaXMubW9kdWxlLmNvbmYsIGNvbmYpO1xuICAgIH1cbn07XG5cbi8vIEFQSVxuLy89PT09XG5Nb2R1bGUucHJvdG90eXBlLmFkZEhvb2tFdmVudCA9IGZ1bmN0aW9uKGhvb2tOYW1lLCBldmVudFR5cGUsIGFkZFByZVBvc3RFdmVudHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyICRob29rID0gdGhpcy5nZXRIb29rcyhob29rTmFtZSk7XG4gICAgaWYgKCRob29rLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGV2ZW50TmFtZSA9IGhvb2tOYW1lLnNwbGl0KCctJyk7XG4gICAgZXZlbnROYW1lLnB1c2goZXZlbnRUeXBlKTtcbiAgICB2YXIgZXZlbnROYW1lTGVuZ3RoID0gZXZlbnROYW1lLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gZXZlbnROYW1lTGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgZXZlbnROYW1lW2ldID0gY3V0aWwudWNmaXJzdChldmVudE5hbWVbaV0pO1xuICAgIH07XG4gICAgdmFyIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5qb2luKCcnKTtcblxuICAgICRob29rLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICQodGhpcykub24oZXZlbnRUeXBlLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoYWRkUHJlUG9zdEV2ZW50cykge1xuICAgICAgICAgICAgICAgIHNlbGYudHJpZ2dlckV2ZW50KCdwcmUnICsgZXZlbnROYW1lLCBbZSwgJCh0aGlzKV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZlsnb24nICsgZXZlbnROYW1lXS5hcHBseShzZWxmLCBbZSwgJCh0aGlzKV0pO1xuICAgICAgICAgICAgaWYgKGFkZFByZVBvc3RFdmVudHMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnRyaWdnZXJFdmVudCgncG9zdCcgKyBldmVudE5hbWUsIFtlLCAkKHRoaXMpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgIHRoaXMubW9kdWxlLmV2ZW50c1tldmVudE5hbWVdID0gY2FsbGJhY2s7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmdldE1vZHVsZU5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY3V0aWwuZ2V0TW9kdWxlTmFtZSh0aGlzKTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUudHJpZ2dlckV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLm1vZHVsZS5ldmVudHNbZXZlbnROYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5tb2R1bGUuZXZlbnRzW2V2ZW50TmFtZV0uYXBwbHkodGhpcywgYXJncyk7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLnByZXR0aWZ5ID0gZnVuY3Rpb24obWVzc2FnZSwgc3ViamVjdCkge1xuICAgIHJldHVybiAnWycgKyB0aGlzLm1vZHVsZS5uYW1lICsgKHN1YmplY3QgPyAnOiAnICsgc3ViamVjdDogJycpICsgJ10gJyArIG1lc3NhZ2U7XG59O1xuXG4vKipcbiAqIEdldHMgYSBzaW5nbGUgLSBvciBubyAtIGhvb2sgalF1ZXJ5IG9iamVjdCBmcm9tIHRoZSBtb2R1bGUgY29udGV4dC5cbiAqIFRoZSBmb3VuZCBob29rIHdpbGwgYmUgc2F2ZWQsIHVzaW5nIHRoZSBob29rTmFtZSBhcyBhIGtleS4gVGhpcyB3YXksIG9ubHkgb25lXG4gKiBzZWFyY2ggb2NjdXJzIGZvciBhbnkgZ2l2ZW4gaG9va05hbWUgaW4gdGhlIERPTSB0cmVlLiAgXG4gKiBGaW5kaW5nIG1vcmUgdGhhbiBvbmUgaG9vayB3aWxsIHJlc3VsdCBpbiBhbiBleGNlcHRpb24uIChBbiBlbXB0eSByZXN1bHQgaXNcbiAqIGFsbG93ZWQgYnkgZGVmYXVsdC4pXG4gKiBAcGFyYW0gc3RyaW5nIGhvb2tOYW1lIFRoZSBzZWFyY2hlZCBob29rIG5hbWUuXG4gKiBAcGFyYW0gYm9vbGVhbiBlbXB0eVJlc3VsdE5vdEFsbG93ZWQgSWYgc2V0IHRvIHRydWUsIHRoZW4gbm90IGZpbmRpbmcgYSBob29rXG4gKiB3aWxsIGFsc28gdGhyb3cgYW4gZXhjZXB0aW9uLlxuICogQHJldHVybiBqUXVlcnkgT2JqZWN0IChDbGFtIEhvb2spXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZ2V0SG9vayA9IGZ1bmN0aW9uKGhvb2tOYW1lLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRIb29rcyhob29rTmFtZSwgMSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKTtcbn07XG5cbi8qKlxuICogR2V0cyBhbnkgbnVtYmVyIG9mIGpRdWVyeSBvYmplY3QgLSBpbmNsdWRpbmcgbm9uZSAtIGZyb20gdGhlIG1vZHVsZSBjb250ZXh0LlxuICogVGhlIGZvdW5kIGhvb2sgd2lsbCBiZSBzYXZlZCwgdXNpbmcgdGhlIGhvb2tOYW1lIGFzIGEga2V5LiBUaGlzIHdheSwgb25seSBvbmVcbiAqIHNlYXJjaCBvY2N1cnMgZm9yIGFueSBnaXZlbiBob29rTmFtZSBpbiB0aGUgRE9NIHRyZWUuXG4gKiBAcGFyYW0gc3RyaW5nIGhvb2tOYW1lIFRoZSBzZWFyY2hlZCBob29rIG5hbWUuXG4gKiBAcGFyYW0gaW50IGV4cGVjdGVkSG9va051bSAob3B0aW9uYWwpIERlZmluZXMgZXhhY3RseSBob3cgbWFueSBob29rIG9iamVjdHNcbiAqIG11c3QgYmUgcmV0dXJuZWQgaW4gdGhlIGpRdWVyeSBjb2xsZWN0aW9uLiBJZiBnaXZlbiwgYnV0IHRoZSBmb3VuZCBob29rc1xuICogY291bnQgZG9lcyBub3QgZXF1YWwgdGhhdCBudW1iZXIsIHRoZW4gYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLiBcbiAqIEBwYXJhbSBib29sZWFuIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCBJZiBzZXQgdG8gdHJ1ZSwgdGhlbiBub3QgZmluZGluZyBob29rc1xuICogd2lsbCBhbHNvIHRocm93IGFuIGV4Y2VwdGlvbi5cbiAqIEByZXR1cm4galF1ZXJ5IE9iamVjdCAoQ2xhbSBIb29rKVxuICovXG5Nb2R1bGUucHJvdG90eXBlLmdldEhvb2tzID0gZnVuY3Rpb24oaG9va05hbWUsIGV4cGVjdGVkSG9va051bSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLm1vZHVsZS5ob29rc1tob29rTmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMubW9kdWxlLmhvb2tzW2hvb2tOYW1lXSA9IHRoaXMuZmluZEhvb2tzKGhvb2tOYW1lLCBleHBlY3RlZEhvb2tOdW0sIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLmhvb2tzW2hvb2tOYW1lXTtcbn07XG5cbi8qKlxuICogR2V0cyBhIHNpbmdsZSAtIG9yIG5vIC0gaG9vayBqUXVlcnkgb2JqZWN0IGZyb20gdGhlIG1vZHVsZSBjb250ZXh0IHVzaW5nXG4gKiBqUXVlcnkgc2VsZWN0b3JzLiBVc2VmdWwgd2hlbiBob29rcyBjYW4gYmUgYWRkZWQgZGluYW1pY2FsbHkgdG8gdGhlIG1vZHVsZS5cbiAqIEZpbmRpbmcgbW9yZSB0aGFuIG9uZSBob29rIHdpbGwgcmVzdWx0IGluIGFuIGV4Y2VwdGlvbi4gKEFuIGVtcHR5IHJlc3VsdCBpc1xuICogYWxsb3dlZCBieSBkZWZhdWx0LilcbiAqIEBwYXJhbSBzdHJpbmcgaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSBib29sZWFuIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCBJZiBzZXQgdG8gdHJ1ZSwgdGhlbiBub3QgZmluZGluZyBhIGhvb2tcbiAqIHdpbGwgYWxzbyB0aHJvdyBhbiBleGNlcHRpb24uXG4gKiBAcmV0dXJuIGpRdWVyeSBPYmplY3QgKENsYW0gSG9vaylcbiAqL1xuTW9kdWxlLnByb3RvdHlwZS5maW5kSG9vayA9IGZ1bmN0aW9uKGhvb2tOYW1lLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5maW5kSG9va3MoaG9va05hbWUsIDEsIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCk7XG59O1xuXG5cbi8qKlxuICogR2V0cyBhbnkgbnVtYmVyIG9mIGpRdWVyeSBvYmplY3QgLSBpbmNsdWRpbmcgbm9uZSAtIGZyb20gdGhlIG1vZHVsZSBjb250ZXh0XG4gKiB1c2luZyBqUXVlcnkgc2VsZWN0b3JzLiBVc2VmdWwgd2hlbiBob29rcyBjYW4gYmUgYWRkZWQgZGluYW1pY2FsbHkgdG8gdGhlXG4gKiBtb2R1bGUuXG4gKiBAcGFyYW0gc3RyaW5nIGhvb2tOYW1lIFRoZSBzZWFyY2hlZCBob29rIG5hbWUuXG4gKiBAcGFyYW0gaW50IGV4cGVjdGVkSG9va051bSAob3B0aW9uYWwpIERlZmluZXMgZXhhY3RseSBob3cgbWFueSBob29rIG9iamVjdHNcbiAqIG11c3QgYmUgcmV0dXJuZWQgaW4gdGhlIGpRdWVyeSBjb2xsZWN0aW9uLiBJZiBnaXZlbiwgYnV0IHRoZSBmb3VuZCBob29rc1xuICogY291bnQgZG9lcyBub3QgZXF1YWwgdGhhdCBudW1iZXIsIHRoZW4gYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLiBcbiAqIEByZXR1cm4galF1ZXJ5IE9iamVjdCAoQ2xhbSBIb29rKVxuICovXG5Nb2R1bGUucHJvdG90eXBlLmZpbmRIb29rcyA9IGZ1bmN0aW9uKGhvb2tOYW1lLCBleHBlY3RlZEhvb2tOdW0sIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgaG9va0NsYXNzTmFtZSA9IHRoaXMuZ2V0SG9va0NsYXNzTmFtZShob29rTmFtZSk7XG4gICAgdmFyICRob29rcztcbiAgICB2YXIgJGluQ29udGV4dEhvb2tzO1xuXG4gICAgaWYgKHRoaXMubW9kdWxlLnR5cGUgPT0gJ3NpbmdsZXRvbicpIHtcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlLmhhc0dsb2JhbEhvb2tzKSB7XG4gICAgICAgICAgICAkaG9va3MgPSAkKCcuJyArIGhvb2tDbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJGhvb2tzID0gdGhpcy5tb2R1bGUuJG9iamVjdC5maW5kKCcuJyArIGhvb2tDbGFzc05hbWUpO1xuXG4gICAgICAgICAgICAvLyBBZGRpbmcgdGhlIG1haW4gbW9kdWxlIGVsZW1lbnQgaWYgaXQgaGFzIHRoZSBob29rIGNsYXNzXG4gICAgICAgICAgICBpZiAodGhpcy5tb2R1bGUuJG9iamVjdC5oYXNDbGFzcyhob29rQ2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgICAgICRob29rcyA9ICRob29rcy5hZGQodGhpcy5tb2R1bGUuJG9iamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBHZXR0aW5nIGFsbCBob29rcyBpbiB0aGUgbW9kdWxlLCBleGNsdWRpbmcgb3RoZXIgaW5zdGFuY2VzIG9mIHRoZVxuICAgICAgICAvLyBzYW1lIG1vZHVsZSBpbnNpZGUgdGhlIGN1cnJlbnQgb25lLlxuXG4gICAgICAgIC8vIENyZWF0aW5nIGEgXCJkZXB0aENsYXNzXCIgdG8gZXhjbHVkZSB0aGUgc2FtZSB0eXBlcyBvZiBtb2R1bGVzIGluc2lkZVxuICAgICAgICAvLyB0aGUgYWN0dWFsIG9uZSB3aGVuIHNlYXJjaGluZyBmb3IgYSBob29rLlxuICAgICAgICB2YXIgZGVwdGhDbGFzcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5tb2R1bGUuZGVwdGg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBkZXB0aENsYXNzLnB1c2goJy4nICsgdGhpcy5tb2R1bGUuY2xhc3MpO1xuICAgICAgICB9XG4gICAgICAgIGRlcHRoQ2xhc3MgPSBkZXB0aENsYXNzLmpvaW4oJyAnKTtcblxuICAgICAgICAkaG9va3MgPVxuICAgICAgICAgICAgdGhpcy5tb2R1bGUuJG9iamVjdFxuICAgICAgICAgICAgLmZpbmQoJy4nICsgaG9va0NsYXNzTmFtZSlcbiAgICAgICAgICAgIC8vIEV4Y2x1ZGluZyBhbGwgaG9va3MgaW5zaWRlIG90aGVyIG1vZHVsZSBpbnN0YW5jZXNcbiAgICAgICAgICAgIC5ub3QoZGVwdGhDbGFzcyArICcgLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgLy8gRXhjbHVkaW5nIGFsbCBvdGhlciBtb2R1bGVzIHRoYXQgaGFzIHRoZSBob29rIGNsYXNzXG4gICAgICAgICAgICAubm90KGRlcHRoQ2xhc3MgKyAnLicgKyBob29rQ2xhc3NOYW1lKTtcblxuICAgICAgICAvLyBBZGRpbmcgZXZlcnkgaG9vayBvdXRzaWRlIG9mIHRoZSBtb2R1bGUgaW5zdGFuY2VzLlxuICAgICAgICBpZiAodGhpcy5tb2R1bGUuaGFzR2xvYmFsSG9va3MpIHtcbiAgICAgICAgICAgIHZhciAkZ2xvYmFsSG9va3MgPVxuICAgICAgICAgICAgICAgICQoJy4nICsgaG9va0NsYXNzTmFtZSlcbiAgICAgICAgICAgICAgICAvLyBFeGNsdWRpbmcgaG9va3MgZnJvbSB3aXRoaW4gbW9kdWxlc1xuICAgICAgICAgICAgICAgIC5ub3QoJy4nICsgdGhpcy5tb2R1bGUuY2xhc3MgKyAnIC4nICsgaG9va0NsYXNzTmFtZSlcbiAgICAgICAgICAgICAgICAubm90KCcuJyArIHRoaXMubW9kdWxlLmNsYXNzICsgJy4nICsgaG9va0NsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCRnbG9iYWxIb29rcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkaG9va3MgPSAkaG9va3MuYWRkKCRnbG9iYWxIb29rcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGRpbmcgdGhlIG1haW4gbW9kdWxlIGVsZW1lbnQgaWYgaXQgaGFzIHRoZSBob29rIGNsYXNzXG4gICAgICAgIGlmICh0aGlzLm1vZHVsZS4kb2JqZWN0Lmhhc0NsYXNzKGhvb2tDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAkaG9va3MgPSAkaG9va3MuYWRkKHRoaXMubW9kdWxlLiRvYmplY3QpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgICB0eXBlb2YgZXhwZWN0ZWRIb29rTnVtID09PSAnbnVtYmVyJyAmJlxuICAgICAgICBleHBlY3RlZEhvb2tOdW0gIT0gJGhvb2tzLmxlbmd0aFxuICAgICkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAkaG9va3MubGVuZ3RoICE9PSAwIHx8XG4gICAgICAgICAgICBlbXB0eVJlc3VsdE5vdEFsbG93ZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCRob29rcyk7XG4gICAgICAgICAgICB0aHJvdyAnQW4gaW5jb3JyZWN0IG51bWJlciBvZiBob29rcyB3ZXJlIGZvdW5kLiBFeHBlY3RlZDogJyArIGV4cGVjdGVkSG9va051bSArICcuIEZvdW5kOiAnICsgJGhvb2tzLmxlbmd0aCArICcuIEhvb2sgbmFtZTogXCInICsgaG9va0NsYXNzTmFtZSArICdcIic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gJGhvb2tzO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rQ2xhc3NOYW1lID0gZnVuY3Rpb24oaG9va05hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUuY2xhc3MgKyAnX18nICsgaG9va05hbWU7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmdldERhdGFDb25maWd1cmF0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGFDb25mID0gdGhpcy5tb2R1bGUuJG9iamVjdC5kYXRhKGN1dGlsLmdldE1vZHVsZUNsYXNzKHRoaXMubW9kdWxlLm5hbWUpKTtcbiAgICBpZiAodHlwZW9mIGRhdGFDb25mID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBkYXRhQ29uZiA9IHt9O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZGF0YUNvbmYgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBkYXRhLSogYXR0cmlidXRlXFwncyBjb250ZW50IHdhcyBub3QgYSB2YWxpZCBKU09OLiBGZXRjaGVkIHZhbHVlOiAnICsgZGF0YUNvbmYpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhQ29uZjtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuZ2V0SG9va0NvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbigkaG9vaykge1xuICAgIHJldHVybiAkaG9vay5kYXRhKHRoaXMubW9kdWxlLmNsYXNzKTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuZXhwb3NlID0gZnVuY3Rpb24oY29udGFpbmVyTmFtZSkge1xuICAgIGlmICh0eXBlb2YgY29udGFpbmVyTmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgY29udGFpbmVyTmFtZSA9ICdleHBvc2VkX21vZHVsZXMnO1xuICAgIH1cbiAgICBcbiAgICBpZiAodHlwZW9mIHdpbmRvd1tjb250YWluZXJOYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgd2luZG93W2NvbnRhaW5lck5hbWVdID0ge307XG4gICAgfVxuXG4gICAgdmFyIG1vZHVsZU5hbWUgPSB0aGlzLm1vZHVsZS5uYW1lLnJlcGxhY2UoL1xcLS9nLCAnXycpO1xuXG4gICAgaWYgKHRoaXMubW9kdWxlLnR5cGUgPT0gJ3NpbmdsZXRvbicpIHtcbiAgICAgICAgd2luZG93W2NvbnRhaW5lck5hbWVdW21vZHVsZU5hbWVdID0gdGhpcztcblxuICAgICAgICBjb25zb2xlLndhcm4oJ0V4cG9zZWQgYXM6IFwiJyArIGNvbnRhaW5lck5hbWUgKyAnLicgKyBtb2R1bGVOYW1lICsgJ1wiLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93W2NvbnRhaW5lck5hbWVdW21vZHVsZU5hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgd2luZG93W2NvbnRhaW5lck5hbWVdW21vZHVsZU5hbWVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbW9kdWxlQ291bnQgPSB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0ubGVuZ3RoO1xuXG4gICAgICAgIHdpbmRvd1tjb250YWluZXJOYW1lXVttb2R1bGVOYW1lXS5wdXNoKHRoaXMpO1xuXG4gICAgICAgIGNvbnNvbGUud2FybignRXhwb3NlZCBhczogXCInICsgY29udGFpbmVyTmFtZSArICcuJyArIG1vZHVsZU5hbWUgKyAnWycgKyBtb2R1bGVDb3VudCArICddXCIuJyk7XG4gICAgfVxufTtcblxuLy8gRXhwb3J0IG1vZHVsZVxuLy89PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcbnZhciBjb250YWluZXIgPSByZXF1aXJlKCcuL2NvbnRhaW5lcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtb2R1bGVDb25mOiB7XG4gICAgICAgIHByZWZpeDogJ2pzbSdcbiAgICB9LFxuXG4gICAgbW9kaWZpZXJDb25mOiB7XG4gICAgICAgIHByZWZpeDoge1xuICAgICAgICAgICAgbmFtZTogJy0tJyxcbiAgICAgICAgICAgIHZhbHVlOiAnXydcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBDcmVhdGVzIG1vZHVsZSBpbnN0YW5jZXMgZm9yIGV2ZXJ5IERPTSBlbGVtZW50IHRoYXQgaGFzIHRoZSBhcHByb3ByaWF0ZVxuICAgIC8vIG1vZHVsZSBjbGFzcy4gSWYgdGhlICRjb250YWluZXJPYmogalF1ZXJ5IG9iamVjdCBpcyBnaXZlbiAtIGNvbnRhaW5pbmdcbiAgICAvLyBvbmUgZWxlbWVudCAtLCB0aGVuIHRoZSBmdW5jdGlvbiB3aWxsIGxvb2sgZm9yIHRoZSBtb2R1bGUgY2xhc3NlcyBpbiB0aGF0XG4gICAgLy8gY29udGFpbmVyLlxuICAgIGNyZWF0ZVByb3RvdHlwZXM6IGZ1bmN0aW9uKG1vZHVsZSwgY29uZmlnLCAkY29udGFpbmVyT2JqKSB7XG4gICAgICAgIC8vIEdldHRpbmcgdGhlIG1vZHVsZSBuYW1lLCB0byBzZWxlY3QgdGhlIERPTSBlbGVtZW50cy5cbiAgICAgICAgdmFyIG1vZHVsZU5hbWUgPSB0aGlzLmdldE1vZHVsZU5hbWUobW9kdWxlKTtcbiAgICAgICAgdmFyIG1vZHVsZUNsYXNzID0gdGhpcy5nZXRNb2R1bGVDbGFzcyhtb2R1bGVOYW1lKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgY29uZmlnID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICAgICAgIWNvbmZpZyAvLyBmYWxzeSB2YWx1ZXNcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25maWcgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBhcHByb3ByaWF0ZSBtb2R1bGUgRE9NIG9iamVjdHNcbiAgICAgICAgdmFyICRtb2R1bGVzID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiAkY29udGFpbmVyT2JqICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZUpRdWVyeU9iamVjdCgkY29udGFpbmVyT2JqKTtcbiAgICAgICAgICAgICRtb2R1bGVzID0gJGNvbnRhaW5lck9iai5maW5kKCcuJyArIG1vZHVsZUNsYXNzKTtcbiAgICAgICAgICAgIGlmICgkY29udGFpbmVyT2JqLmhhc0NsYXNzKG1vZHVsZUNsYXNzKSkge1xuICAgICAgICAgICAgICAgICRtb2R1bGVzID0gJG1vZHVsZXMuYWRkKCRjb250YWluZXJPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJG1vZHVsZXMgPSAkKCcuJyArIG1vZHVsZUNsYXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBtb2R1bGUgaW5zdGFuY2VzXG4gICAgICAgIHZhciBpbnN0YW5jZXMgPSBbXTtcbiAgICAgICAgaWYgKCRtb2R1bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICRtb2R1bGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzLnB1c2gobmV3IG1vZHVsZSgkKHRoaXMpLCBjb25maWcpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA9PSAxICYmIGluc3RhbmNlc1swXS5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlcyA9IGluc3RhbmNlc1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29udGFpbmVyLmFkZChpbnN0YW5jZXMpO1xuXG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8vIEdldCdzIGEgbW9kdWwncyBuYW1lIGZyb20gaXQncyBkZWZpbml0aW9uLCBvciBmcm9tIGEgcHJvdG90eXBlXG4gICAgZ2V0TW9kdWxlTmFtZTogZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgICAgIHZhciBmdW5jRGVmID0gdHlwZW9mIG1vZHVsZSA9PT0gJ2Z1bmN0aW9uJyA/IFN0cmluZyhtb2R1bGUpIDogU3RyaW5nKG1vZHVsZS5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIHZhciBmdW5jTmFtZSA9IGZ1bmNEZWYuc3Vic3RyKCdmdW5jdGlvbiAnLmxlbmd0aCk7XG4gICAgICAgIGZ1bmNOYW1lID0gZnVuY05hbWUuc3Vic3RyKDAsIGZ1bmNOYW1lLmluZGV4T2YoJygnKSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmNOYW1lLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBjb2xsZWN0aW9uIGlzIGEgdmFsaWQgalF1ZXJ5IG9iamVjdCBvciBub3QuXG4gICAgLy8gSWYgdGhlIGNvbGxlY3Rpb25TaXplIChpbnRlZ2VyKSBwYXJhbWV0ZXIgaXMgc3BlY2lmaWVkLCB0aGVuIHRoZVxuICAgIC8vIGNvbGxlY3Rpb24ncyBzaXplIHdpbGwgYmUgdmFsaWRhdGVkIGFjY29yZGluZ2x5LlxuICAgIHZhbGlkYXRlSlF1ZXJ5T2JqZWN0OiBmdW5jdGlvbigkY29sbGVjdGlvbiwgY29sbGVjdGlvblNpemUpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIGNvbGxlY3Rpb25TaXplICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbGxlY3Rpb25TaXplICE9PSAnbnVtYmVyJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93ICdUaGUgZ2l2ZW4gXCJjb2xsZWN0aW9uU2l6ZVwiIHBhcmFtZXRlciBmb3IgdGhlIGpRdWVyeSBjb2xsZWN0aW9uIHZhbGlkYXRpb24gd2FzIG5vdCBhIG51bWJlci4gUGFzc2VkIHZhbHVlOiAnICsgY29sbGVjdGlvblNpemUgKyAnLCB0eXBlOiAnICsgKHR5cGVvZiBjb2xsZWN0aW9uU2l6ZSkgKyAnLic7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICgkY29sbGVjdGlvbiBpbnN0YW5jZW9mIGpRdWVyeSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRocm93ICdUaGlzIGlzIG5vdCBhIGpRdWVyeSBPYmplY3QuIFBhc3NlZCB0eXBlOiAnICsgKHR5cGVvZiAkY29sbGVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgY29sbGVjdGlvblNpemUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAkY29sbGVjdGlvbi5sZW5ndGggIT0gY29sbGVjdGlvblNpemVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyAnVGhlIGdpdmVuIGpRdWVyeSBjb2xsZWN0aW9uIGNvbnRhaW5zIGFuIHVuZXhwZWN0ZWQgbnVtYmVyIG9mIGVsZW1lbnRzLiBFeHBlY3RlZDogJyArIGNvbGxlY3Rpb25TaXplICsgJywgZ2l2ZW46ICcgKyAkY29sbGVjdGlvbi5sZW5ndGggKyAnLic7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdWNmaXJzdDogZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc3Vic3RyKDEpO1xuICAgIH0sXG5cbiAgICBnZXRNb2R1bGVDbGFzczogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVDb25mLnByZWZpeCArICctJyArIG5hbWU7XG4gICAgfSxcblxuICAgIGdldE1vZGlmaWVyQ2xhc3M6IGZ1bmN0aW9uKGJhc2VOYW1lLCBtb2RpZmllck5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLm1vZGlmaWVyQ29uZi5wcmVmaXgudmFsdWUgKyB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBiYXNlTmFtZSArIHRoaXMubW9kaWZpZXJDb25mLnByZWZpeC5uYW1lICsgbW9kaWZpZXJOYW1lICsgdmFsdWU7XG4gICAgfSxcblxuICAgIGdldENsYXNzZXNCeVByZWZpeDogZnVuY3Rpb24ocHJlZml4LCAkalFPYmopIHtcbiAgICAgICAgdmFyIGNsYXNzZXMgPSAkalFPYmouYXR0cignY2xhc3MnKTtcbiAgICAgICAgaWYgKCFjbGFzc2VzKSB7IC8vIGlmIFwiZmFsc3lcIiwgZm9yIGV4OiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlcy5zcGxpdCgnICcpO1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IG5ldyBSZWdFeHAoJ14oJyArIHByZWZpeCArICcpKC4qKScpLmV4ZWMoY2xhc3Nlc1tpXSk7XG4gICAgICAgICAgICBpZiAobWF0Y2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaFswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICB9LFxuXG4gICAgcmVtb3ZlQ2xhc3Nlc0J5UHJlZml4OiBmdW5jdGlvbihwcmVmaXgsICRqUU9iaikge1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IHRoaXMuZ2V0Q2xhc3Nlc0J5UHJlZml4KHByZWZpeCwgJGpRT2JqKTtcbiAgICAgICAgbWF0Y2hlcyA9IG1hdGNoZXMuam9pbignICcpO1xuICAgICAgICAkalFPYmoucmVtb3ZlQ2xhc3MobWF0Y2hlcyk7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcclxudmFyIGN1dGlsID0gcmVxdWlyZSgnY2xhbS9jb3JlL3V0aWwnKTtcclxudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xyXG52YXIgbW9kaWZpZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kaWZpZXInKTtcclxudmFyIGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzO1xyXG52YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xyXG52YXIgZHluYW1pY19jb25maWcgPSByZXF1aXJlKCcuLi9jb25mL2R5bmFtaWNfY29uZmlnJyk7XHJcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xyXG5cclxudmFyIHNldHRpbmdzID0ge1xyXG4gICAgY29uZjoge1xyXG4gICAgICAgIHByb3RvdHlwZUhUTUw6ICc8ZGl2IGNsYXNzPVwianNtLWR5bmFtaWMgYi1keW5hbWljXCI+IDxhIGhyZWY9XCJqYXZhc2NyaXB0OiB2b2lkKDApXCIgY2xhc3M9XCJqc20tZHluYW1pY19fYWRkLWVtYmVkZGVkLWJ0blwiPk5ldyBlbWJlZGRlZDwvYT4gfCA8YSBocmVmPVwiamF2YXNjcmlwdDogdm9pZCgwKVwiIGNsYXNzPVwianNtLWR5bmFtaWNfX2FkZC1zaWJsaW5nLWJ0blwiPk5ldyBzaWJsaW5nPC9hPiB8IDxhIGhyZWY9XCJqYXZhc2NyaXB0OiB2b2lkKDApXCIgY2xhc3M9XCJqc20tZHluYW1pY19fdG9nZ2xlLWhpZ2hsaWdodFwiPkhpZ2hsaWdodDwvYT4gPGRpdiBjbGFzcz1cImItZHluYW1pY19fYWRkaXRpb25hbC1tb2R1bGVzIGpzbS1keW5hbWljX19hZGRpdGlvbmFsLW1vZHVsZXNcIj48L2Rpdj4gPC9kaXY+JyxcclxuICAgICAgICBhbGxvd0FkZFNpYmxpbmc6IHRydWUsXHJcbiAgICAgICAgYWxsb3dBZGRFbWJlZGRlZDogdHJ1ZVxyXG4gICAgfVxyXG4gICAgLy8gaGFzR2xvYmFsSG9va3M6IHRydWVcclxufTtcclxuXHJcbmZ1bmN0aW9uIER5bmFtaWMoJGpRT2JqLCBjb25mKSB7XHJcbiAgICAvL3ZhciBzZWxmID0gdGhpcztcclxuICAgIGNsYW1fbW9kdWxlLmFwcGx5KHRoaXMsIFskalFPYmosIHNldHRpbmdzLCBjb25mXSk7XHJcbiAgICB0aGlzLmV4cG9zZSgpO1xyXG5cclxuICAgIHRoaXMubW9kdWxlTW9kaWZpZXIgPSBuZXcgbW9kaWZpZXIodGhpcy5tb2R1bGUuJG9iamVjdCwgdGhpcy5tb2R1bGUubmFtZSk7XHJcblxyXG4gICAgaWYgKHRoaXMubW9kdWxlLmNvbmYuYWxsb3dBZGRFbWJlZGRlZCkge1xyXG4gICAgICAgIHRoaXMuZ2V0SG9vaygnYWRkLWVtYmVkZGVkLWJ0bicpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5hZGRFbWJlZGRlZCwgdGhpcykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmdldEhvb2soJ2FkZC1lbWJlZGRlZC1idG4nKS5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5tb2R1bGUuY29uZi5hbGxvd0FkZFNpYmxpbmcpIHtcclxuICAgICAgICB0aGlzLmdldEhvb2soJ2FkZC1zaWJsaW5nLWJ0bicpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5hZGRTaWJsaW5nLCB0aGlzKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZ2V0SG9vaygnYWRkLXNpYmxpbmctYnRuJykucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuZ2V0SG9vaygndG9nZ2xlLWhpZ2hsaWdodCcpLm9uKCdjbGljaycsICQucHJveHkodGhpcy50b2dnbGVIaWdobGlnaHQsIHRoaXMpKTtcclxufVxyXG5cclxuaW5oZXJpdHMoRHluYW1pYywgY2xhbV9tb2R1bGUpO1xyXG5cclxuRHluYW1pYy5wcm90b3R5cGUuYWRkRW1iZWRkZWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuYWRkQWRkaXRpb25hbE1vZHVsZSgpO1xyXG59O1xyXG5cclxuRHluYW1pYy5wcm90b3R5cGUuYWRkU2libGluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5hZGRBZGRpdGlvbmFsTW9kdWxlKHRydWUpO1xyXG59O1xyXG5cclxuRHluYW1pYy5wcm90b3R5cGUudG9nZ2xlSGlnaGxpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLm1vZHVsZU1vZGlmaWVyLnRvZ2dsZSgnaGlnaGxpZ2h0Jyk7XHJcbn07XHJcblxyXG5EeW5hbWljLnByb3RvdHlwZS5hZGRBZGRpdGlvbmFsTW9kdWxlID0gZnVuY3Rpb24oYXNTaWJsaW5nKSB7XHJcbiAgICB2YXIgJGVtYmVkZGVkTW9kdWwgPSAkKCQucGFyc2VIVE1MKHRoaXMubW9kdWxlLmNvbmYucHJvdG90eXBlSFRNTCkpO1xyXG4gICAgaWYgKGFzU2libGluZykge1xyXG4gICAgICAgIHRoaXMubW9kdWxlLiRvYmplY3QuYWZ0ZXIoJGVtYmVkZGVkTW9kdWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmdldEhvb2soJ2FkZGl0aW9uYWwtbW9kdWxlcycpLmFwcGVuZCgkZW1iZWRkZWRNb2R1bCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGN1dGlsLmNyZWF0ZVByb3RvdHlwZXMoRHluYW1pYywgZHluYW1pY19jb25maWcsICRlbWJlZGRlZE1vZHVsKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRHluYW1pYztcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG52YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xyXG52YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XHJcbnZhciBtb2RpZmllciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2RpZmllcicpO1xyXG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XHJcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xyXG5cclxudmFyIHNldHRpbmdzID0ge1xyXG4gICAgY29uZjoge1xyXG4gICAgICAgIGhpZ2hsaWdodFR5cGU6IHRydWVcclxuICAgIH0sXHJcbiAgICBoYXNHbG9iYWxIb29rczogdHJ1ZVxyXG59O1xyXG5cclxudmFyIGdsb2JhbENvdW50ID0gMDtcclxuXHJcbmZ1bmN0aW9uIEhpZ2hsaWdodGVyKCRqUU9iaiwgY29uZikge1xyXG4gICAgLy92YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBjbGFtX21vZHVsZS5hcHBseSh0aGlzLCBbJGpRT2JqLCBzZXR0aW5ncywgY29uZl0pO1xyXG4gICAgdGhpcy5leHBvc2UoKTtcclxuXHJcbiAgICB0aGlzLmxvY2FsQ291bnQgPSAwO1xyXG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuZ2V0SG9vaygnaGlnaGxpZ2h0Jykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLnRvZ2dsZUhpZ2hsaWdodCwgdGhpcykpO1xyXG5cclxuICAgIHRoaXMuaGlnaGxpZ2h0TW9kID0gbmV3IG1vZGlmaWVyKFxyXG4gICAgICAgIHRoaXMuZ2V0SG9vaygnaGlnaGxpZ2h0JyksXHJcbiAgICAgICAgdGhpcy5tb2R1bGUubmFtZVxyXG4gICAgKTtcclxufVxyXG5cclxuaW5oZXJpdHMoSGlnaGxpZ2h0ZXIsIGNsYW1fbW9kdWxlKTtcclxuXHJcbkhpZ2hsaWdodGVyLnByb3RvdHlwZS50b2dnbGVIaWdobGlnaHQgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgIGlmICghdGhpcy5hY3RpdmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5nZXRIb29rKCdnbG9iYWwtY291bnRlcicpLnRleHQoKytnbG9iYWxDb3VudCk7XHJcbiAgICB0aGlzLmdldEhvb2soJ2xvY2FsLWNvdW50ZXInKS50ZXh0KCsrdGhpcy5sb2NhbENvdW50KTtcclxuXHJcbiAgICBpZiAodGhpcy5oaWdobGlnaHRNb2QuZ2V0KCdoaWdobGlnaHQnKSkge1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0TW9kLm9mZignaGlnaGxpZ2h0Jyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0TW9kLnNldCgnaGlnaGxpZ2h0JywgdGhpcy5tb2R1bGUuY29uZi5oaWdobGlnaHRUeXBlKTtcclxuICAgIH1cclxufTtcclxuXHJcbkhpZ2hsaWdodGVyLnByb3RvdHlwZS5pbmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmhpZ2hsaWdodE1vZC5zZXQoJ2luYWN0aXZlJywgdHJ1ZSk7XHJcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG59O1xyXG5cclxuSGlnaGxpZ2h0ZXIucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmhpZ2hsaWdodE1vZC5zZXQoJ2luYWN0aXZlJywgZmFsc2UpO1xyXG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG52YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xyXG52YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XHJcbnZhciBjbGFtX2NvbnRhaW5lciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9jb250YWluZXInKTtcclxudmFyIGhpZ2hsaWdodGVyID0gcmVxdWlyZSgnLi9oaWdobGlnaHRlcicpO1xyXG4vL3ZhciBtb2RpZmllciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2RpZmllcicpO1xyXG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XHJcblxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICB0eXBlOiAnc2luZ2xldG9uJyxcclxuICAgIC8vIGhhc0dsb2JhbEhvb2tzOiB0cnVlLFxyXG4gICAgY29uZjoge31cclxufTtcclxuXHJcbmZ1bmN0aW9uIEhpZ2hsaWdodGVyQWN0aXZhdG9yKCRqUU9iaiwgY29uZikge1xyXG4gICAgLy92YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBjbGFtX21vZHVsZS5hcHBseSh0aGlzLCBbJGpRT2JqLCBzZXR0aW5ncywgY29uZl0pO1xyXG4gICAgdGhpcy5leHBvc2UoKTtcclxuICAgIC8vIHRocm93IHRoaXMucHJldHRpZnkoJ2Vycm9yJyk7XHJcbiAgICBcclxuICAgIHRoaXMuYWxsQWN0aXZhdGVkID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5nZXRIb29rKCdhY3RpdmF0ZS1idG4nKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuYWN0aXZhdGUsIHRoaXMpKTtcclxufVxyXG5cclxuaW5oZXJpdHMoSGlnaGxpZ2h0ZXJBY3RpdmF0b3IsIGNsYW1fbW9kdWxlKTtcclxuXHJcbkhpZ2hsaWdodGVyQWN0aXZhdG9yLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHRoaXMuYWxsQWN0aXZhdGVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5hbGxBY3RpdmF0ZWQgPSB0cnVlO1xyXG5cclxuICAgIGNsYW1fY29udGFpbmVyLmdldCgnbWVzc2FnZScpLm1lc3NhZ2UoJ1N1Y2Nlc3NmdWwgbW9kdWwgYWN0aXZhdGlvbiEnKTtcclxuXHJcbiAgICB0aGlzLmdldEhvb2soJ2FjdGl2YXRlLWJ0bicpLmZhZGVPdXQoJzMwMCcpO1xyXG5cclxuICAgIHZhciBwcm90b3R5cGVzID0gY3V0aWwuY3JlYXRlUHJvdG90eXBlcyhoaWdobGlnaHRlciwge30sICQoJyNoaWdobGlnaHRlci0yJykpO1xyXG4gICAgJC5lYWNoKHByb3RvdHlwZXMsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuYWN0aXZhdGUoKTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlckFjdGl2YXRvcjtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG52YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XHJcbi8vdmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xyXG4vL3ZhciBjbGFtX2NvbnRhaW5lciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9jb250YWluZXInKTtcclxudmFyIG1vZGlmaWVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZGlmaWVyJyk7XHJcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0cztcclxuXHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIHR5cGU6ICdzaW5nbGV0b24nLFxyXG4gICAgaGFzR2xvYmFsSG9va3M6IHRydWUsXHJcbiAgICBjb25mOiB7XHJcbiAgICAgICAgZmFkZU91dFRpbWU6IDUwMFxyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gTWVzc2FnZSgkalFPYmosIGNvbmYpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIGNsYW1fbW9kdWxlLmFwcGx5KHRoaXMsIFskalFPYmosIHNldHRpbmdzLCBjb25mXSk7XHJcbiAgICB0aGlzLmV4cG9zZSgpO1xyXG4gICAgLy8gdGhyb3cgdGhpcy5wcmV0dGlmeSgnZXJyb3InKTtcclxuICAgIC8vIGNsYW1fY29udGFpbmVyLmdldCgnY2xhbS1tb2R1bGUnKTtcclxuXHJcbiAgICB0aGlzLm1lc3NhZ2VNb2QgPSBuZXcgbW9kaWZpZXIoXHJcbiAgICAgICAgdGhpcy5tb2R1bGUuJG9iamVjdCxcclxuICAgICAgICB0aGlzLm1vZHVsZS5uYW1lXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuaXNPcGVuID0gISF0aGlzLm1lc3NhZ2VNb2QuZ2V0KCd0eXBlJyk7XHJcbiAgICBcclxuICAgIHRoaXMuZ2V0SG9va3MoJ3Rlc3QtYnRuJykuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICQodGhpcykub24oJ2NsaWNrJywgJC5wcm94eShzZWxmLnRlc3RDbGljaywgc2VsZiwgJCh0aGlzKSkpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuZ2V0SG9va3MoJ2Nsb3NlLWJ0bicpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5jbG9zZSwgdGhpcykpO1xyXG59XHJcblxyXG5pbmhlcml0cyhNZXNzYWdlLCBjbGFtX21vZHVsZSk7XHJcblxyXG5NZXNzYWdlLnByb3RvdHlwZS5tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSwgdHlwZSkge1xyXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHR5cGUgPSAnc3VjY2Vzcyc7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5tZXNzYWdlTW9kLnNldCgndHlwZScsIHR5cGUpO1xyXG4gICAgdGhpcy5nZXRIb29rKCdtZXNzYWdlJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgdGhpcy5tb2R1bGUuJG9iamVjdC5mYWRlSW4oMzAwKTtcclxuICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XHJcbiAgICB9XHJcbn07XHJcblxyXG5NZXNzYWdlLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHR5cGUpIHtcclxuICAgIHRoaXMubW9kdWxlLiRvYmplY3QuZmFkZU91dCgzMDApO1xyXG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcclxufTtcclxuXHJcbk1lc3NhZ2UucHJvdG90eXBlLnRlc3RDbGljayA9IGZ1bmN0aW9uKCRob29rKSB7XHJcbiAgICB2YXIgY29uZiA9IHRoaXMuZ2V0SG9va0NvbmZpZ3VyYXRpb24oJGhvb2spO1xyXG4gICAgdGhpcy5tZXNzYWdlKGNvbmYubWVzc2FnZSwgY29uZi50eXBlKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZTtcclxuIiwiLy8gQ29uZmlndXJhdGlvbiBmb3IgdGhlIGR5bmFtaWMuanMgbW9kdWxlLiBTaW5jZSBzb21lIHByb3RvdHlwZXMgYXJlXHJcbi8vIGluc3RhbnRpYXRlZCBpbiB0aGUgYXBwLmpzIGFuZCBhbHNvIGluIHRoZSBtb2R1bGUgaXRzZWxmIGxhdGVyIG9uLFxyXG4vLyBJIHNhdmVkIHRoZSBjb25maWd1cmF0aW9uLCBzbyB0aGF0IEkgZG9uJ3QgaGF2ZSB0byB1cGRhdGUgaXQgYXQgdHdvXHJcbi8vIGRpZmZlcmVudCBpZiBjaGFuZ2VzIHdlcmUgbmVlZGVkLlxyXG4vLyBUbyBleHBlcmltZW50LCBqdXN0IGNoYW5nZSBvbmUgb2YgdGhlIHZhbHVlcyBmcm9tIHRydWUgdG8gZmFsc2UuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYWxsb3dBZGRTaWJsaW5nOiB0cnVlLFxyXG4gICAgYWxsb3dBZGRFbWJlZGRlZDogdHJ1ZVxyXG59O1xyXG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhbk11dGF0aW9uT2JzZXJ2ZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIHZhciBxdWV1ZSA9IFtdO1xuXG4gICAgaWYgKGNhbk11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgICAgdmFyIGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBxdWV1ZUxpc3QgPSBxdWV1ZS5zbGljZSgpO1xuICAgICAgICAgICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHF1ZXVlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShoaWRkZW5EaXYsIHsgYXR0cmlidXRlczogdHJ1ZSB9KTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaGlkZGVuRGl2LnNldEF0dHJpYnV0ZSgneWVzJywgJ25vJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIl19
