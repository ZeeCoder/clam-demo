(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var cutil = require('clam/core/util');
var clam_container = require('clam/core/container');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var highlighter = require('./clam_module/highlighter');
var message = require('./clam_module/message');
var highlighter_creator = require('./clam_module/highlighter_creator');

clam_container.expose();

cutil.createPrototypes(message, {fadeOutTime: 300});
cutil.createPrototypes(highlighter, {}, $('#highlighter-1'));
cutil.createPrototypes(highlighter_creator);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./clam_module/highlighter":6,"./clam_module/highlighter_creator":7,"./clam_module/message":8,"clam/core/container":2,"clam/core/util":5}],2:[function(require,module,exports){
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
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

var settings = {
    conf: {
        highlightValue: true
    },
    hasGlobalHooks: true
};

var globalCount = 0;

function Highlighter($jQObj, conf) {
    var self = this;
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();

    this.localCount = 0;
    this.active = true;

    this.getHook('highlight').on('click', function(e) {
        e.stopPropagation();
        self.toggleHighlight();
    });

    this.highlightMod = new modifier(
        this.getHook('highlight'),
        this.module.name
    );
}

inherits(Highlighter, clam_module);

Highlighter.prototype.toggleHighlight = function() {
    if (!this.active) {
        return;
    }

    this.getHook('global-counter').text(++globalCount);
    this.getHook('local-counter').text(++this.localCount);

    if (this.highlightMod.get('highlight')) {
        this.highlightMod.off('highlight');
    } else {
        this.highlightMod.set('highlight', this.module.conf.highlightValue);
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

},{"clam/core/modifier":3,"clam/core/module":4,"clam/core/util":5,"util":12}],7:[function(require,module,exports){
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

function HighlighterCreator($jQObj, conf) {
    var self = this;
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();
    // throw this.prettify('error');
    
    this.allActivated = false;

    this.getHook('activate-btn').on('click', function(e) {
        self.activate();
    });
}

inherits(HighlighterCreator, clam_module);

HighlighterCreator.prototype.activate = function() {
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

module.exports = HighlighterCreator;

},{"./highlighter":6,"clam/core/container":2,"clam/core/module":4,"clam/core/util":5,"util":12}],8:[function(require,module,exports){
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

},{"clam/core/modifier":3,"clam/core/module":4,"util":12}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],12:[function(require,module,exports){
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

},{"./support/isBuffer":11,"_process":10,"inherits":9}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJmcm9udF9zcmMvc2NyaXB0cy9hcHAuanMiLCJmcm9udF9zcmMvYm93ZXJfY29tcG9uZW50cy9jbGFtL2NvcmUvY29udGFpbmVyLmpzIiwiZnJvbnRfc3JjL2Jvd2VyX2NvbXBvbmVudHMvY2xhbS9jb3JlL21vZGlmaWVyLmpzIiwiZnJvbnRfc3JjL2Jvd2VyX2NvbXBvbmVudHMvY2xhbS9jb3JlL21vZHVsZS5qcyIsImZyb250X3NyYy9ib3dlcl9jb21wb25lbnRzL2NsYW0vY29yZS91dGlsLmpzIiwiZnJvbnRfc3JjL3NjcmlwdHMvY2xhbV9tb2R1bGUvaGlnaGxpZ2h0ZXIuanMiLCJmcm9udF9zcmMvc2NyaXB0cy9jbGFtX21vZHVsZS9oaWdobGlnaHRlcl9jcmVhdG9yLmpzIiwiZnJvbnRfc3JjL3NjcmlwdHMvY2xhbV9tb2R1bGUvbWVzc2FnZS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGN1dGlsID0gcmVxdWlyZSgnY2xhbS9jb3JlL3V0aWwnKTtcbnZhciBjbGFtX2NvbnRhaW5lciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9jb250YWluZXInKTtcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xudmFyIGhpZ2hsaWdodGVyID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9oaWdobGlnaHRlcicpO1xudmFyIG1lc3NhZ2UgPSByZXF1aXJlKCcuL2NsYW1fbW9kdWxlL21lc3NhZ2UnKTtcbnZhciBoaWdobGlnaHRlcl9jcmVhdG9yID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9oaWdobGlnaHRlcl9jcmVhdG9yJyk7XG5cbmNsYW1fY29udGFpbmVyLmV4cG9zZSgpO1xuXG5jdXRpbC5jcmVhdGVQcm90b3R5cGVzKG1lc3NhZ2UsIHtmYWRlT3V0VGltZTogMzAwfSk7XG5jdXRpbC5jcmVhdGVQcm90b3R5cGVzKGhpZ2hsaWdodGVyLCB7fSwgJCgnI2hpZ2hsaWdodGVyLTEnKSk7XG5jdXRpbC5jcmVhdGVQcm90b3R5cGVzKGhpZ2hsaWdodGVyX2NyZWF0b3IpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyICQgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy4kIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC4kIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1vZHVsZXM6IHt9LFxuXG4gICAgYWRkOiBmdW5jdGlvbihjbGFtX21vZHVsZSkge1xuICAgICAgICB2YXIgbW9kdWxlTmFtZTtcbiAgICAgICAgaWYgKCQuaXNBcnJheShjbGFtX21vZHVsZSkpIHtcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBjbGFtX21vZHVsZVswXS5tb2R1bGUubmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBjbGFtX21vZHVsZS5tb2R1bGUubmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKCQuaXNBcnJheSh0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0pICYmICQuaXNBcnJheShjbGFtX21vZHVsZSkpIHtcbiAgICAgICAgICAgICAgICAkLm1lcmdlKHRoaXMubW9kdWxlc1ttb2R1bGVOYW1lXSwgY2xhbV9tb2R1bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVGhlIFwiJyArIG1vZHVsZU5hbWUgKyAnXCIga2V5IGlzIGFscmVhZHkgc2V0IGluIHRoZSBjb250YWluZXIuIEFkZGluZyB0aGUgbW9kdWxlIHRvIHRoZSBjb250YWluZXIgZmFpbGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0gPSBjbGFtX21vZHVsZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKG1vZHVsZU5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aHJvdyAnTm90aGluZyBpcyBzZXQgdW5kZXIgdGhlIFwiJyArIG1vZHVsZU5hbWUgKyAnXCIga2V5IGluIHRoZSBjb250YWluZXIuJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV07XG4gICAgfSxcblxuICAgIGV4cG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5jb250YWluZXIgPSB0aGlzO1xuICAgICAgICBjb25zb2xlLndhcm4oJ1RoZSBjbGFtIGNvbnRhaW5lciBpcyBub3cgZXhwb3NlZCBhcyBcImNvbnRhaW5lclwiLicpO1xuICAgIH1cbn07XG4iLCJ2YXIgY3V0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gQ29uc3RydWN0b3Jcbi8vID09PT09PT09PT09XG5mdW5jdGlvbiBNb2RpZmllcigkb2JqZWN0LCBuYW1lLCBwcmVmaXgpIHtcbiAgICBpZiAodHlwZW9mIHByZWZpeCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcHJlZml4ID0gJ2InO1xuICAgIH1cblxuICAgIC8vIEF0dHJpYnV0ZXNcbiAgICB0aGlzLm1vZGlmaWVyID0ge1xuICAgICAgICAkb2JqZWN0OiAkb2JqZWN0LFxuICAgICAgICBwcmVmaXg6IHByZWZpeCxcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgcHJlZml4ZWROYW1lOiBwcmVmaXggKyAnLScgKyBuYW1lXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAgIGN1dGlsLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRvYmplY3QsIDEpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gY29uc29sZS5lcnJvcigkb2JqZWN0KTtcbiAgICAgICAgdGhyb3cgJ1ttb2RpZmllcjogXCInICsgbmFtZSArICdcIl0nICsgZTtcbiAgICB9XG59XG5cbi8vIEFQSVxuLy89PT09XG5Nb2RpZmllci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIHRydWUpO1xufTtcblxuTW9kaWZpZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQobmFtZSwgZmFsc2UpO1xufTtcblxuTW9kaWZpZXIucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5nZXQobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZXQobmFtZSwgdHJ1ZSk7XG59O1xuXG4vLyBHZXRzIGEgbW9kaWZpZXIgb24gYSBCRU0gb2JqZWN0LlxuTW9kaWZpZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbW9kUHJlZml4ID0gdGhpcy50eXBlSUQ7XG4gICAgdmFyIG1vZGlmaWVyQ2xhc3MgPSBjdXRpbC5nZXRNb2RpZmllckNsYXNzKHRoaXMubW9kaWZpZXIucHJlZml4ZWROYW1lLCBuYW1lKTtcblxuICAgIHZhciBjbGFzc2VzID0gY3V0aWwuZ2V0Q2xhc3Nlc0J5UHJlZml4KG1vZGlmaWVyQ2xhc3MsIHRoaXMubW9kaWZpZXIuJG9iamVjdCk7XG4gICAgLy8gTW9kaWZpZXIgbm90IGZvdW5kXG4gICAgaWYgKGNsYXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YWx1ZSA9IGNsYXNzZXNbMF0uc3BsaXQoJ18nKTtcblxuICAgIC8vIE1vZGlmaWVyIGZvdW5kLCBidXQgZG9lc24ndCBoYXZlIGEgc3BlY2lmaWMgdmFsdWVcbiAgICBpZiAodHlwZW9mIHZhbHVlWzFdID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIE1vZGlmaWVyIGZvdW5kIHdpdGggYSB2YWx1ZVxuICAgIHJldHVybiB2YWx1ZVsxXTtcbn07XG5cbi8vIFNldHMgYSBtb2RpZmllciBvbiBhIEJFTSBvYmplY3QuXG5Nb2RpZmllci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoXG4gICAgICAgIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJyAmJlxuICAgICAgICB0eXBlb2YgdmFsdWUgIT0gJ2Jvb2xlYW4nXG4gICAgKSB7XG4gICAgICAgIHRocm93ICdBIEJFTSBtb2RpZmllciB2YWx1ZSBjYW4gb25seSBlaXRoZXIgYmUgXCJzdHJpbmdcIiwgb3IgXCJib29sZWFuXCIuIFRoZSBnaXZlbiB2YWx1ZSB3YXMgb2YgdHlwZSBcIicgKyAodHlwZW9mIHZhbHVlKSArICdcIi4nO1xuICAgIH1cblxuICAgIHZhciBtb2RpZmllckNsYXNzID0gY3V0aWwuZ2V0TW9kaWZpZXJDbGFzcyh0aGlzLm1vZGlmaWVyLnByZWZpeGVkTmFtZSwgbmFtZSk7XG4gICAgY3V0aWwucmVtb3ZlQ2xhc3Nlc0J5UHJlZml4KG1vZGlmaWVyQ2xhc3MsIHRoaXMubW9kaWZpZXIuJG9iamVjdCk7XG4gICAgaWYgKHZhbHVlICE9PSBmYWxzZSkge1xuICAgICAgICBtb2RpZmllckNsYXNzID0gY3V0aWwuZ2V0TW9kaWZpZXJDbGFzcyh0aGlzLm1vZGlmaWVyLnByZWZpeGVkTmFtZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgICB0aGlzLm1vZGlmaWVyLiRvYmplY3QuYWRkQ2xhc3MobW9kaWZpZXJDbGFzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBFeHBvcnQgbW9kdWxlXG4vLz09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IE1vZGlmaWVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGN1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcblxuLy8gQ29uc3RydWN0b3Jcbi8vID09PT09PT09PT09XG5mdW5jdGlvbiBNb2R1bGUoJG9iamVjdCwgc2V0dGluZ3MsIGNvbmYpIHtcbiAgICB2YXIgbW9kdWxlTmFtZSA9IGN1dGlsLmdldE1vZHVsZU5hbWUodGhpcyk7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGN1dGlsLmdldE1vZHVsZUNsYXNzKG1vZHVsZU5hbWUpO1xuXG4gICAgdmFyIGRlcHRoID0gMTtcbiAgICBpZiAodHlwZW9mIHNldHRpbmdzLmhhc0dsb2JhbEhvb2tzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzZXR0aW5ncy5oYXNHbG9iYWxIb29rcyA9IGZhbHNlO1xuICAgIH1cbiAgICAvLyBDb252ZXJ0aW5nIHBvc3NpYmxlIHRocnV0aHkgdmFsdWVzIHRvIHRydWVcbiAgICBzZXR0aW5ncy5oYXNHbG9iYWxIb29rcyA9ICEhc2V0dGluZ3MuaGFzR2xvYmFsSG9va3M7XG5cbiAgICBpZiAoc2V0dGluZ3MudHlwZSAhPT0gJ3NpbmdsZXRvbicpIHtcbiAgICAgICAgc2V0dGluZ3MudHlwZSA9ICdiYXNpYyc7XG5cbiAgICAgICAgZGVwdGggPSAkb2JqZWN0LnBhcmVudHMoJy4nICsgY2xhc3NOYW1lKS5sZW5ndGggKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBjYW4gYmUgYSBzaW5nbGV0b24gb3Igbm90XG4gICAgICAgIHZhciBjbGFzc0VsZW1lbnRDb3VudCA9ICQoJy4nICsgY2xhc3NOYW1lKS5sZW5ndGg7XG4gICAgICAgIGlmIChjbGFzc0VsZW1lbnRDb3VudCA+IDEpIHtcbiAgICAgICAgICAgIHRocm93ICdUaGUgbW9kdWxlJyArICcgWycgKyBtb2R1bGVOYW1lICsgJ10gJyArICdjb3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGFzIGEgc2luZ2xldG9uLiAnICsgY2xhc3NFbGVtZW50Q291bnQgKyAnIERPTSBlbGVtZW50cyB3ZXJlIGZvdW5kIHdpdGggdGhlIFwiJyArIGNsYXNzTmFtZSArICdcIiBjbGFzcyBpbnN0ZWFkIG9mIGp1c3Qgb25lLic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm1vZHVsZSA9IHtcbiAgICAgICAgJG9iamVjdDogJG9iamVjdCxcbiAgICAgICAgbmFtZTogbW9kdWxlTmFtZSxcbiAgICAgICAgY2xhc3M6IGNsYXNzTmFtZSxcbiAgICAgICAgY29uZjoge30sXG4gICAgICAgIGV2ZW50czoge30sXG4gICAgICAgIGhvb2tzOiB7fSxcbiAgICAgICAgdHlwZTogc2V0dGluZ3MudHlwZSxcbiAgICAgICAgZGVwdGg6IGRlcHRoLFxuICAgICAgICBoYXNHbG9iYWxIb29rczogc2V0dGluZ3MuaGFzR2xvYmFsSG9va3NcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY3V0aWwudmFsaWRhdGVKUXVlcnlPYmplY3QoJG9iamVjdCwgMSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIH1cblxuICAgIC8vIENoZWNraW5nIGlmIHRoZSBqUXVlcnkgb2JqZWN0IGhhcyB0aGUgbmVlZGVkIGpzbSBjbGFzc1xuICAgIGlmICghJG9iamVjdC5oYXNDbGFzcyh0aGlzLm1vZHVsZS5jbGFzcykpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVGhlIGdpdmVuIGpRdWVyeSBPYmplY3QgZG9lcyBub3QgaGF2ZSB0aGlzIG1vZHVsZVxcJ3MgY2xhc3MuJyk7XG4gICAgfVxuXG4gICAgLy8gU2V0dGluZyB1cCBkZWZhdWx0IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAoc2V0dGluZ3MuY29uZiAhPT0gbnVsbCkge1xuICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm1vZHVsZS5jb25mLCBzZXR0aW5ncy5jb25mKTtcbiAgICB9XG5cbiAgICAvLyBNZXJnaW5nIGluIGRhdGEtIGNvbmZpZ3VyYXRpb25cbiAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm1vZHVsZS5jb25mLCB0aGlzLmdldERhdGFDb25maWd1cmF0aW9uKCkpO1xuXG4gICAgLy8gTWVyZ2luZyBpbiBwYXNzZWQgY29uZmlndXJhdGlvblxuICAgIGlmICh0eXBlb2YgY29uZiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5tb2R1bGUuY29uZiwgY29uZik7XG4gICAgfVxufTtcblxuLy8gQVBJXG4vLz09PT1cbk1vZHVsZS5wcm90b3R5cGUuYWRkSG9va0V2ZW50ID0gZnVuY3Rpb24oaG9va05hbWUsIGV2ZW50VHlwZSwgYWRkUHJlUG9zdEV2ZW50cykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgJGhvb2sgPSB0aGlzLmdldEhvb2tzKGhvb2tOYW1lKTtcbiAgICBpZiAoJGhvb2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZXZlbnROYW1lID0gaG9va05hbWUuc3BsaXQoJy0nKTtcbiAgICBldmVudE5hbWUucHVzaChldmVudFR5cGUpO1xuICAgIHZhciBldmVudE5hbWVMZW5ndGggPSBldmVudE5hbWUubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSBldmVudE5hbWVMZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBldmVudE5hbWVbaV0gPSBjdXRpbC51Y2ZpcnN0KGV2ZW50TmFtZVtpXSk7XG4gICAgfTtcbiAgICB2YXIgZXZlbnROYW1lID0gZXZlbnROYW1lLmpvaW4oJycpO1xuXG4gICAgJGhvb2suZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgJCh0aGlzKS5vbihldmVudFR5cGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChhZGRQcmVQb3N0RXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgc2VsZi50cmlnZ2VyRXZlbnQoJ3ByZScgKyBldmVudE5hbWUsIFtlLCAkKHRoaXMpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmWydvbicgKyBldmVudE5hbWVdLmFwcGx5KHNlbGYsIFtlLCAkKHRoaXMpXSk7XG4gICAgICAgICAgICBpZiAoYWRkUHJlUG9zdEV2ZW50cykge1xuICAgICAgICAgICAgICAgIHNlbGYudHJpZ2dlckV2ZW50KCdwb3N0JyArIGV2ZW50TmFtZSwgW2UsICQodGhpcyldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5tb2R1bGUuZXZlbnRzW2V2ZW50TmFtZV0gPSBjYWxsYmFjaztcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuZ2V0TW9kdWxlTmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjdXRpbC5nZXRNb2R1bGVOYW1lKHRoaXMpO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS50cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbihldmVudE5hbWUsIGFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMubW9kdWxlLmV2ZW50c1tldmVudE5hbWVdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLm1vZHVsZS5ldmVudHNbZXZlbnROYW1lXS5hcHBseSh0aGlzLCBhcmdzKTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUucHJldHRpZnkgPSBmdW5jdGlvbihtZXNzYWdlLCBzdWJqZWN0KSB7XG4gICAgcmV0dXJuICdbJyArIHRoaXMubW9kdWxlLm5hbWUgKyAoc3ViamVjdCA/ICc6ICcgKyBzdWJqZWN0OiAnJykgKyAnXSAnICsgbWVzc2FnZTtcbn07XG5cbi8qKlxuICogR2V0cyBhIHNpbmdsZSAtIG9yIG5vIC0gaG9vayBqUXVlcnkgb2JqZWN0IGZyb20gdGhlIG1vZHVsZSBjb250ZXh0LlxuICogVGhlIGZvdW5kIGhvb2sgd2lsbCBiZSBzYXZlZCwgdXNpbmcgdGhlIGhvb2tOYW1lIGFzIGEga2V5LiBUaGlzIHdheSwgb25seSBvbmVcbiAqIHNlYXJjaCBvY2N1cnMgZm9yIGFueSBnaXZlbiBob29rTmFtZSBpbiB0aGUgRE9NIHRyZWUuICBcbiAqIEZpbmRpbmcgbW9yZSB0aGFuIG9uZSBob29rIHdpbGwgcmVzdWx0IGluIGFuIGV4Y2VwdGlvbi4gKEFuIGVtcHR5IHJlc3VsdCBpc1xuICogYWxsb3dlZCBieSBkZWZhdWx0LilcbiAqIEBwYXJhbSBzdHJpbmcgaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSBib29sZWFuIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCBJZiBzZXQgdG8gdHJ1ZSwgdGhlbiBub3QgZmluZGluZyBhIGhvb2tcbiAqIHdpbGwgYWxzbyB0aHJvdyBhbiBleGNlcHRpb24uXG4gKiBAcmV0dXJuIGpRdWVyeSBPYmplY3QgKENsYW0gSG9vaylcbiAqL1xuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rID0gZnVuY3Rpb24oaG9va05hbWUsIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCkge1xuICAgIHJldHVybiB0aGlzLmdldEhvb2tzKGhvb2tOYW1lLCAxLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpO1xufTtcblxuLyoqXG4gKiBHZXRzIGFueSBudW1iZXIgb2YgalF1ZXJ5IG9iamVjdCAtIGluY2x1ZGluZyBub25lIC0gZnJvbSB0aGUgbW9kdWxlIGNvbnRleHQuXG4gKiBUaGUgZm91bmQgaG9vayB3aWxsIGJlIHNhdmVkLCB1c2luZyB0aGUgaG9va05hbWUgYXMgYSBrZXkuIFRoaXMgd2F5LCBvbmx5IG9uZVxuICogc2VhcmNoIG9jY3VycyBmb3IgYW55IGdpdmVuIGhvb2tOYW1lIGluIHRoZSBET00gdHJlZS5cbiAqIEBwYXJhbSBzdHJpbmcgaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSBpbnQgZXhwZWN0ZWRIb29rTnVtIChvcHRpb25hbCkgRGVmaW5lcyBleGFjdGx5IGhvdyBtYW55IGhvb2sgb2JqZWN0c1xuICogbXVzdCBiZSByZXR1cm5lZCBpbiB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24uIElmIGdpdmVuLCBidXQgdGhlIGZvdW5kIGhvb2tzXG4gKiBjb3VudCBkb2VzIG5vdCBlcXVhbCB0aGF0IG51bWJlciwgdGhlbiBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uIFxuICogQHBhcmFtIGJvb2xlYW4gZW1wdHlSZXN1bHROb3RBbGxvd2VkIElmIHNldCB0byB0cnVlLCB0aGVuIG5vdCBmaW5kaW5nIGhvb2tzXG4gKiB3aWxsIGFsc28gdGhyb3cgYW4gZXhjZXB0aW9uLlxuICogQHJldHVybiBqUXVlcnkgT2JqZWN0IChDbGFtIEhvb2spXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZ2V0SG9va3MgPSBmdW5jdGlvbihob29rTmFtZSwgZXhwZWN0ZWRIb29rTnVtLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMubW9kdWxlLmhvb2tzW2hvb2tOYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaG9va3NbaG9va05hbWVdID0gdGhpcy5maW5kSG9va3MoaG9va05hbWUsIGV4cGVjdGVkSG9va051bSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tb2R1bGUuaG9va3NbaG9va05hbWVdO1xufTtcblxuLyoqXG4gKiBHZXRzIGEgc2luZ2xlIC0gb3Igbm8gLSBob29rIGpRdWVyeSBvYmplY3QgZnJvbSB0aGUgbW9kdWxlIGNvbnRleHQgdXNpbmdcbiAqIGpRdWVyeSBzZWxlY3RvcnMuIFVzZWZ1bCB3aGVuIGhvb2tzIGNhbiBiZSBhZGRlZCBkaW5hbWljYWxseSB0byB0aGUgbW9kdWxlLlxuICogRmluZGluZyBtb3JlIHRoYW4gb25lIGhvb2sgd2lsbCByZXN1bHQgaW4gYW4gZXhjZXB0aW9uLiAoQW4gZW1wdHkgcmVzdWx0IGlzXG4gKiBhbGxvd2VkIGJ5IGRlZmF1bHQuKVxuICogQHBhcmFtIHN0cmluZyBob29rTmFtZSBUaGUgc2VhcmNoZWQgaG9vayBuYW1lLlxuICogQHBhcmFtIGJvb2xlYW4gZW1wdHlSZXN1bHROb3RBbGxvd2VkIElmIHNldCB0byB0cnVlLCB0aGVuIG5vdCBmaW5kaW5nIGEgaG9va1xuICogd2lsbCBhbHNvIHRocm93IGFuIGV4Y2VwdGlvbi5cbiAqIEByZXR1cm4galF1ZXJ5IE9iamVjdCAoQ2xhbSBIb29rKVxuICovXG5Nb2R1bGUucHJvdG90eXBlLmZpbmRIb29rID0gZnVuY3Rpb24oaG9va05hbWUsIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCkge1xuICAgIHJldHVybiB0aGlzLmZpbmRIb29rcyhob29rTmFtZSwgMSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKTtcbn07XG5cblxuLyoqXG4gKiBHZXRzIGFueSBudW1iZXIgb2YgalF1ZXJ5IG9iamVjdCAtIGluY2x1ZGluZyBub25lIC0gZnJvbSB0aGUgbW9kdWxlIGNvbnRleHRcbiAqIHVzaW5nIGpRdWVyeSBzZWxlY3RvcnMuIFVzZWZ1bCB3aGVuIGhvb2tzIGNhbiBiZSBhZGRlZCBkaW5hbWljYWxseSB0byB0aGVcbiAqIG1vZHVsZS5cbiAqIEBwYXJhbSBzdHJpbmcgaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSBpbnQgZXhwZWN0ZWRIb29rTnVtIChvcHRpb25hbCkgRGVmaW5lcyBleGFjdGx5IGhvdyBtYW55IGhvb2sgb2JqZWN0c1xuICogbXVzdCBiZSByZXR1cm5lZCBpbiB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24uIElmIGdpdmVuLCBidXQgdGhlIGZvdW5kIGhvb2tzXG4gKiBjb3VudCBkb2VzIG5vdCBlcXVhbCB0aGF0IG51bWJlciwgdGhlbiBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uIFxuICogQHJldHVybiBqUXVlcnkgT2JqZWN0IChDbGFtIEhvb2spXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZmluZEhvb2tzID0gZnVuY3Rpb24oaG9va05hbWUsIGV4cGVjdGVkSG9va051bSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBob29rQ2xhc3NOYW1lID0gdGhpcy5nZXRIb29rQ2xhc3NOYW1lKGhvb2tOYW1lKTtcbiAgICB2YXIgJGhvb2tzO1xuICAgIHZhciAkaW5Db250ZXh0SG9va3M7XG5cbiAgICBpZiAodGhpcy5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICBpZiAodGhpcy5tb2R1bGUuaGFzR2xvYmFsSG9va3MpIHtcbiAgICAgICAgICAgICRob29rcyA9ICQoJy4nICsgaG9va0NsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkaG9va3MgPSB0aGlzLm1vZHVsZS4kb2JqZWN0LmZpbmQoJy4nICsgaG9va0NsYXNzTmFtZSk7XG5cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGUgbWFpbiBtb2R1bGUgZWxlbWVudCBpZiBpdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZHVsZS4kb2JqZWN0Lmhhc0NsYXNzKGhvb2tDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgJGhvb2tzID0gJGhvb2tzLmFkZCh0aGlzLm1vZHVsZS4kb2JqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEdldHRpbmcgYWxsIGhvb2tzIGluIHRoZSBtb2R1bGUsIGV4Y2x1ZGluZyBvdGhlciBpbnN0YW5jZXMgb2YgdGhlXG4gICAgICAgIC8vIHNhbWUgbW9kdWxlIGluc2lkZSB0aGUgY3VycmVudCBvbmUuXG5cbiAgICAgICAgLy8gQ3JlYXRpbmcgYSBcImRlcHRoQ2xhc3NcIiB0byBleGNsdWRlIHRoZSBzYW1lIHR5cGVzIG9mIG1vZHVsZXMgaW5zaWRlXG4gICAgICAgIC8vIHRoZSBhY3R1YWwgb25lIHdoZW4gc2VhcmNoaW5nIGZvciBhIGhvb2suXG4gICAgICAgIHZhciBkZXB0aENsYXNzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLm1vZHVsZS5kZXB0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGRlcHRoQ2xhc3MucHVzaCgnLicgKyB0aGlzLm1vZHVsZS5jbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgZGVwdGhDbGFzcyA9IGRlcHRoQ2xhc3Muam9pbignICcpO1xuXG4gICAgICAgICRob29rcyA9XG4gICAgICAgICAgICB0aGlzLm1vZHVsZS4kb2JqZWN0XG4gICAgICAgICAgICAuZmluZCgnLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgLy8gRXhjbHVkaW5nIGFsbCBob29rcyBpbnNpZGUgb3RoZXIgbW9kdWxlIGluc3RhbmNlc1xuICAgICAgICAgICAgLm5vdChkZXB0aENsYXNzICsgJyAuJyArIGhvb2tDbGFzc05hbWUpXG4gICAgICAgICAgICAvLyBFeGNsdWRpbmcgYWxsIG90aGVyIG1vZHVsZXMgdGhhdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgICAgIC5ub3QoZGVwdGhDbGFzcyArICcuJyArIGhvb2tDbGFzc05hbWUpO1xuXG4gICAgICAgIC8vIEFkZGluZyBldmVyeSBob29rIG91dHNpZGUgb2YgdGhlIG1vZHVsZSBpbnN0YW5jZXMuXG4gICAgICAgIGlmICh0aGlzLm1vZHVsZS5oYXNHbG9iYWxIb29rcykge1xuICAgICAgICAgICAgdmFyICRnbG9iYWxIb29rcyA9XG4gICAgICAgICAgICAgICAgJCgnLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgICAgIC8vIEV4Y2x1ZGluZyBob29rcyBmcm9tIHdpdGhpbiBtb2R1bGVzXG4gICAgICAgICAgICAgICAgLm5vdCgnLicgKyB0aGlzLm1vZHVsZS5jbGFzcyArICcgLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgICAgIC5ub3QoJy4nICsgdGhpcy5tb2R1bGUuY2xhc3MgKyAnLicgKyBob29rQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoJGdsb2JhbEhvb2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRob29rcyA9ICRob29rcy5hZGQoJGdsb2JhbEhvb2tzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZGluZyB0aGUgbWFpbiBtb2R1bGUgZWxlbWVudCBpZiBpdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlLiRvYmplY3QuaGFzQ2xhc3MoaG9va0NsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICRob29rcyA9ICRob29rcy5hZGQodGhpcy5tb2R1bGUuJG9iamVjdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBleHBlY3RlZEhvb2tOdW0gPT09ICdudW1iZXInICYmXG4gICAgICAgIGV4cGVjdGVkSG9va051bSAhPSAkaG9va3MubGVuZ3RoXG4gICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICRob29rcy5sZW5ndGggIT09IDAgfHxcbiAgICAgICAgICAgIGVtcHR5UmVzdWx0Tm90QWxsb3dlZFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJGhvb2tzKTtcbiAgICAgICAgICAgIHRocm93ICdBbiBpbmNvcnJlY3QgbnVtYmVyIG9mIGhvb2tzIHdlcmUgZm91bmQuIEV4cGVjdGVkOiAnICsgZXhwZWN0ZWRIb29rTnVtICsgJy4gRm91bmQ6ICcgKyAkaG9va3MubGVuZ3RoICsgJy4gSG9vayBuYW1lOiBcIicgKyBob29rQ2xhc3NOYW1lICsgJ1wiJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAkaG9va3M7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmdldEhvb2tDbGFzc05hbWUgPSBmdW5jdGlvbihob29rTmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5jbGFzcyArICdfXycgKyBob29rTmFtZTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuZ2V0RGF0YUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGF0YUNvbmYgPSB0aGlzLm1vZHVsZS4kb2JqZWN0LmRhdGEoY3V0aWwuZ2V0TW9kdWxlQ2xhc3ModGhpcy5tb2R1bGUubmFtZSkpO1xuICAgIGlmICh0eXBlb2YgZGF0YUNvbmYgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRhdGFDb25mID0ge307XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkYXRhQ29uZiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVGhlIGRhdGEtKiBhdHRyaWJ1dGVcXCdzIGNvbnRlbnQgd2FzIG5vdCBhIHZhbGlkIEpTT04uIEZldGNoZWQgdmFsdWU6ICcgKyBkYXRhQ29uZik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGFDb25mO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rQ29uZmlndXJhdGlvbiA9IGZ1bmN0aW9uKCRob29rKSB7XG4gICAgcmV0dXJuICRob29rLmRhdGEodGhpcy5tb2R1bGUuY2xhc3MpO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5leHBvc2UgPSBmdW5jdGlvbihjb250YWluZXJOYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBjb250YWluZXJOYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBjb250YWluZXJOYW1lID0gJ2V4cG9zZWRfbW9kdWxlcyc7XG4gICAgfVxuICAgIFxuICAgIGlmICh0eXBlb2Ygd2luZG93W2NvbnRhaW5lck5hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV0gPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgbW9kdWxlTmFtZSA9IHRoaXMubW9kdWxlLm5hbWUucmVwbGFjZSgvXFwtL2csICdfJyk7XG5cbiAgICBpZiAodGhpcy5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnNvbGUud2FybignRXhwb3NlZCBhczogXCInICsgY29udGFpbmVyTmFtZSArICcuJyArIG1vZHVsZU5hbWUgKyAnXCIuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtb2R1bGVDb3VudCA9IHdpbmRvd1tjb250YWluZXJOYW1lXVttb2R1bGVOYW1lXS5sZW5ndGg7XG5cbiAgICAgICAgd2luZG93W2NvbnRhaW5lck5hbWVdW21vZHVsZU5hbWVdLnB1c2godGhpcyk7XG5cbiAgICAgICAgY29uc29sZS53YXJuKCdFeHBvc2VkIGFzOiBcIicgKyBjb250YWluZXJOYW1lICsgJy4nICsgbW9kdWxlTmFtZSArICdbJyArIG1vZHVsZUNvdW50ICsgJ11cIi4nKTtcbiAgICB9XG59O1xuXG4vLyBFeHBvcnQgbW9kdWxlXG4vLz09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xudmFyIGNvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29udGFpbmVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1vZHVsZUNvbmY6IHtcbiAgICAgICAgcHJlZml4OiAnanNtJ1xuICAgIH0sXG5cbiAgICBtb2RpZmllckNvbmY6IHtcbiAgICAgICAgcHJlZml4OiB7XG4gICAgICAgICAgICBuYW1lOiAnLS0nLFxuICAgICAgICAgICAgdmFsdWU6ICdfJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIENyZWF0ZXMgbW9kdWxlIGluc3RhbmNlcyBmb3IgZXZlcnkgRE9NIGVsZW1lbnQgdGhhdCBoYXMgdGhlIGFwcHJvcHJpYXRlXG4gICAgLy8gbW9kdWxlIGNsYXNzLiBJZiB0aGUgJGNvbnRhaW5lck9iaiBqUXVlcnkgb2JqZWN0IGlzIGdpdmVuIC0gY29udGFpbmluZ1xuICAgIC8vIG9uZSBlbGVtZW50IC0sIHRoZW4gdGhlIGZ1bmN0aW9uIHdpbGwgbG9vayBmb3IgdGhlIG1vZHVsZSBjbGFzc2VzIGluIHRoYXRcbiAgICAvLyBjb250YWluZXIuXG4gICAgY3JlYXRlUHJvdG90eXBlczogZnVuY3Rpb24obW9kdWxlLCBjb25maWcsICRjb250YWluZXJPYmopIHtcbiAgICAgICAgLy8gR2V0dGluZyB0aGUgbW9kdWxlIG5hbWUsIHRvIHNlbGVjdCB0aGUgRE9NIGVsZW1lbnRzLlxuICAgICAgICB2YXIgbW9kdWxlTmFtZSA9IHRoaXMuZ2V0TW9kdWxlTmFtZShtb2R1bGUpO1xuICAgICAgICB2YXIgbW9kdWxlQ2xhc3MgPSB0aGlzLmdldE1vZHVsZUNsYXNzKG1vZHVsZU5hbWUpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBjb25maWcgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAhY29uZmlnIC8vIGZhbHN5IHZhbHVlc1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbmZpZyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGFwcHJvcHJpYXRlIG1vZHVsZSBET00gb2JqZWN0c1xuICAgICAgICB2YXIgJG1vZHVsZXMgPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mICRjb250YWluZXJPYmogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRjb250YWluZXJPYmopO1xuICAgICAgICAgICAgJG1vZHVsZXMgPSAkY29udGFpbmVyT2JqLmZpbmQoJy4nICsgbW9kdWxlQ2xhc3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJG1vZHVsZXMgPSAkKCcuJyArIG1vZHVsZUNsYXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBtb2R1bGUgaW5zdGFuY2VzXG4gICAgICAgIHZhciBpbnN0YW5jZXMgPSBbXTtcbiAgICAgICAgaWYgKCRtb2R1bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICRtb2R1bGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzLnB1c2gobmV3IG1vZHVsZSgkKHRoaXMpLCBjb25maWcpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA9PSAxICYmIGluc3RhbmNlc1swXS5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlcyA9IGluc3RhbmNlc1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29udGFpbmVyLmFkZChpbnN0YW5jZXMpO1xuXG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8vIEdldCdzIGEgbW9kdWwncyBuYW1lIGZyb20gaXQncyBkZWZpbml0aW9uLCBvciBmcm9tIGEgcHJvdG90eXBlXG4gICAgZ2V0TW9kdWxlTmFtZTogZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgICAgIHZhciBmdW5jRGVmID0gdHlwZW9mIG1vZHVsZSA9PT0gJ2Z1bmN0aW9uJyA/IFN0cmluZyhtb2R1bGUpIDogU3RyaW5nKG1vZHVsZS5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIHZhciBmdW5jTmFtZSA9IGZ1bmNEZWYuc3Vic3RyKCdmdW5jdGlvbiAnLmxlbmd0aCk7XG4gICAgICAgIGZ1bmNOYW1lID0gZnVuY05hbWUuc3Vic3RyKDAsIGZ1bmNOYW1lLmluZGV4T2YoJygnKSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmNOYW1lLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBjb2xsZWN0aW9uIGlzIGEgdmFsaWQgalF1ZXJ5IG9iamVjdCBvciBub3QuXG4gICAgLy8gSWYgdGhlIGNvbGxlY3Rpb25TaXplIChpbnRlZ2VyKSBwYXJhbWV0ZXIgaXMgc3BlY2lmaWVkLCB0aGVuIHRoZVxuICAgIC8vIGNvbGxlY3Rpb24ncyBzaXplIHdpbGwgYmUgdmFsaWRhdGVkIGFjY29yZGluZ2x5LlxuICAgIHZhbGlkYXRlSlF1ZXJ5T2JqZWN0OiBmdW5jdGlvbigkY29sbGVjdGlvbiwgY29sbGVjdGlvblNpemUpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIGNvbGxlY3Rpb25TaXplICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbGxlY3Rpb25TaXplICE9PSAnbnVtYmVyJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93ICdUaGUgZ2l2ZW4gXCJjb2xsZWN0aW9uU2l6ZVwiIHBhcmFtZXRlciBmb3IgdGhlIGpRdWVyeSBjb2xsZWN0aW9uIHZhbGlkYXRpb24gd2FzIG5vdCBhIG51bWJlci4gUGFzc2VkIHZhbHVlOiAnICsgY29sbGVjdGlvblNpemUgKyAnLCB0eXBlOiAnICsgKHR5cGVvZiBjb2xsZWN0aW9uU2l6ZSkgKyAnLic7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICgkY29sbGVjdGlvbiBpbnN0YW5jZW9mIGpRdWVyeSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRocm93ICdUaGlzIGlzIG5vdCBhIGpRdWVyeSBPYmplY3QuIFBhc3NlZCB0eXBlOiAnICsgKHR5cGVvZiAkY29sbGVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgY29sbGVjdGlvblNpemUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAkY29sbGVjdGlvbi5sZW5ndGggIT0gY29sbGVjdGlvblNpemVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyAnVGhlIGdpdmVuIGpRdWVyeSBjb2xsZWN0aW9uIGNvbnRhaW5zIGFuIHVuZXhwZWN0ZWQgbnVtYmVyIG9mIGVsZW1lbnRzLiBFeHBlY3RlZDogJyArIGNvbGxlY3Rpb25TaXplICsgJywgZ2l2ZW46ICcgKyAkY29sbGVjdGlvbi5sZW5ndGggKyAnLic7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdWNmaXJzdDogZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc3Vic3RyKDEpO1xuICAgIH0sXG5cbiAgICBnZXRNb2R1bGVDbGFzczogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVDb25mLnByZWZpeCArICctJyArIG5hbWU7XG4gICAgfSxcblxuICAgIGdldE1vZGlmaWVyQ2xhc3M6IGZ1bmN0aW9uKGJhc2VOYW1lLCBtb2RpZmllck5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLm1vZGlmaWVyQ29uZi5wcmVmaXgudmFsdWUgKyB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBiYXNlTmFtZSArIHRoaXMubW9kaWZpZXJDb25mLnByZWZpeC5uYW1lICsgbW9kaWZpZXJOYW1lICsgdmFsdWU7XG4gICAgfSxcblxuICAgIGdldENsYXNzZXNCeVByZWZpeDogZnVuY3Rpb24ocHJlZml4LCAkalFPYmopIHtcbiAgICAgICAgdmFyIGNsYXNzZXMgPSAkalFPYmouYXR0cignY2xhc3MnKTtcbiAgICAgICAgaWYgKCFjbGFzc2VzKSB7IC8vIGlmIFwiZmFsc3lcIiwgZm9yIGV4OiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlcy5zcGxpdCgnICcpO1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IG5ldyBSZWdFeHAoJ14oJyArIHByZWZpeCArICcpKC4qKScpLmV4ZWMoY2xhc3Nlc1tpXSk7XG4gICAgICAgICAgICBpZiAobWF0Y2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaFswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICB9LFxuXG4gICAgcmVtb3ZlQ2xhc3Nlc0J5UHJlZml4OiBmdW5jdGlvbihwcmVmaXgsICRqUU9iaikge1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IHRoaXMuZ2V0Q2xhc3Nlc0J5UHJlZml4KHByZWZpeCwgJGpRT2JqKTtcbiAgICAgICAgbWF0Y2hlcyA9IG1hdGNoZXMuam9pbignICcpO1xuICAgICAgICAkalFPYmoucmVtb3ZlQ2xhc3MobWF0Y2hlcyk7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjdXRpbCA9IHJlcXVpcmUoJ2NsYW0vY29yZS91dGlsJyk7XG52YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XG52YXIgbW9kaWZpZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kaWZpZXInKTtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0cztcbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xuXG52YXIgc2V0dGluZ3MgPSB7XG4gICAgY29uZjoge1xuICAgICAgICBoaWdobGlnaHRWYWx1ZTogdHJ1ZVxuICAgIH0sXG4gICAgaGFzR2xvYmFsSG9va3M6IHRydWVcbn07XG5cbnZhciBnbG9iYWxDb3VudCA9IDA7XG5cbmZ1bmN0aW9uIEhpZ2hsaWdodGVyKCRqUU9iaiwgY29uZikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBjbGFtX21vZHVsZS5hcHBseSh0aGlzLCBbJGpRT2JqLCBzZXR0aW5ncywgY29uZl0pO1xuICAgIHRoaXMuZXhwb3NlKCk7XG5cbiAgICB0aGlzLmxvY2FsQ291bnQgPSAwO1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcblxuICAgIHRoaXMuZ2V0SG9vaygnaGlnaGxpZ2h0Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBzZWxmLnRvZ2dsZUhpZ2hsaWdodCgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5oaWdobGlnaHRNb2QgPSBuZXcgbW9kaWZpZXIoXG4gICAgICAgIHRoaXMuZ2V0SG9vaygnaGlnaGxpZ2h0JyksXG4gICAgICAgIHRoaXMubW9kdWxlLm5hbWVcbiAgICApO1xufVxuXG5pbmhlcml0cyhIaWdobGlnaHRlciwgY2xhbV9tb2R1bGUpO1xuXG5IaWdobGlnaHRlci5wcm90b3R5cGUudG9nZ2xlSGlnaGxpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5nZXRIb29rKCdnbG9iYWwtY291bnRlcicpLnRleHQoKytnbG9iYWxDb3VudCk7XG4gICAgdGhpcy5nZXRIb29rKCdsb2NhbC1jb3VudGVyJykudGV4dCgrK3RoaXMubG9jYWxDb3VudCk7XG5cbiAgICBpZiAodGhpcy5oaWdobGlnaHRNb2QuZ2V0KCdoaWdobGlnaHQnKSkge1xuICAgICAgICB0aGlzLmhpZ2hsaWdodE1vZC5vZmYoJ2hpZ2hsaWdodCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0TW9kLnNldCgnaGlnaGxpZ2h0JywgdGhpcy5tb2R1bGUuY29uZi5oaWdobGlnaHRWYWx1ZSk7XG4gICAgfVxufTtcblxuSGlnaGxpZ2h0ZXIucHJvdG90eXBlLmluYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmhpZ2hsaWdodE1vZC5zZXQoJ2luYWN0aXZlJywgdHJ1ZSk7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbn07XG5cbkhpZ2hsaWdodGVyLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGlnaGxpZ2h0TW9kLnNldCgnaW5hY3RpdmUnLCBmYWxzZSk7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlcjtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjdXRpbCA9IHJlcXVpcmUoJ2NsYW0vY29yZS91dGlsJyk7XG52YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XG52YXIgY2xhbV9jb250YWluZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvY29udGFpbmVyJyk7XG52YXIgaGlnaGxpZ2h0ZXIgPSByZXF1aXJlKCcuL2hpZ2hsaWdodGVyJyk7XG4vL3ZhciBtb2RpZmllciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2RpZmllcicpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzO1xuXG52YXIgc2V0dGluZ3MgPSB7XG4gICAgdHlwZTogJ3NpbmdsZXRvbicsXG4gICAgLy8gaGFzR2xvYmFsSG9va3M6IHRydWUsXG4gICAgY29uZjoge31cbn07XG5cbmZ1bmN0aW9uIEhpZ2hsaWdodGVyQ3JlYXRvcigkalFPYmosIGNvbmYpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgY2xhbV9tb2R1bGUuYXBwbHkodGhpcywgWyRqUU9iaiwgc2V0dGluZ3MsIGNvbmZdKTtcbiAgICB0aGlzLmV4cG9zZSgpO1xuICAgIC8vIHRocm93IHRoaXMucHJldHRpZnkoJ2Vycm9yJyk7XG4gICAgXG4gICAgdGhpcy5hbGxBY3RpdmF0ZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuZ2V0SG9vaygnYWN0aXZhdGUtYnRuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBzZWxmLmFjdGl2YXRlKCk7XG4gICAgfSk7XG59XG5cbmluaGVyaXRzKEhpZ2hsaWdodGVyQ3JlYXRvciwgY2xhbV9tb2R1bGUpO1xuXG5IaWdobGlnaHRlckNyZWF0b3IucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuYWxsQWN0aXZhdGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5hbGxBY3RpdmF0ZWQgPSB0cnVlO1xuXG4gICAgY2xhbV9jb250YWluZXIuZ2V0KCdtZXNzYWdlJykubWVzc2FnZSgnU3VjY2Vzc2Z1bCBtb2R1bCBhY3RpdmF0aW9uIScpO1xuXG4gICAgdGhpcy5nZXRIb29rKCdhY3RpdmF0ZS1idG4nKS5mYWRlT3V0KCczMDAnKTtcblxuICAgIHZhciBwcm90b3R5cGVzID0gY3V0aWwuY3JlYXRlUHJvdG90eXBlcyhoaWdobGlnaHRlciwge30sICQoJyNoaWdobGlnaHRlci0yJykpO1xuICAgICQuZWFjaChwcm90b3R5cGVzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5hY3RpdmF0ZSgpO1xuICAgIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlckNyZWF0b3I7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XG4vL3ZhciBjbGFtX21vZHVsZSA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2R1bGUnKTtcbi8vdmFyIGNsYW1fY29udGFpbmVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL2NvbnRhaW5lcicpO1xudmFyIG1vZGlmaWVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZGlmaWVyJyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XG5cbnZhciBzZXR0aW5ncyA9IHtcbiAgICB0eXBlOiAnc2luZ2xldG9uJyxcbiAgICBoYXNHbG9iYWxIb29rczogdHJ1ZSxcbiAgICBjb25mOiB7XG4gICAgICAgIGZhZGVPdXRUaW1lOiA1MDBcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBNZXNzYWdlKCRqUU9iaiwgY29uZikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBjbGFtX21vZHVsZS5hcHBseSh0aGlzLCBbJGpRT2JqLCBzZXR0aW5ncywgY29uZl0pO1xuICAgIHRoaXMuZXhwb3NlKCk7XG4gICAgLy8gdGhyb3cgdGhpcy5wcmV0dGlmeSgnZXJyb3InKTtcbiAgICAvLyBjbGFtX2NvbnRhaW5lci5nZXQoJ2NsYW0tbW9kdWxlJyk7XG5cbiAgICB0aGlzLm1lc3NhZ2VNb2QgPSBuZXcgbW9kaWZpZXIoXG4gICAgICAgIHRoaXMubW9kdWxlLiRvYmplY3QsXG4gICAgICAgIHRoaXMubW9kdWxlLm5hbWVcbiAgICApO1xuXG4gICAgdGhpcy5pc09wZW4gPSAhIXRoaXMubWVzc2FnZU1vZC5nZXQoJ3R5cGUnKTtcbiAgICBcbiAgICB0aGlzLmdldEhvb2tzKCd0ZXN0LWJ0bicpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgJCh0aGlzKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYudGVzdENsaWNrKCQodGhpcykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLmdldEhvb2tzKCdjbG9zZS1idG4nKS5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICBzZWxmLmNsb3NlKCk7XG4gICAgfSk7XG59XG5cbmluaGVyaXRzKE1lc3NhZ2UsIGNsYW1fbW9kdWxlKTtcblxuTWVzc2FnZS5wcm90b3R5cGUubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHR5cGUpIHtcbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHR5cGUgPSAnc3VjY2Vzcyc7XG4gICAgfVxuXG4gICAgdGhpcy5tZXNzYWdlTW9kLnNldCgndHlwZScsIHR5cGUpO1xuICAgIHRoaXMuZ2V0SG9vaygnbWVzc2FnZScpLnRleHQobWVzc2FnZSk7XG5cbiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICAgIHRoaXMubW9kdWxlLiRvYmplY3QuZmFkZUluKDMwMCk7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcbiAgICB9XG59O1xuXG5NZXNzYWdlLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHR5cGUpIHtcbiAgICB0aGlzLm1vZHVsZS4kb2JqZWN0LmZhZGVPdXQoMzAwKTtcbn07XG5cbk1lc3NhZ2UucHJvdG90eXBlLnRlc3RDbGljayA9IGZ1bmN0aW9uKCRob29rKSB7XG4gICAgdmFyIGNvbmYgPSB0aGlzLmdldEhvb2tDb25maWd1cmF0aW9uKCRob29rKTtcbiAgICB0aGlzLm1lc3NhZ2UoY29uZi5tZXNzYWdlLCBjb25mLnR5cGUpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlO1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5NdXRhdGlvbk9ic2VydmVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcblxuICAgIGlmIChjYW5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgIHZhciBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWVMaXN0ID0gcXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBxdWV1ZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoaGlkZGVuRGl2LCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGhpZGRlbkRpdi5zZXRBdHRyaWJ1dGUoJ3llcycsICdubycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiJdfQ==
