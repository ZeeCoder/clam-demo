(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var cutil = require('clam/core/util');
var clam_container = require('clam/core/container');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var highlighter = require('./clam_module/highlighter');
var dynamic = require('./clam_module/dynamic');
var message = require('./clam_module/message');
var highlighter_activator = require('./clam_module/highlighter_activator');

clam_container.expose();

cutil.createPrototypes(message, {fadeOutTime: 300});
cutil.createPrototypes(highlighter, {}, $('#highlighter-1'));
cutil.createPrototypes(highlighter_activator);
cutil.createPrototypes(dynamic);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./clam_module/dynamic":6,"./clam_module/highlighter":7,"./clam_module/highlighter_activator":8,"./clam_module/message":9,"clam/core/container":2,"clam/core/util":5}],2:[function(require,module,exports){
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
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

var settings = {
    conf: {
        prototypeHTML: '<div class="jsm-dynamic b-dynamic"> <a href="javascript: void(0)" class="jsm-dynamic__add-embedded-btn">New embedded</a> | <a href="javascript: void(0)" class="jsm-dynamic__add-sibling-btn">New sibling</a> | <a href="javascript: void(0)" class="jsm-dynamic__toggle-highlight">Highlight</a> <div class="b-dynamic__additional-modules jsm-dynamic__additional-modules"></div> </div>'
    }
    // hasGlobalHooks: true
};

function Dynamic($jQObj, conf) {
    //var self = this;
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();

    this.moduleModifier = new modifier(this.module.$object, this.module.name);

    this.getHook('add-embedded-btn').on('click', $.proxy(this.addEmbedded, this));
    this.getHook('add-sibling-btn').on('click', $.proxy(this.addSibling, this));
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
    
    cutil.createPrototypes(Dynamic, {}, $embeddedModul);
};

module.exports = Dynamic;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"clam/core/modifier":3,"clam/core/module":4,"clam/core/util":5,"util":13}],7:[function(require,module,exports){
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

},{"clam/core/modifier":3,"clam/core/module":4,"clam/core/util":5,"util":13}],8:[function(require,module,exports){
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

},{"./highlighter":7,"clam/core/container":2,"clam/core/module":4,"clam/core/util":5,"util":13}],9:[function(require,module,exports){
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

},{"clam/core/modifier":3,"clam/core/module":4,"util":13}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],13:[function(require,module,exports){
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

},{"./support/isBuffer":12,"_process":11,"inherits":10}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZnJvbnRfc3JjXFxzY3JpcHRzXFxhcHAuanMiLCJmcm9udF9zcmNcXGJvd2VyX2NvbXBvbmVudHNcXGNsYW1cXGNvcmVcXGNvbnRhaW5lci5qcyIsImZyb250X3NyY1xcYm93ZXJfY29tcG9uZW50c1xcY2xhbVxcY29yZVxcbW9kaWZpZXIuanMiLCJmcm9udF9zcmNcXGJvd2VyX2NvbXBvbmVudHNcXGNsYW1cXGNvcmVcXG1vZHVsZS5qcyIsImZyb250X3NyY1xcYm93ZXJfY29tcG9uZW50c1xcY2xhbVxcY29yZVxcdXRpbC5qcyIsImZyb250X3NyY1xcc2NyaXB0c1xcY2xhbV9tb2R1bGVcXGR5bmFtaWMuanMiLCJmcm9udF9zcmNcXHNjcmlwdHNcXGNsYW1fbW9kdWxlXFxoaWdobGlnaHRlci5qcyIsImZyb250X3NyY1xcc2NyaXB0c1xcY2xhbV9tb2R1bGVcXGhpZ2hsaWdodGVyX2FjdGl2YXRvci5qcyIsImZyb250X3NyY1xcc2NyaXB0c1xcY2xhbV9tb2R1bGVcXG1lc3NhZ2UuanMiLCJub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcaW5oZXJpdHNcXGluaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xccHJvY2Vzc1xcYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFx1dGlsXFxzdXBwb3J0XFxpc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcdXRpbFxcdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGN1dGlsID0gcmVxdWlyZSgnY2xhbS9jb3JlL3V0aWwnKTtcclxudmFyIGNsYW1fY29udGFpbmVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL2NvbnRhaW5lcicpO1xyXG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcclxudmFyIGhpZ2hsaWdodGVyID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9oaWdobGlnaHRlcicpO1xyXG52YXIgZHluYW1pYyA9IHJlcXVpcmUoJy4vY2xhbV9tb2R1bGUvZHluYW1pYycpO1xyXG52YXIgbWVzc2FnZSA9IHJlcXVpcmUoJy4vY2xhbV9tb2R1bGUvbWVzc2FnZScpO1xyXG52YXIgaGlnaGxpZ2h0ZXJfYWN0aXZhdG9yID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9oaWdobGlnaHRlcl9hY3RpdmF0b3InKTtcclxuXHJcbmNsYW1fY29udGFpbmVyLmV4cG9zZSgpO1xyXG5cclxuY3V0aWwuY3JlYXRlUHJvdG90eXBlcyhtZXNzYWdlLCB7ZmFkZU91dFRpbWU6IDMwMH0pO1xyXG5jdXRpbC5jcmVhdGVQcm90b3R5cGVzKGhpZ2hsaWdodGVyLCB7fSwgJCgnI2hpZ2hsaWdodGVyLTEnKSk7XHJcbmN1dGlsLmNyZWF0ZVByb3RvdHlwZXMoaGlnaGxpZ2h0ZXJfYWN0aXZhdG9yKTtcclxuY3V0aWwuY3JlYXRlUHJvdG90eXBlcyhkeW5hbWljKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyICQgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy4kIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC4kIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1vZHVsZXM6IHt9LFxuXG4gICAgYWRkOiBmdW5jdGlvbihjbGFtX21vZHVsZSkge1xuICAgICAgICB2YXIgbW9kdWxlTmFtZTtcbiAgICAgICAgaWYgKCQuaXNBcnJheShjbGFtX21vZHVsZSkpIHtcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBjbGFtX21vZHVsZVswXS5tb2R1bGUubmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBjbGFtX21vZHVsZS5tb2R1bGUubmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKCQuaXNBcnJheSh0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0pICYmICQuaXNBcnJheShjbGFtX21vZHVsZSkpIHtcbiAgICAgICAgICAgICAgICAkLm1lcmdlKHRoaXMubW9kdWxlc1ttb2R1bGVOYW1lXSwgY2xhbV9tb2R1bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVGhlIFwiJyArIG1vZHVsZU5hbWUgKyAnXCIga2V5IGlzIGFscmVhZHkgc2V0IGluIHRoZSBjb250YWluZXIuIEFkZGluZyB0aGUgbW9kdWxlIHRvIHRoZSBjb250YWluZXIgZmFpbGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0gPSBjbGFtX21vZHVsZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKG1vZHVsZU5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aHJvdyAnTm90aGluZyBpcyBzZXQgdW5kZXIgdGhlIFwiJyArIG1vZHVsZU5hbWUgKyAnXCIga2V5IGluIHRoZSBjb250YWluZXIuJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV07XG4gICAgfSxcblxuICAgIGV4cG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5jb250YWluZXIgPSB0aGlzO1xuICAgICAgICBjb25zb2xlLndhcm4oJ1RoZSBjbGFtIGNvbnRhaW5lciBpcyBub3cgZXhwb3NlZCBhcyBcImNvbnRhaW5lclwiLicpO1xuICAgIH1cbn07XG4iLCJ2YXIgY3V0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gQ29uc3RydWN0b3Jcbi8vID09PT09PT09PT09XG5mdW5jdGlvbiBNb2RpZmllcigkb2JqZWN0LCBuYW1lLCBwcmVmaXgpIHtcbiAgICBpZiAodHlwZW9mIHByZWZpeCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcHJlZml4ID0gJ2InO1xuICAgIH1cblxuICAgIC8vIEF0dHJpYnV0ZXNcbiAgICB0aGlzLm1vZGlmaWVyID0ge1xuICAgICAgICAkb2JqZWN0OiAkb2JqZWN0LFxuICAgICAgICBwcmVmaXg6IHByZWZpeCxcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgcHJlZml4ZWROYW1lOiBwcmVmaXggKyAnLScgKyBuYW1lXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAgIGN1dGlsLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRvYmplY3QsIDEpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gY29uc29sZS5lcnJvcigkb2JqZWN0KTtcbiAgICAgICAgdGhyb3cgJ1ttb2RpZmllcjogXCInICsgbmFtZSArICdcIl0nICsgZTtcbiAgICB9XG59XG5cbi8vIEFQSVxuLy89PT09XG5Nb2RpZmllci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIHRydWUpO1xufTtcblxuTW9kaWZpZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQobmFtZSwgZmFsc2UpO1xufTtcblxuTW9kaWZpZXIucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5nZXQobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZXQobmFtZSwgdHJ1ZSk7XG59O1xuXG4vLyBHZXRzIGEgbW9kaWZpZXIgb24gYSBCRU0gb2JqZWN0LlxuTW9kaWZpZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbW9kUHJlZml4ID0gdGhpcy50eXBlSUQ7XG4gICAgdmFyIG1vZGlmaWVyQ2xhc3MgPSBjdXRpbC5nZXRNb2RpZmllckNsYXNzKHRoaXMubW9kaWZpZXIucHJlZml4ZWROYW1lLCBuYW1lKTtcblxuICAgIHZhciBjbGFzc2VzID0gY3V0aWwuZ2V0Q2xhc3Nlc0J5UHJlZml4KG1vZGlmaWVyQ2xhc3MsIHRoaXMubW9kaWZpZXIuJG9iamVjdCk7XG4gICAgLy8gTW9kaWZpZXIgbm90IGZvdW5kXG4gICAgaWYgKGNsYXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YWx1ZSA9IGNsYXNzZXNbMF0uc3BsaXQoJ18nKTtcblxuICAgIC8vIE1vZGlmaWVyIGZvdW5kLCBidXQgZG9lc24ndCBoYXZlIGEgc3BlY2lmaWMgdmFsdWVcbiAgICBpZiAodHlwZW9mIHZhbHVlWzFdID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIE1vZGlmaWVyIGZvdW5kIHdpdGggYSB2YWx1ZVxuICAgIHJldHVybiB2YWx1ZVsxXTtcbn07XG5cbi8vIFNldHMgYSBtb2RpZmllciBvbiBhIEJFTSBvYmplY3QuXG5Nb2RpZmllci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoXG4gICAgICAgIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJyAmJlxuICAgICAgICB0eXBlb2YgdmFsdWUgIT0gJ2Jvb2xlYW4nXG4gICAgKSB7XG4gICAgICAgIHRocm93ICdBIEJFTSBtb2RpZmllciB2YWx1ZSBjYW4gb25seSBlaXRoZXIgYmUgXCJzdHJpbmdcIiwgb3IgXCJib29sZWFuXCIuIFRoZSBnaXZlbiB2YWx1ZSB3YXMgb2YgdHlwZSBcIicgKyAodHlwZW9mIHZhbHVlKSArICdcIi4nO1xuICAgIH1cblxuICAgIHZhciBtb2RpZmllckNsYXNzID0gY3V0aWwuZ2V0TW9kaWZpZXJDbGFzcyh0aGlzLm1vZGlmaWVyLnByZWZpeGVkTmFtZSwgbmFtZSk7XG4gICAgY3V0aWwucmVtb3ZlQ2xhc3Nlc0J5UHJlZml4KG1vZGlmaWVyQ2xhc3MsIHRoaXMubW9kaWZpZXIuJG9iamVjdCk7XG4gICAgaWYgKHZhbHVlICE9PSBmYWxzZSkge1xuICAgICAgICBtb2RpZmllckNsYXNzID0gY3V0aWwuZ2V0TW9kaWZpZXJDbGFzcyh0aGlzLm1vZGlmaWVyLnByZWZpeGVkTmFtZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgICB0aGlzLm1vZGlmaWVyLiRvYmplY3QuYWRkQ2xhc3MobW9kaWZpZXJDbGFzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBFeHBvcnQgbW9kdWxlXG4vLz09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IE1vZGlmaWVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGN1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcblxuLy8gQ29uc3RydWN0b3Jcbi8vID09PT09PT09PT09XG5mdW5jdGlvbiBNb2R1bGUoJG9iamVjdCwgc2V0dGluZ3MsIGNvbmYpIHtcbiAgICB2YXIgbW9kdWxlTmFtZSA9IGN1dGlsLmdldE1vZHVsZU5hbWUodGhpcyk7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGN1dGlsLmdldE1vZHVsZUNsYXNzKG1vZHVsZU5hbWUpO1xuXG4gICAgdmFyIGRlcHRoID0gMTtcbiAgICBpZiAodHlwZW9mIHNldHRpbmdzLmhhc0dsb2JhbEhvb2tzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzZXR0aW5ncy5oYXNHbG9iYWxIb29rcyA9IGZhbHNlO1xuICAgIH1cbiAgICAvLyBDb252ZXJ0aW5nIHBvc3NpYmxlIHRocnV0aHkgdmFsdWVzIHRvIHRydWVcbiAgICBzZXR0aW5ncy5oYXNHbG9iYWxIb29rcyA9ICEhc2V0dGluZ3MuaGFzR2xvYmFsSG9va3M7XG5cbiAgICBpZiAoc2V0dGluZ3MudHlwZSAhPT0gJ3NpbmdsZXRvbicpIHtcbiAgICAgICAgc2V0dGluZ3MudHlwZSA9ICdiYXNpYyc7XG5cbiAgICAgICAgZGVwdGggPSAkb2JqZWN0LnBhcmVudHMoJy4nICsgY2xhc3NOYW1lKS5sZW5ndGggKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBjYW4gYmUgYSBzaW5nbGV0b24gb3Igbm90XG4gICAgICAgIHZhciBjbGFzc0VsZW1lbnRDb3VudCA9ICQoJy4nICsgY2xhc3NOYW1lKS5sZW5ndGg7XG4gICAgICAgIGlmIChjbGFzc0VsZW1lbnRDb3VudCA+IDEpIHtcbiAgICAgICAgICAgIHRocm93ICdUaGUgbW9kdWxlJyArICcgWycgKyBtb2R1bGVOYW1lICsgJ10gJyArICdjb3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGFzIGEgc2luZ2xldG9uLiAnICsgY2xhc3NFbGVtZW50Q291bnQgKyAnIERPTSBlbGVtZW50cyB3ZXJlIGZvdW5kIHdpdGggdGhlIFwiJyArIGNsYXNzTmFtZSArICdcIiBjbGFzcyBpbnN0ZWFkIG9mIGp1c3Qgb25lLic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm1vZHVsZSA9IHtcbiAgICAgICAgJG9iamVjdDogJG9iamVjdCxcbiAgICAgICAgbmFtZTogbW9kdWxlTmFtZSxcbiAgICAgICAgY2xhc3M6IGNsYXNzTmFtZSxcbiAgICAgICAgY29uZjoge30sXG4gICAgICAgIGV2ZW50czoge30sXG4gICAgICAgIGhvb2tzOiB7fSxcbiAgICAgICAgdHlwZTogc2V0dGluZ3MudHlwZSxcbiAgICAgICAgZGVwdGg6IGRlcHRoLFxuICAgICAgICBoYXNHbG9iYWxIb29rczogc2V0dGluZ3MuaGFzR2xvYmFsSG9va3NcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY3V0aWwudmFsaWRhdGVKUXVlcnlPYmplY3QoJG9iamVjdCwgMSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIH1cblxuICAgIC8vIENoZWNraW5nIGlmIHRoZSBqUXVlcnkgb2JqZWN0IGhhcyB0aGUgbmVlZGVkIGpzbSBjbGFzc1xuICAgIGlmICghJG9iamVjdC5oYXNDbGFzcyh0aGlzLm1vZHVsZS5jbGFzcykpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVGhlIGdpdmVuIGpRdWVyeSBPYmplY3QgZG9lcyBub3QgaGF2ZSB0aGlzIG1vZHVsZVxcJ3MgY2xhc3MuJyk7XG4gICAgfVxuXG4gICAgLy8gU2V0dGluZyB1cCBkZWZhdWx0IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAoc2V0dGluZ3MuY29uZiAhPT0gbnVsbCkge1xuICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm1vZHVsZS5jb25mLCBzZXR0aW5ncy5jb25mKTtcbiAgICB9XG5cbiAgICAvLyBNZXJnaW5nIGluIGRhdGEtIGNvbmZpZ3VyYXRpb25cbiAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm1vZHVsZS5jb25mLCB0aGlzLmdldERhdGFDb25maWd1cmF0aW9uKCkpO1xuXG4gICAgLy8gTWVyZ2luZyBpbiBwYXNzZWQgY29uZmlndXJhdGlvblxuICAgIGlmICh0eXBlb2YgY29uZiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5tb2R1bGUuY29uZiwgY29uZik7XG4gICAgfVxufTtcblxuLy8gQVBJXG4vLz09PT1cbk1vZHVsZS5wcm90b3R5cGUuYWRkSG9va0V2ZW50ID0gZnVuY3Rpb24oaG9va05hbWUsIGV2ZW50VHlwZSwgYWRkUHJlUG9zdEV2ZW50cykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgJGhvb2sgPSB0aGlzLmdldEhvb2tzKGhvb2tOYW1lKTtcbiAgICBpZiAoJGhvb2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZXZlbnROYW1lID0gaG9va05hbWUuc3BsaXQoJy0nKTtcbiAgICBldmVudE5hbWUucHVzaChldmVudFR5cGUpO1xuICAgIHZhciBldmVudE5hbWVMZW5ndGggPSBldmVudE5hbWUubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSBldmVudE5hbWVMZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBldmVudE5hbWVbaV0gPSBjdXRpbC51Y2ZpcnN0KGV2ZW50TmFtZVtpXSk7XG4gICAgfTtcbiAgICB2YXIgZXZlbnROYW1lID0gZXZlbnROYW1lLmpvaW4oJycpO1xuXG4gICAgJGhvb2suZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgJCh0aGlzKS5vbihldmVudFR5cGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChhZGRQcmVQb3N0RXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgc2VsZi50cmlnZ2VyRXZlbnQoJ3ByZScgKyBldmVudE5hbWUsIFtlLCAkKHRoaXMpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmWydvbicgKyBldmVudE5hbWVdLmFwcGx5KHNlbGYsIFtlLCAkKHRoaXMpXSk7XG4gICAgICAgICAgICBpZiAoYWRkUHJlUG9zdEV2ZW50cykge1xuICAgICAgICAgICAgICAgIHNlbGYudHJpZ2dlckV2ZW50KCdwb3N0JyArIGV2ZW50TmFtZSwgW2UsICQodGhpcyldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5tb2R1bGUuZXZlbnRzW2V2ZW50TmFtZV0gPSBjYWxsYmFjaztcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuZ2V0TW9kdWxlTmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjdXRpbC5nZXRNb2R1bGVOYW1lKHRoaXMpO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS50cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbihldmVudE5hbWUsIGFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMubW9kdWxlLmV2ZW50c1tldmVudE5hbWVdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLm1vZHVsZS5ldmVudHNbZXZlbnROYW1lXS5hcHBseSh0aGlzLCBhcmdzKTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUucHJldHRpZnkgPSBmdW5jdGlvbihtZXNzYWdlLCBzdWJqZWN0KSB7XG4gICAgcmV0dXJuICdbJyArIHRoaXMubW9kdWxlLm5hbWUgKyAoc3ViamVjdCA/ICc6ICcgKyBzdWJqZWN0OiAnJykgKyAnXSAnICsgbWVzc2FnZTtcbn07XG5cbi8qKlxuICogR2V0cyBhIHNpbmdsZSAtIG9yIG5vIC0gaG9vayBqUXVlcnkgb2JqZWN0IGZyb20gdGhlIG1vZHVsZSBjb250ZXh0LlxuICogVGhlIGZvdW5kIGhvb2sgd2lsbCBiZSBzYXZlZCwgdXNpbmcgdGhlIGhvb2tOYW1lIGFzIGEga2V5LiBUaGlzIHdheSwgb25seSBvbmVcbiAqIHNlYXJjaCBvY2N1cnMgZm9yIGFueSBnaXZlbiBob29rTmFtZSBpbiB0aGUgRE9NIHRyZWUuICBcbiAqIEZpbmRpbmcgbW9yZSB0aGFuIG9uZSBob29rIHdpbGwgcmVzdWx0IGluIGFuIGV4Y2VwdGlvbi4gKEFuIGVtcHR5IHJlc3VsdCBpc1xuICogYWxsb3dlZCBieSBkZWZhdWx0LilcbiAqIEBwYXJhbSBzdHJpbmcgaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSBib29sZWFuIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCBJZiBzZXQgdG8gdHJ1ZSwgdGhlbiBub3QgZmluZGluZyBhIGhvb2tcbiAqIHdpbGwgYWxzbyB0aHJvdyBhbiBleGNlcHRpb24uXG4gKiBAcmV0dXJuIGpRdWVyeSBPYmplY3QgKENsYW0gSG9vaylcbiAqL1xuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rID0gZnVuY3Rpb24oaG9va05hbWUsIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCkge1xuICAgIHJldHVybiB0aGlzLmdldEhvb2tzKGhvb2tOYW1lLCAxLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpO1xufTtcblxuLyoqXG4gKiBHZXRzIGFueSBudW1iZXIgb2YgalF1ZXJ5IG9iamVjdCAtIGluY2x1ZGluZyBub25lIC0gZnJvbSB0aGUgbW9kdWxlIGNvbnRleHQuXG4gKiBUaGUgZm91bmQgaG9vayB3aWxsIGJlIHNhdmVkLCB1c2luZyB0aGUgaG9va05hbWUgYXMgYSBrZXkuIFRoaXMgd2F5LCBvbmx5IG9uZVxuICogc2VhcmNoIG9jY3VycyBmb3IgYW55IGdpdmVuIGhvb2tOYW1lIGluIHRoZSBET00gdHJlZS5cbiAqIEBwYXJhbSBzdHJpbmcgaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSBpbnQgZXhwZWN0ZWRIb29rTnVtIChvcHRpb25hbCkgRGVmaW5lcyBleGFjdGx5IGhvdyBtYW55IGhvb2sgb2JqZWN0c1xuICogbXVzdCBiZSByZXR1cm5lZCBpbiB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24uIElmIGdpdmVuLCBidXQgdGhlIGZvdW5kIGhvb2tzXG4gKiBjb3VudCBkb2VzIG5vdCBlcXVhbCB0aGF0IG51bWJlciwgdGhlbiBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uIFxuICogQHBhcmFtIGJvb2xlYW4gZW1wdHlSZXN1bHROb3RBbGxvd2VkIElmIHNldCB0byB0cnVlLCB0aGVuIG5vdCBmaW5kaW5nIGhvb2tzXG4gKiB3aWxsIGFsc28gdGhyb3cgYW4gZXhjZXB0aW9uLlxuICogQHJldHVybiBqUXVlcnkgT2JqZWN0IChDbGFtIEhvb2spXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZ2V0SG9va3MgPSBmdW5jdGlvbihob29rTmFtZSwgZXhwZWN0ZWRIb29rTnVtLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMubW9kdWxlLmhvb2tzW2hvb2tOYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaG9va3NbaG9va05hbWVdID0gdGhpcy5maW5kSG9va3MoaG9va05hbWUsIGV4cGVjdGVkSG9va051bSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tb2R1bGUuaG9va3NbaG9va05hbWVdO1xufTtcblxuLyoqXG4gKiBHZXRzIGEgc2luZ2xlIC0gb3Igbm8gLSBob29rIGpRdWVyeSBvYmplY3QgZnJvbSB0aGUgbW9kdWxlIGNvbnRleHQgdXNpbmdcbiAqIGpRdWVyeSBzZWxlY3RvcnMuIFVzZWZ1bCB3aGVuIGhvb2tzIGNhbiBiZSBhZGRlZCBkaW5hbWljYWxseSB0byB0aGUgbW9kdWxlLlxuICogRmluZGluZyBtb3JlIHRoYW4gb25lIGhvb2sgd2lsbCByZXN1bHQgaW4gYW4gZXhjZXB0aW9uLiAoQW4gZW1wdHkgcmVzdWx0IGlzXG4gKiBhbGxvd2VkIGJ5IGRlZmF1bHQuKVxuICogQHBhcmFtIHN0cmluZyBob29rTmFtZSBUaGUgc2VhcmNoZWQgaG9vayBuYW1lLlxuICogQHBhcmFtIGJvb2xlYW4gZW1wdHlSZXN1bHROb3RBbGxvd2VkIElmIHNldCB0byB0cnVlLCB0aGVuIG5vdCBmaW5kaW5nIGEgaG9va1xuICogd2lsbCBhbHNvIHRocm93IGFuIGV4Y2VwdGlvbi5cbiAqIEByZXR1cm4galF1ZXJ5IE9iamVjdCAoQ2xhbSBIb29rKVxuICovXG5Nb2R1bGUucHJvdG90eXBlLmZpbmRIb29rID0gZnVuY3Rpb24oaG9va05hbWUsIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCkge1xuICAgIHJldHVybiB0aGlzLmZpbmRIb29rcyhob29rTmFtZSwgMSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKTtcbn07XG5cblxuLyoqXG4gKiBHZXRzIGFueSBudW1iZXIgb2YgalF1ZXJ5IG9iamVjdCAtIGluY2x1ZGluZyBub25lIC0gZnJvbSB0aGUgbW9kdWxlIGNvbnRleHRcbiAqIHVzaW5nIGpRdWVyeSBzZWxlY3RvcnMuIFVzZWZ1bCB3aGVuIGhvb2tzIGNhbiBiZSBhZGRlZCBkaW5hbWljYWxseSB0byB0aGVcbiAqIG1vZHVsZS5cbiAqIEBwYXJhbSBzdHJpbmcgaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSBpbnQgZXhwZWN0ZWRIb29rTnVtIChvcHRpb25hbCkgRGVmaW5lcyBleGFjdGx5IGhvdyBtYW55IGhvb2sgb2JqZWN0c1xuICogbXVzdCBiZSByZXR1cm5lZCBpbiB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24uIElmIGdpdmVuLCBidXQgdGhlIGZvdW5kIGhvb2tzXG4gKiBjb3VudCBkb2VzIG5vdCBlcXVhbCB0aGF0IG51bWJlciwgdGhlbiBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uIFxuICogQHJldHVybiBqUXVlcnkgT2JqZWN0IChDbGFtIEhvb2spXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZmluZEhvb2tzID0gZnVuY3Rpb24oaG9va05hbWUsIGV4cGVjdGVkSG9va051bSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBob29rQ2xhc3NOYW1lID0gdGhpcy5nZXRIb29rQ2xhc3NOYW1lKGhvb2tOYW1lKTtcbiAgICB2YXIgJGhvb2tzO1xuICAgIHZhciAkaW5Db250ZXh0SG9va3M7XG5cbiAgICBpZiAodGhpcy5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICBpZiAodGhpcy5tb2R1bGUuaGFzR2xvYmFsSG9va3MpIHtcbiAgICAgICAgICAgICRob29rcyA9ICQoJy4nICsgaG9va0NsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkaG9va3MgPSB0aGlzLm1vZHVsZS4kb2JqZWN0LmZpbmQoJy4nICsgaG9va0NsYXNzTmFtZSk7XG5cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGUgbWFpbiBtb2R1bGUgZWxlbWVudCBpZiBpdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZHVsZS4kb2JqZWN0Lmhhc0NsYXNzKGhvb2tDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgJGhvb2tzID0gJGhvb2tzLmFkZCh0aGlzLm1vZHVsZS4kb2JqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEdldHRpbmcgYWxsIGhvb2tzIGluIHRoZSBtb2R1bGUsIGV4Y2x1ZGluZyBvdGhlciBpbnN0YW5jZXMgb2YgdGhlXG4gICAgICAgIC8vIHNhbWUgbW9kdWxlIGluc2lkZSB0aGUgY3VycmVudCBvbmUuXG5cbiAgICAgICAgLy8gQ3JlYXRpbmcgYSBcImRlcHRoQ2xhc3NcIiB0byBleGNsdWRlIHRoZSBzYW1lIHR5cGVzIG9mIG1vZHVsZXMgaW5zaWRlXG4gICAgICAgIC8vIHRoZSBhY3R1YWwgb25lIHdoZW4gc2VhcmNoaW5nIGZvciBhIGhvb2suXG4gICAgICAgIHZhciBkZXB0aENsYXNzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLm1vZHVsZS5kZXB0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGRlcHRoQ2xhc3MucHVzaCgnLicgKyB0aGlzLm1vZHVsZS5jbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgZGVwdGhDbGFzcyA9IGRlcHRoQ2xhc3Muam9pbignICcpO1xuXG4gICAgICAgICRob29rcyA9XG4gICAgICAgICAgICB0aGlzLm1vZHVsZS4kb2JqZWN0XG4gICAgICAgICAgICAuZmluZCgnLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgLy8gRXhjbHVkaW5nIGFsbCBob29rcyBpbnNpZGUgb3RoZXIgbW9kdWxlIGluc3RhbmNlc1xuICAgICAgICAgICAgLm5vdChkZXB0aENsYXNzICsgJyAuJyArIGhvb2tDbGFzc05hbWUpXG4gICAgICAgICAgICAvLyBFeGNsdWRpbmcgYWxsIG90aGVyIG1vZHVsZXMgdGhhdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgICAgIC5ub3QoZGVwdGhDbGFzcyArICcuJyArIGhvb2tDbGFzc05hbWUpO1xuXG4gICAgICAgIC8vIEFkZGluZyBldmVyeSBob29rIG91dHNpZGUgb2YgdGhlIG1vZHVsZSBpbnN0YW5jZXMuXG4gICAgICAgIGlmICh0aGlzLm1vZHVsZS5oYXNHbG9iYWxIb29rcykge1xuICAgICAgICAgICAgdmFyICRnbG9iYWxIb29rcyA9XG4gICAgICAgICAgICAgICAgJCgnLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgICAgIC8vIEV4Y2x1ZGluZyBob29rcyBmcm9tIHdpdGhpbiBtb2R1bGVzXG4gICAgICAgICAgICAgICAgLm5vdCgnLicgKyB0aGlzLm1vZHVsZS5jbGFzcyArICcgLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgICAgIC5ub3QoJy4nICsgdGhpcy5tb2R1bGUuY2xhc3MgKyAnLicgKyBob29rQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoJGdsb2JhbEhvb2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRob29rcyA9ICRob29rcy5hZGQoJGdsb2JhbEhvb2tzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZGluZyB0aGUgbWFpbiBtb2R1bGUgZWxlbWVudCBpZiBpdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlLiRvYmplY3QuaGFzQ2xhc3MoaG9va0NsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICRob29rcyA9ICRob29rcy5hZGQodGhpcy5tb2R1bGUuJG9iamVjdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBleHBlY3RlZEhvb2tOdW0gPT09ICdudW1iZXInICYmXG4gICAgICAgIGV4cGVjdGVkSG9va051bSAhPSAkaG9va3MubGVuZ3RoXG4gICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICRob29rcy5sZW5ndGggIT09IDAgfHxcbiAgICAgICAgICAgIGVtcHR5UmVzdWx0Tm90QWxsb3dlZFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJGhvb2tzKTtcbiAgICAgICAgICAgIHRocm93ICdBbiBpbmNvcnJlY3QgbnVtYmVyIG9mIGhvb2tzIHdlcmUgZm91bmQuIEV4cGVjdGVkOiAnICsgZXhwZWN0ZWRIb29rTnVtICsgJy4gRm91bmQ6ICcgKyAkaG9va3MubGVuZ3RoICsgJy4gSG9vayBuYW1lOiBcIicgKyBob29rQ2xhc3NOYW1lICsgJ1wiJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAkaG9va3M7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmdldEhvb2tDbGFzc05hbWUgPSBmdW5jdGlvbihob29rTmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5jbGFzcyArICdfXycgKyBob29rTmFtZTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuZ2V0RGF0YUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGF0YUNvbmYgPSB0aGlzLm1vZHVsZS4kb2JqZWN0LmRhdGEoY3V0aWwuZ2V0TW9kdWxlQ2xhc3ModGhpcy5tb2R1bGUubmFtZSkpO1xuICAgIGlmICh0eXBlb2YgZGF0YUNvbmYgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRhdGFDb25mID0ge307XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkYXRhQ29uZiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVGhlIGRhdGEtKiBhdHRyaWJ1dGVcXCdzIGNvbnRlbnQgd2FzIG5vdCBhIHZhbGlkIEpTT04uIEZldGNoZWQgdmFsdWU6ICcgKyBkYXRhQ29uZik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGFDb25mO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rQ29uZmlndXJhdGlvbiA9IGZ1bmN0aW9uKCRob29rKSB7XG4gICAgcmV0dXJuICRob29rLmRhdGEodGhpcy5tb2R1bGUuY2xhc3MpO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5leHBvc2UgPSBmdW5jdGlvbihjb250YWluZXJOYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBjb250YWluZXJOYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBjb250YWluZXJOYW1lID0gJ2V4cG9zZWRfbW9kdWxlcyc7XG4gICAgfVxuICAgIFxuICAgIGlmICh0eXBlb2Ygd2luZG93W2NvbnRhaW5lck5hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV0gPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgbW9kdWxlTmFtZSA9IHRoaXMubW9kdWxlLm5hbWUucmVwbGFjZSgvXFwtL2csICdfJyk7XG5cbiAgICBpZiAodGhpcy5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnNvbGUud2FybignRXhwb3NlZCBhczogXCInICsgY29udGFpbmVyTmFtZSArICcuJyArIG1vZHVsZU5hbWUgKyAnXCIuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtb2R1bGVDb3VudCA9IHdpbmRvd1tjb250YWluZXJOYW1lXVttb2R1bGVOYW1lXS5sZW5ndGg7XG5cbiAgICAgICAgd2luZG93W2NvbnRhaW5lck5hbWVdW21vZHVsZU5hbWVdLnB1c2godGhpcyk7XG5cbiAgICAgICAgY29uc29sZS53YXJuKCdFeHBvc2VkIGFzOiBcIicgKyBjb250YWluZXJOYW1lICsgJy4nICsgbW9kdWxlTmFtZSArICdbJyArIG1vZHVsZUNvdW50ICsgJ11cIi4nKTtcbiAgICB9XG59O1xuXG4vLyBFeHBvcnQgbW9kdWxlXG4vLz09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xudmFyIGNvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29udGFpbmVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1vZHVsZUNvbmY6IHtcbiAgICAgICAgcHJlZml4OiAnanNtJ1xuICAgIH0sXG5cbiAgICBtb2RpZmllckNvbmY6IHtcbiAgICAgICAgcHJlZml4OiB7XG4gICAgICAgICAgICBuYW1lOiAnLS0nLFxuICAgICAgICAgICAgdmFsdWU6ICdfJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIENyZWF0ZXMgbW9kdWxlIGluc3RhbmNlcyBmb3IgZXZlcnkgRE9NIGVsZW1lbnQgdGhhdCBoYXMgdGhlIGFwcHJvcHJpYXRlXG4gICAgLy8gbW9kdWxlIGNsYXNzLiBJZiB0aGUgJGNvbnRhaW5lck9iaiBqUXVlcnkgb2JqZWN0IGlzIGdpdmVuIC0gY29udGFpbmluZ1xuICAgIC8vIG9uZSBlbGVtZW50IC0sIHRoZW4gdGhlIGZ1bmN0aW9uIHdpbGwgbG9vayBmb3IgdGhlIG1vZHVsZSBjbGFzc2VzIGluIHRoYXRcbiAgICAvLyBjb250YWluZXIuXG4gICAgY3JlYXRlUHJvdG90eXBlczogZnVuY3Rpb24obW9kdWxlLCBjb25maWcsICRjb250YWluZXJPYmopIHtcbiAgICAgICAgLy8gR2V0dGluZyB0aGUgbW9kdWxlIG5hbWUsIHRvIHNlbGVjdCB0aGUgRE9NIGVsZW1lbnRzLlxuICAgICAgICB2YXIgbW9kdWxlTmFtZSA9IHRoaXMuZ2V0TW9kdWxlTmFtZShtb2R1bGUpO1xuICAgICAgICB2YXIgbW9kdWxlQ2xhc3MgPSB0aGlzLmdldE1vZHVsZUNsYXNzKG1vZHVsZU5hbWUpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBjb25maWcgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAhY29uZmlnIC8vIGZhbHN5IHZhbHVlc1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbmZpZyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGFwcHJvcHJpYXRlIG1vZHVsZSBET00gb2JqZWN0c1xuICAgICAgICB2YXIgJG1vZHVsZXMgPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mICRjb250YWluZXJPYmogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRjb250YWluZXJPYmopO1xuICAgICAgICAgICAgJG1vZHVsZXMgPSAkY29udGFpbmVyT2JqLmZpbmQoJy4nICsgbW9kdWxlQ2xhc3MpO1xuICAgICAgICAgICAgaWYgKCRjb250YWluZXJPYmouaGFzQ2xhc3MobW9kdWxlQ2xhc3MpKSB7XG4gICAgICAgICAgICAgICAgJG1vZHVsZXMgPSAkbW9kdWxlcy5hZGQoJGNvbnRhaW5lck9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkbW9kdWxlcyA9ICQoJy4nICsgbW9kdWxlQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIG1vZHVsZSBpbnN0YW5jZXNcbiAgICAgICAgdmFyIGluc3RhbmNlcyA9IFtdO1xuICAgICAgICBpZiAoJG1vZHVsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJG1vZHVsZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZXMucHVzaChuZXcgbW9kdWxlKCQodGhpcyksIGNvbmZpZykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID09IDEgJiYgaW5zdGFuY2VzWzBdLm1vZHVsZS50eXBlID09ICdzaW5nbGV0b24nKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzID0gaW5zdGFuY2VzWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb250YWluZXIuYWRkKGluc3RhbmNlcyk7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLy8gR2V0J3MgYSBtb2R1bCdzIG5hbWUgZnJvbSBpdCdzIGRlZmluaXRpb24sIG9yIGZyb20gYSBwcm90b3R5cGVcbiAgICBnZXRNb2R1bGVOYW1lOiBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgICAgdmFyIGZ1bmNEZWYgPSB0eXBlb2YgbW9kdWxlID09PSAnZnVuY3Rpb24nID8gU3RyaW5nKG1vZHVsZSkgOiBTdHJpbmcobW9kdWxlLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgdmFyIGZ1bmNOYW1lID0gZnVuY0RlZi5zdWJzdHIoJ2Z1bmN0aW9uICcubGVuZ3RoKTtcbiAgICAgICAgZnVuY05hbWUgPSBmdW5jTmFtZS5zdWJzdHIoMCwgZnVuY05hbWUuaW5kZXhPZignKCcpKTtcblxuICAgICAgICByZXR1cm4gZnVuY05hbWUucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGNvbGxlY3Rpb24gaXMgYSB2YWxpZCBqUXVlcnkgb2JqZWN0IG9yIG5vdC5cbiAgICAvLyBJZiB0aGUgY29sbGVjdGlvblNpemUgKGludGVnZXIpIHBhcmFtZXRlciBpcyBzcGVjaWZpZWQsIHRoZW4gdGhlXG4gICAgLy8gY29sbGVjdGlvbidzIHNpemUgd2lsbCBiZSB2YWxpZGF0ZWQgYWNjb3JkaW5nbHkuXG4gICAgdmFsaWRhdGVKUXVlcnlPYmplY3Q6IGZ1bmN0aW9uKCRjb2xsZWN0aW9uLCBjb2xsZWN0aW9uU2l6ZSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgY29sbGVjdGlvblNpemUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICB0eXBlb2YgY29sbGVjdGlvblNpemUgIT09ICdudW1iZXInXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgJ1RoZSBnaXZlbiBcImNvbGxlY3Rpb25TaXplXCIgcGFyYW1ldGVyIGZvciB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gdmFsaWRhdGlvbiB3YXMgbm90IGEgbnVtYmVyLiBQYXNzZWQgdmFsdWU6ICcgKyBjb2xsZWN0aW9uU2l6ZSArICcsIHR5cGU6ICcgKyAodHlwZW9mIGNvbGxlY3Rpb25TaXplKSArICcuJztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCRjb2xsZWN0aW9uIGluc3RhbmNlb2YgalF1ZXJ5ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhyb3cgJ1RoaXMgaXMgbm90IGEgalF1ZXJ5IE9iamVjdC4gUGFzc2VkIHR5cGU6ICcgKyAodHlwZW9mICRjb2xsZWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBjb2xsZWN0aW9uU2l6ZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICRjb2xsZWN0aW9uLmxlbmd0aCAhPSBjb2xsZWN0aW9uU2l6ZVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93ICdUaGUgZ2l2ZW4galF1ZXJ5IGNvbGxlY3Rpb24gY29udGFpbnMgYW4gdW5leHBlY3RlZCBudW1iZXIgb2YgZWxlbWVudHMuIEV4cGVjdGVkOiAnICsgY29sbGVjdGlvblNpemUgKyAnLCBnaXZlbjogJyArICRjb2xsZWN0aW9uLmxlbmd0aCArICcuJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1Y2ZpcnN0OiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zdWJzdHIoMSk7XG4gICAgfSxcblxuICAgIGdldE1vZHVsZUNsYXNzOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZUNvbmYucHJlZml4ICsgJy0nICsgbmFtZTtcbiAgICB9LFxuXG4gICAgZ2V0TW9kaWZpZXJDbGFzczogZnVuY3Rpb24oYmFzZU5hbWUsIG1vZGlmaWVyTmFtZSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMubW9kaWZpZXJDb25mLnByZWZpeC52YWx1ZSArIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJhc2VOYW1lICsgdGhpcy5tb2RpZmllckNvbmYucHJlZml4Lm5hbWUgKyBtb2RpZmllck5hbWUgKyB2YWx1ZTtcbiAgICB9LFxuXG4gICAgZ2V0Q2xhc3Nlc0J5UHJlZml4OiBmdW5jdGlvbihwcmVmaXgsICRqUU9iaikge1xuICAgICAgICB2YXIgY2xhc3NlcyA9ICRqUU9iai5hdHRyKCdjbGFzcycpO1xuICAgICAgICBpZiAoIWNsYXNzZXMpIHsgLy8gaWYgXCJmYWxzeVwiLCBmb3IgZXg6IHVuZGVmaW5lZCBvciBlbXB0eSBzdHJpbmdcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzLnNwbGl0KCcgJyk7XG4gICAgICAgIHZhciBtYXRjaGVzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gbmV3IFJlZ0V4cCgnXignICsgcHJlZml4ICsgJykoLiopJykuZXhlYyhjbGFzc2VzW2ldKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXRjaGVzO1xuICAgIH0sXG5cbiAgICByZW1vdmVDbGFzc2VzQnlQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCwgJGpRT2JqKSB7XG4gICAgICAgIHZhciBtYXRjaGVzID0gdGhpcy5nZXRDbGFzc2VzQnlQcmVmaXgocHJlZml4LCAkalFPYmopO1xuICAgICAgICBtYXRjaGVzID0gbWF0Y2hlcy5qb2luKCcgJyk7XG4gICAgICAgICRqUU9iai5yZW1vdmVDbGFzcyhtYXRjaGVzKTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG52YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xyXG52YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XHJcbnZhciBtb2RpZmllciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2RpZmllcicpO1xyXG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XHJcbnZhciBjdXRpbCA9IHJlcXVpcmUoJ2NsYW0vY29yZS91dGlsJyk7XHJcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xyXG5cclxudmFyIHNldHRpbmdzID0ge1xyXG4gICAgY29uZjoge1xyXG4gICAgICAgIHByb3RvdHlwZUhUTUw6ICc8ZGl2IGNsYXNzPVwianNtLWR5bmFtaWMgYi1keW5hbWljXCI+IDxhIGhyZWY9XCJqYXZhc2NyaXB0OiB2b2lkKDApXCIgY2xhc3M9XCJqc20tZHluYW1pY19fYWRkLWVtYmVkZGVkLWJ0blwiPk5ldyBlbWJlZGRlZDwvYT4gfCA8YSBocmVmPVwiamF2YXNjcmlwdDogdm9pZCgwKVwiIGNsYXNzPVwianNtLWR5bmFtaWNfX2FkZC1zaWJsaW5nLWJ0blwiPk5ldyBzaWJsaW5nPC9hPiB8IDxhIGhyZWY9XCJqYXZhc2NyaXB0OiB2b2lkKDApXCIgY2xhc3M9XCJqc20tZHluYW1pY19fdG9nZ2xlLWhpZ2hsaWdodFwiPkhpZ2hsaWdodDwvYT4gPGRpdiBjbGFzcz1cImItZHluYW1pY19fYWRkaXRpb25hbC1tb2R1bGVzIGpzbS1keW5hbWljX19hZGRpdGlvbmFsLW1vZHVsZXNcIj48L2Rpdj4gPC9kaXY+J1xyXG4gICAgfVxyXG4gICAgLy8gaGFzR2xvYmFsSG9va3M6IHRydWVcclxufTtcclxuXHJcbmZ1bmN0aW9uIER5bmFtaWMoJGpRT2JqLCBjb25mKSB7XHJcbiAgICAvL3ZhciBzZWxmID0gdGhpcztcclxuICAgIGNsYW1fbW9kdWxlLmFwcGx5KHRoaXMsIFskalFPYmosIHNldHRpbmdzLCBjb25mXSk7XHJcbiAgICB0aGlzLmV4cG9zZSgpO1xyXG5cclxuICAgIHRoaXMubW9kdWxlTW9kaWZpZXIgPSBuZXcgbW9kaWZpZXIodGhpcy5tb2R1bGUuJG9iamVjdCwgdGhpcy5tb2R1bGUubmFtZSk7XHJcblxyXG4gICAgdGhpcy5nZXRIb29rKCdhZGQtZW1iZWRkZWQtYnRuJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmFkZEVtYmVkZGVkLCB0aGlzKSk7XHJcbiAgICB0aGlzLmdldEhvb2soJ2FkZC1zaWJsaW5nLWJ0bicpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5hZGRTaWJsaW5nLCB0aGlzKSk7XHJcbiAgICB0aGlzLmdldEhvb2soJ3RvZ2dsZS1oaWdobGlnaHQnKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMudG9nZ2xlSGlnaGxpZ2h0LCB0aGlzKSk7XHJcbn1cclxuXHJcbmluaGVyaXRzKER5bmFtaWMsIGNsYW1fbW9kdWxlKTtcclxuXHJcbkR5bmFtaWMucHJvdG90eXBlLmFkZEVtYmVkZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmFkZEFkZGl0aW9uYWxNb2R1bGUoKTtcclxufTtcclxuXHJcbkR5bmFtaWMucHJvdG90eXBlLmFkZFNpYmxpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuYWRkQWRkaXRpb25hbE1vZHVsZSh0cnVlKTtcclxufTtcclxuXHJcbkR5bmFtaWMucHJvdG90eXBlLnRvZ2dsZUhpZ2hsaWdodCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5tb2R1bGVNb2RpZmllci50b2dnbGUoJ2hpZ2hsaWdodCcpO1xyXG59O1xyXG5cclxuRHluYW1pYy5wcm90b3R5cGUuYWRkQWRkaXRpb25hbE1vZHVsZSA9IGZ1bmN0aW9uKGFzU2libGluZykge1xyXG4gICAgdmFyICRlbWJlZGRlZE1vZHVsID0gJCgkLnBhcnNlSFRNTCh0aGlzLm1vZHVsZS5jb25mLnByb3RvdHlwZUhUTUwpKTtcclxuICAgIGlmIChhc1NpYmxpbmcpIHtcclxuICAgICAgICB0aGlzLm1vZHVsZS4kb2JqZWN0LmFmdGVyKCRlbWJlZGRlZE1vZHVsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5nZXRIb29rKCdhZGRpdGlvbmFsLW1vZHVsZXMnKS5hcHBlbmQoJGVtYmVkZGVkTW9kdWwpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjdXRpbC5jcmVhdGVQcm90b3R5cGVzKER5bmFtaWMsIHt9LCAkZW1iZWRkZWRNb2R1bCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IER5bmFtaWM7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxudmFyIGN1dGlsID0gcmVxdWlyZSgnY2xhbS9jb3JlL3V0aWwnKTtcclxudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xyXG52YXIgbW9kaWZpZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kaWZpZXInKTtcclxudmFyIGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzO1xyXG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcclxuXHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIGNvbmY6IHtcclxuICAgICAgICBoaWdobGlnaHRUeXBlOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgaGFzR2xvYmFsSG9va3M6IHRydWVcclxufTtcclxuXHJcbnZhciBnbG9iYWxDb3VudCA9IDA7XHJcblxyXG5mdW5jdGlvbiBIaWdobGlnaHRlcigkalFPYmosIGNvbmYpIHtcclxuICAgIC8vdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgY2xhbV9tb2R1bGUuYXBwbHkodGhpcywgWyRqUU9iaiwgc2V0dGluZ3MsIGNvbmZdKTtcclxuICAgIHRoaXMuZXhwb3NlKCk7XHJcblxyXG4gICAgdGhpcy5sb2NhbENvdW50ID0gMDtcclxuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmdldEhvb2soJ2hpZ2hsaWdodCcpLm9uKCdjbGljaycsICQucHJveHkodGhpcy50b2dnbGVIaWdobGlnaHQsIHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLmhpZ2hsaWdodE1vZCA9IG5ldyBtb2RpZmllcihcclxuICAgICAgICB0aGlzLmdldEhvb2soJ2hpZ2hsaWdodCcpLFxyXG4gICAgICAgIHRoaXMubW9kdWxlLm5hbWVcclxuICAgICk7XHJcbn1cclxuXHJcbmluaGVyaXRzKEhpZ2hsaWdodGVyLCBjbGFtX21vZHVsZSk7XHJcblxyXG5IaWdobGlnaHRlci5wcm90b3R5cGUudG9nZ2xlSGlnaGxpZ2h0ID0gZnVuY3Rpb24oZSkge1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZ2V0SG9vaygnZ2xvYmFsLWNvdW50ZXInKS50ZXh0KCsrZ2xvYmFsQ291bnQpO1xyXG4gICAgdGhpcy5nZXRIb29rKCdsb2NhbC1jb3VudGVyJykudGV4dCgrK3RoaXMubG9jYWxDb3VudCk7XHJcblxyXG4gICAgaWYgKHRoaXMuaGlnaGxpZ2h0TW9kLmdldCgnaGlnaGxpZ2h0JykpIHtcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodE1vZC5vZmYoJ2hpZ2hsaWdodCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodE1vZC5zZXQoJ2hpZ2hsaWdodCcsIHRoaXMubW9kdWxlLmNvbmYuaGlnaGxpZ2h0VHlwZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5IaWdobGlnaHRlci5wcm90b3R5cGUuaW5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5oaWdobGlnaHRNb2Quc2V0KCdpbmFjdGl2ZScsIHRydWUpO1xyXG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxufTtcclxuXHJcbkhpZ2hsaWdodGVyLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5oaWdobGlnaHRNb2Quc2V0KCdpbmFjdGl2ZScsIGZhbHNlKTtcclxuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSGlnaGxpZ2h0ZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxudmFyIGN1dGlsID0gcmVxdWlyZSgnY2xhbS9jb3JlL3V0aWwnKTtcclxudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xyXG52YXIgY2xhbV9jb250YWluZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvY29udGFpbmVyJyk7XHJcbnZhciBoaWdobGlnaHRlciA9IHJlcXVpcmUoJy4vaGlnaGxpZ2h0ZXInKTtcclxuLy92YXIgbW9kaWZpZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kaWZpZXInKTtcclxudmFyIGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzO1xyXG5cclxudmFyIHNldHRpbmdzID0ge1xyXG4gICAgdHlwZTogJ3NpbmdsZXRvbicsXHJcbiAgICAvLyBoYXNHbG9iYWxIb29rczogdHJ1ZSxcclxuICAgIGNvbmY6IHt9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBIaWdobGlnaHRlckFjdGl2YXRvcigkalFPYmosIGNvbmYpIHtcclxuICAgIC8vdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgY2xhbV9tb2R1bGUuYXBwbHkodGhpcywgWyRqUU9iaiwgc2V0dGluZ3MsIGNvbmZdKTtcclxuICAgIHRoaXMuZXhwb3NlKCk7XHJcbiAgICAvLyB0aHJvdyB0aGlzLnByZXR0aWZ5KCdlcnJvcicpO1xyXG4gICAgXHJcbiAgICB0aGlzLmFsbEFjdGl2YXRlZCA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuZ2V0SG9vaygnYWN0aXZhdGUtYnRuJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmFjdGl2YXRlLCB0aGlzKSk7XHJcbn1cclxuXHJcbmluaGVyaXRzKEhpZ2hsaWdodGVyQWN0aXZhdG9yLCBjbGFtX21vZHVsZSk7XHJcblxyXG5IaWdobGlnaHRlckFjdGl2YXRvci5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcclxuICAgIGlmICh0aGlzLmFsbEFjdGl2YXRlZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuYWxsQWN0aXZhdGVkID0gdHJ1ZTtcclxuXHJcbiAgICBjbGFtX2NvbnRhaW5lci5nZXQoJ21lc3NhZ2UnKS5tZXNzYWdlKCdTdWNjZXNzZnVsIG1vZHVsIGFjdGl2YXRpb24hJyk7XHJcblxyXG4gICAgdGhpcy5nZXRIb29rKCdhY3RpdmF0ZS1idG4nKS5mYWRlT3V0KCczMDAnKTtcclxuXHJcbiAgICB2YXIgcHJvdG90eXBlcyA9IGN1dGlsLmNyZWF0ZVByb3RvdHlwZXMoaGlnaGxpZ2h0ZXIsIHt9LCAkKCcjaGlnaGxpZ2h0ZXItMicpKTtcclxuICAgICQuZWFjaChwcm90b3R5cGVzLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmFjdGl2YXRlKCk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSGlnaGxpZ2h0ZXJBY3RpdmF0b3I7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xyXG4vL3ZhciBjbGFtX21vZHVsZSA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2R1bGUnKTtcclxuLy92YXIgY2xhbV9jb250YWluZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvY29udGFpbmVyJyk7XHJcbnZhciBtb2RpZmllciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2RpZmllcicpO1xyXG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XHJcblxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICB0eXBlOiAnc2luZ2xldG9uJyxcclxuICAgIGhhc0dsb2JhbEhvb2tzOiB0cnVlLFxyXG4gICAgY29uZjoge1xyXG4gICAgICAgIGZhZGVPdXRUaW1lOiA1MDBcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIE1lc3NhZ2UoJGpRT2JqLCBjb25mKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBjbGFtX21vZHVsZS5hcHBseSh0aGlzLCBbJGpRT2JqLCBzZXR0aW5ncywgY29uZl0pO1xyXG4gICAgdGhpcy5leHBvc2UoKTtcclxuICAgIC8vIHRocm93IHRoaXMucHJldHRpZnkoJ2Vycm9yJyk7XHJcbiAgICAvLyBjbGFtX2NvbnRhaW5lci5nZXQoJ2NsYW0tbW9kdWxlJyk7XHJcblxyXG4gICAgdGhpcy5tZXNzYWdlTW9kID0gbmV3IG1vZGlmaWVyKFxyXG4gICAgICAgIHRoaXMubW9kdWxlLiRvYmplY3QsXHJcbiAgICAgICAgdGhpcy5tb2R1bGUubmFtZVxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmlzT3BlbiA9ICEhdGhpcy5tZXNzYWdlTW9kLmdldCgndHlwZScpO1xyXG4gICAgXHJcbiAgICB0aGlzLmdldEhvb2tzKCd0ZXN0LWJ0bicpLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAkKHRoaXMpLm9uKCdjbGljaycsICQucHJveHkoc2VsZi50ZXN0Q2xpY2ssIHNlbGYsICQodGhpcykpKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmdldEhvb2tzKCdjbG9zZS1idG4nKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuY2xvc2UsIHRoaXMpKTtcclxufVxyXG5cclxuaW5oZXJpdHMoTWVzc2FnZSwgY2xhbV9tb2R1bGUpO1xyXG5cclxuTWVzc2FnZS5wcm90b3R5cGUubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHR5cGUpIHtcclxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICB0eXBlID0gJ3N1Y2Nlc3MnO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubWVzc2FnZU1vZC5zZXQoJ3R5cGUnLCB0eXBlKTtcclxuICAgIHRoaXMuZ2V0SG9vaygnbWVzc2FnZScpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgaWYgKCF0aGlzLmlzT3Blbikge1xyXG4gICAgICAgIHRoaXMubW9kdWxlLiRvYmplY3QuZmFkZUluKDMwMCk7XHJcbiAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuTWVzc2FnZS5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbihtZXNzYWdlLCB0eXBlKSB7XHJcbiAgICB0aGlzLm1vZHVsZS4kb2JqZWN0LmZhZGVPdXQoMzAwKTtcclxuICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XHJcbn07XHJcblxyXG5NZXNzYWdlLnByb3RvdHlwZS50ZXN0Q2xpY2sgPSBmdW5jdGlvbigkaG9vaykge1xyXG4gICAgdmFyIGNvbmYgPSB0aGlzLmdldEhvb2tDb25maWd1cmF0aW9uKCRob29rKTtcclxuICAgIHRoaXMubWVzc2FnZShjb25mLm1lc3NhZ2UsIGNvbmYudHlwZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2U7XHJcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iXX0=
