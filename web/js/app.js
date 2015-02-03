(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var clam_container = require('clam/core/container');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var highlighter = require('./clam_module/highlighter');
var dynamic_ext = require('./clam_module/dynamic_ext');
var dynamic_config = require('./conf/dynamic_config');
var message = require('./clam_module/message');
var highlighter_activator = require('./clam_module/highlighter_activator');
var clam_scroller = require('clam-scroller/module/scroller');

clam_container.expose();

cutil.createPrototypes(message, {fadeOutTime: 300});
cutil.createPrototypes(highlighter, {}, $('#highlighter-1'));
cutil.createPrototypes(highlighter_activator);
cutil.createPrototypes(clam_scroller);
cutil.createPrototypes(dynamic_ext, dynamic_config);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./clam_module/dynamic_ext":8,"./clam_module/highlighter":9,"./clam_module/highlighter_activator":10,"./clam_module/message":11,"./conf/dynamic_config":12,"clam-scroller/module/scroller":2,"clam/core/container":3,"clam/core/module":5,"clam/core/util":6}],2:[function(require,module,exports){
(function (global){
var clam_module = require('clam/core/module');
var inherits = require('util').inherits;
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

var settings = {
    // type: 'singleton',
    conf: {
        scrollSpeed: 300
    }
};

function Scroller($jQObj, conf) {
    clam_module.apply(this, [$jQObj, settings, conf]);
    // var self = this;
    // this.expose();

    $scrollerHook = this.getHook('scroll');
    $scrollerHook.on('click', $.proxy(this.onScrollClick, this, $scrollerHook));
}

inherits(Scroller, clam_module);

Scroller.prototype.onScrollClick = function($hook, e) {
    e.preventDefault();
    var hookConf = this.getHookConfiguration($hook);
    if (typeof hookConf.offset === 'undefined') {
        hookConf.offset = 0;
    }

    var $scrollToElement = $('#' + hookConf.targetID);
    if ($scrollToElement.length == 0) {
        return;
    }

    $('html, body').animate({
        scrollTop: $scrollToElement.offset().top + hookConf.offset
    }, this.module.conf.scrollSpeed);
};

module.exports = Scroller;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"clam/core/module":5,"util":16}],3:[function(require,module,exports){
(function (global){
'use strict';
/**
 * The module container.
 * @module container
 */
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

module.exports = {
    modules: {},

    /**
     * Adding a clam module to the container.
     * @param {ClamModule} clam_module A clam module. 
     * @throws If a module is already registered in the container with the given
     * name.
     */
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

    /**
     * Gets a module by it's name.
     * @param {string} moduleName The module's name.
     * @throws If no module is registered in the container with the given name.
     * @return {ClamModule}
     */
    get: function(moduleName) {
        if (typeof this.modules[moduleName] === 'undefined') {
            throw 'Nothing is set under the "' + moduleName + '" key in the container.';
        }

        return this.modules[moduleName];
    },

    /**
     * Exposes the container to the global scope.
     */
    expose: function() {
        window.container = this;
        console.warn('The clam container is now exposed as "container".');
    }
    // ,

    // removeModule: function(module) {
    //     console.log(this.modules[module.module.name]);
    //     var modulesLength = this.modules[module.module.name].length;
    //     for (var i = modulesLength - 1; i >= 0; i--) {
    //         if (this.modules[module.module.name][i] === module) {
    //             console.log(this.modules[module.module.name][i]);
    //             delete this.modules[module.module.name][i];
    //             return;
    //         }
    //     }
    // },

    // clean: function(moduleName) {
    //     if (typeof this.modules[moduleName] === 'undefined') {
    //         return true;
    //     }


    //     if ($.isArray(this.modules[moduleName])) {
    //         var modulesLength = this.modules[moduleName].length;
    //         for (var i = modulesLength - 1; i >= 0; i--) {
    //             if (!$.contains(window.document, this.modules[moduleName][i].module.$object[0])) {
    //                 delete this.modules[moduleName][i];
    //             }
    //         }
    //     } else {
    //         if (!$.contains(window.document, this.modules[moduleName].module.$object[0])) {
    //             delete this.modules[moduleName];
    //         }
    //     }
    // }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],4:[function(require,module,exports){
'use strict';
var cutil = require('./util');

/**
 * @constructor
 * @param {jQuery} $object A jQuery object with a length of exactly 1.
 * @param {string} name The modifier's base name. (ex.: block or element's name.)
 * @param {string} [prefix] A prefix. Default is: cutil.notation.modifier.prefix.
 * @throws If the jQuery object contains no or more than one elements.
 */
function Modifier($object, name, prefix) {
    if (typeof prefix !== 'string') {
        prefix = cutil.notation.modifier.prefix;
    }

    // Attributes
    this.modifier = {
        $object: $object,
        prefix: prefix,
        name: name,
        prefixedName: cutil.notation.modifier.prefix + name
    };

    try {
        cutil.validateJQueryObject($object, 1);
    } catch (e) {
        throw '[modifier: "' + name + '"]' + e;
    }
}

/**
 * Switches on a modifier.
 * @param  {string} name The modifier's name.
 * @return {Modifier} Returns the Modifier's reference.
 */
Modifier.prototype.on = function(name) {
    return this.set(name, true);
};

/**
 * Switches off a modifier.
 * @param {string} name The modifier's name.
 * @return {Modifier} Returns the Modifier's reference.
 */
Modifier.prototype.off = function(name) {
    return this.set(name, false);
};

/**
 * Toggles a modifier.
 * @param {string} name The modifier's name.
 * @return {Modifier} Returns the Modifier's reference.
 */
Modifier.prototype.toggle = function(name) {
    if (this.get(name)) {
        return this.set(name, false);
    }

    return this.set(name, true);
};

/**
 * Get's the value of a modifier.
 * @param {string} name The modifier's name.
 * @return {string} Returns the value.
 */
Modifier.prototype.get = function(name) {
    var modPrefix = this.typeID;
    var modifierClass = cutil.getModifierClass(this.modifier.prefixedName, name);

    var classes = cutil.getClassesByPrefix(modifierClass, this.modifier.$object);
    // Modifier not found
    if (classes.length === 0) {
        return false;
    }

    var value = classes[0].split(cutil.notation.modifier.valueSeparator);

    // Modifier found, but doesn't have a specific value
    if (typeof value[1] == 'undefined') {
        return true;
    }

    // Modifier found with a value
    return value[1];
};

/**
 * Set's a modifier to a given value.
 * @param {string} name The modifier's name.
 * @param {string} value The modifier's value.
 * @return {Modifier} Returns the Modifier's reference.
 */
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

module.exports = Modifier;

},{"./util":6}],5:[function(require,module,exports){
(function (global){
'use strict';
var cutil = require('./util');
var clam_container = require('./container');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * @constructor
 * @param {jQuery} $object A jQuery object with a length of 1. It must have
 * the module's classname.
 * @param {Object} [settings] The Module settings. (Example keys: "type",
 * "hasGlobalHooks", "conf".)
 * @param {Object} [conf] The configuration Object.
 */
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
// Module.prototype.destroy = function(removeDOM) {
//     if (removeDOM) {
//         this.module.$object.remove();
//     }

//     clam_container.removeModule(this);
//     // clam_container.clean(this.module.name);
// };

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

    return this.module.events[eventName].apply(this, args);
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
 * @param {string} hookName The searched hook name.
 * @param {boolean} [emptyResultNotAllowed] If set to true, then not finding a hook
 * will also throw an exception.
 * @return {jQuery} Clam hook.
 */
Module.prototype.getHook = function(hookName, emptyResultNotAllowed) {
    return this.getHooks(hookName, 1, emptyResultNotAllowed);
};

/**
 * Gets any number of jQuery object - including none - from the module context.
 * The found hook will be saved, using the hookName as a key. This way, only one
 * search occurs for any given hookName in the DOM tree.
 * @param {string} hookName The searched hook name.
 * @param {int} [expectedHookNum] (optional) Defines exactly how many hook objects
 * must be returned in the jQuery collection. If given, but the found hooks
 * count does not equal that number, then an exception will be thrown. 
 * @param boolean [emptyResultNotAllowed] If set to true, then not finding hooks
 * will also throw an exception.
 * @return {jQuery} Clam hook.
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
 * @param {string} hookName The searched hook name.
 * @param {boolean} [emptyResultNotAllowed] If set to true, then not finding a hook
 * will also throw an exception.
 * @return {jQuery} Clam hook.
 */
Module.prototype.findHook = function(hookName, emptyResultNotAllowed) {
    return this.findHooks(hookName, 1, emptyResultNotAllowed);
};


/**
 * Gets any number of jQuery object - including none - from the module context
 * using jQuery selectors. Useful when hooks can be added dinamically to the
 * module.
 * @param {string} hookName The searched hook name.
 * @param {int} [expectedHookNum] (optional) Defines exactly how many hook objects
 * must be returned in the jQuery collection. If given, but the found hooks
 * count does not equal that number, then an exception will be thrown.
 * @param {boolean} [emptyResultNotAllowed] If set to true, then not finding a hook
 * will also throw an exception.
 * @return {jQuery} Clam hook.
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
    return this.module.class + cutil.notation.module.separator + hookName;
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

},{"./container":3,"./util":6}],6:[function(require,module,exports){
(function (global){
'use strict';
/**
 * The clam utility module.
 * @module util
 */
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var container = require('./container');

module.exports = {
    notation: {
        module: {
            prefix: 'jsm-',
            separator: '__'
        },

        modifier: {
            prefix: 'b-',
            elementSeparator: '__',
            modifierSeparator: '--',
            valueSeparator: '_'
        }
    },

    
    /**
     * Creates module instances for every DOM element that has the appropriate
     * module class. If the $containerObj jQuery object is given then the
     * function will look for the module classes in that container.
     * @param  {ClamModule} module A clam module.
     * @param  {Object} [config] A configuration object.
     * @param  {jQuery} [$containerObj] The container object.
     * @return {array|ClamModule|null} Returns an array of created instances or
     * a single instance, or null.
     */
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
        return this.notation.module.prefix + name;
    },

    getModifierClass: function(baseName, modifierName, value) {
        if (typeof value !== 'string') {
            value = '';
        } else {
            value = this.notation.modifier.valueSeparator + value;
        }

        return baseName + this.notation.modifier.modifierSeparator + modifierName + value;
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

},{"./container":3}],7:[function(require,module,exports){
(function (global){
'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;
var dynamic_config = require('../conf/dynamic_config');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../conf/dynamic_config":12,"clam/core/modifier":4,"clam/core/module":5,"clam/core/util":6,"util":16}],8:[function(require,module,exports){
(function (global){
'use strict';
var cutil = require('clam/core/util');
var clam_module = require('clam/core/module');
var modifier = require('clam/core/modifier');
var inherits = require('util').inherits;
var dynamic_config = require('../conf/dynamic_config');
var dynamic = require('./dynamic');
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../conf/dynamic_config":12,"./dynamic":7,"clam/core/modifier":4,"clam/core/module":5,"clam/core/util":6,"util":16}],9:[function(require,module,exports){
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

},{"clam/core/modifier":4,"clam/core/module":5,"clam/core/util":6,"util":16}],10:[function(require,module,exports){
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

},{"./highlighter":9,"clam/core/container":3,"clam/core/module":5,"clam/core/util":6,"util":16}],11:[function(require,module,exports){
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

},{"clam/core/modifier":4,"clam/core/module":5,"util":16}],12:[function(require,module,exports){
// Configuration for the dynamic.js module. Since some prototypes are
// instantiated in the app.js and also in the module itself later on,
// I saved the configuration, so that I don't have to update it at two
// different if changes were needed.
// To experiment, just change one of the values from true to false.
module.exports = {
    allowAddSibling: true,
    allowAddEmbedded: true
};

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],16:[function(require,module,exports){
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

},{"./support/isBuffer":15,"_process":14,"inherits":13}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJmcm9udF9zcmMvc2NyaXB0cy9hcHAuanMiLCJmcm9udF9zcmMvYm93ZXJfY29tcG9uZW50cy9jbGFtLXNjcm9sbGVyL21vZHVsZS9zY3JvbGxlci5qcyIsImZyb250X3NyYy9ib3dlcl9jb21wb25lbnRzL2NsYW0vY29yZS9jb250YWluZXIuanMiLCJmcm9udF9zcmMvYm93ZXJfY29tcG9uZW50cy9jbGFtL2NvcmUvbW9kaWZpZXIuanMiLCJmcm9udF9zcmMvYm93ZXJfY29tcG9uZW50cy9jbGFtL2NvcmUvbW9kdWxlLmpzIiwiZnJvbnRfc3JjL2Jvd2VyX2NvbXBvbmVudHMvY2xhbS9jb3JlL3V0aWwuanMiLCJmcm9udF9zcmMvc2NyaXB0cy9jbGFtX21vZHVsZS9keW5hbWljLmpzIiwiZnJvbnRfc3JjL3NjcmlwdHMvY2xhbV9tb2R1bGUvZHluYW1pY19leHQuanMiLCJmcm9udF9zcmMvc2NyaXB0cy9jbGFtX21vZHVsZS9oaWdobGlnaHRlci5qcyIsImZyb250X3NyYy9zY3JpcHRzL2NsYW1fbW9kdWxlL2hpZ2hsaWdodGVyX2FjdGl2YXRvci5qcyIsImZyb250X3NyYy9zY3JpcHRzL2NsYW1fbW9kdWxlL21lc3NhZ2UuanMiLCJmcm9udF9zcmMvc2NyaXB0cy9jb25mL2R5bmFtaWNfY29uZmlnLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDOVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xudmFyIGNsYW1fY29udGFpbmVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL2NvbnRhaW5lcicpO1xudmFyICQgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy4kIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC4kIDogbnVsbCk7XG52YXIgaGlnaGxpZ2h0ZXIgPSByZXF1aXJlKCcuL2NsYW1fbW9kdWxlL2hpZ2hsaWdodGVyJyk7XG52YXIgZHluYW1pY19leHQgPSByZXF1aXJlKCcuL2NsYW1fbW9kdWxlL2R5bmFtaWNfZXh0Jyk7XG52YXIgZHluYW1pY19jb25maWcgPSByZXF1aXJlKCcuL2NvbmYvZHluYW1pY19jb25maWcnKTtcbnZhciBtZXNzYWdlID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9tZXNzYWdlJyk7XG52YXIgaGlnaGxpZ2h0ZXJfYWN0aXZhdG9yID0gcmVxdWlyZSgnLi9jbGFtX21vZHVsZS9oaWdobGlnaHRlcl9hY3RpdmF0b3InKTtcbnZhciBjbGFtX3Njcm9sbGVyID0gcmVxdWlyZSgnY2xhbS1zY3JvbGxlci9tb2R1bGUvc2Nyb2xsZXInKTtcblxuY2xhbV9jb250YWluZXIuZXhwb3NlKCk7XG5cbmN1dGlsLmNyZWF0ZVByb3RvdHlwZXMobWVzc2FnZSwge2ZhZGVPdXRUaW1lOiAzMDB9KTtcbmN1dGlsLmNyZWF0ZVByb3RvdHlwZXMoaGlnaGxpZ2h0ZXIsIHt9LCAkKCcjaGlnaGxpZ2h0ZXItMScpKTtcbmN1dGlsLmNyZWF0ZVByb3RvdHlwZXMoaGlnaGxpZ2h0ZXJfYWN0aXZhdG9yKTtcbmN1dGlsLmNyZWF0ZVByb3RvdHlwZXMoY2xhbV9zY3JvbGxlcik7XG5jdXRpbC5jcmVhdGVQcm90b3R5cGVzKGR5bmFtaWNfZXh0LCBkeW5hbWljX2NvbmZpZyk7XG4iLCJ2YXIgY2xhbV9tb2R1bGUgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kdWxlJyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcblxudmFyIHNldHRpbmdzID0ge1xuICAgIC8vIHR5cGU6ICdzaW5nbGV0b24nLFxuICAgIGNvbmY6IHtcbiAgICAgICAgc2Nyb2xsU3BlZWQ6IDMwMFxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIFNjcm9sbGVyKCRqUU9iaiwgY29uZikge1xuICAgIGNsYW1fbW9kdWxlLmFwcGx5KHRoaXMsIFskalFPYmosIHNldHRpbmdzLCBjb25mXSk7XG4gICAgLy8gdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIHRoaXMuZXhwb3NlKCk7XG5cbiAgICAkc2Nyb2xsZXJIb29rID0gdGhpcy5nZXRIb29rKCdzY3JvbGwnKTtcbiAgICAkc2Nyb2xsZXJIb29rLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblNjcm9sbENsaWNrLCB0aGlzLCAkc2Nyb2xsZXJIb29rKSk7XG59XG5cbmluaGVyaXRzKFNjcm9sbGVyLCBjbGFtX21vZHVsZSk7XG5cblNjcm9sbGVyLnByb3RvdHlwZS5vblNjcm9sbENsaWNrID0gZnVuY3Rpb24oJGhvb2ssIGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIGhvb2tDb25mID0gdGhpcy5nZXRIb29rQ29uZmlndXJhdGlvbigkaG9vayk7XG4gICAgaWYgKHR5cGVvZiBob29rQ29uZi5vZmZzZXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGhvb2tDb25mLm9mZnNldCA9IDA7XG4gICAgfVxuXG4gICAgdmFyICRzY3JvbGxUb0VsZW1lbnQgPSAkKCcjJyArIGhvb2tDb25mLnRhcmdldElEKTtcbiAgICBpZiAoJHNjcm9sbFRvRWxlbWVudC5sZW5ndGggPT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxUb3A6ICRzY3JvbGxUb0VsZW1lbnQub2Zmc2V0KCkudG9wICsgaG9va0NvbmYub2Zmc2V0XG4gICAgfSwgdGhpcy5tb2R1bGUuY29uZi5zY3JvbGxTcGVlZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcm9sbGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBUaGUgbW9kdWxlIGNvbnRhaW5lci5cbiAqIEBtb2R1bGUgY29udGFpbmVyXG4gKi9cbnZhciAkID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuJCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuJCA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtb2R1bGVzOiB7fSxcblxuICAgIC8qKlxuICAgICAqIEFkZGluZyBhIGNsYW0gbW9kdWxlIHRvIHRoZSBjb250YWluZXIuXG4gICAgICogQHBhcmFtIHtDbGFtTW9kdWxlfSBjbGFtX21vZHVsZSBBIGNsYW0gbW9kdWxlLiBcbiAgICAgKiBAdGhyb3dzIElmIGEgbW9kdWxlIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGFpbmVyIHdpdGggdGhlIGdpdmVuXG4gICAgICogbmFtZS5cbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKGNsYW1fbW9kdWxlKSB7XG4gICAgICAgIHZhciBtb2R1bGVOYW1lO1xuICAgICAgICBpZiAoJC5pc0FycmF5KGNsYW1fbW9kdWxlKSkge1xuICAgICAgICAgICAgbW9kdWxlTmFtZSA9IGNsYW1fbW9kdWxlWzBdLm1vZHVsZS5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlTmFtZSA9IGNsYW1fbW9kdWxlLm1vZHVsZS5uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAoJC5pc0FycmF5KHRoaXMubW9kdWxlc1ttb2R1bGVOYW1lXSkgJiYgJC5pc0FycmF5KGNsYW1fbW9kdWxlKSkge1xuICAgICAgICAgICAgICAgICQubWVyZ2UodGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdLCBjbGFtX21vZHVsZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdUaGUgXCInICsgbW9kdWxlTmFtZSArICdcIiBrZXkgaXMgYWxyZWFkeSBzZXQgaW4gdGhlIGNvbnRhaW5lci4gQWRkaW5nIHRoZSBtb2R1bGUgdG8gdGhlIGNvbnRhaW5lciBmYWlsZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW9kdWxlc1ttb2R1bGVOYW1lXSA9IGNsYW1fbW9kdWxlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldHMgYSBtb2R1bGUgYnkgaXQncyBuYW1lLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lIFRoZSBtb2R1bGUncyBuYW1lLlxuICAgICAqIEB0aHJvd3MgSWYgbm8gbW9kdWxlIGlzIHJlZ2lzdGVyZWQgaW4gdGhlIGNvbnRhaW5lciB3aXRoIHRoZSBnaXZlbiBuYW1lLlxuICAgICAqIEByZXR1cm4ge0NsYW1Nb2R1bGV9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbihtb2R1bGVOYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgJ05vdGhpbmcgaXMgc2V0IHVuZGVyIHRoZSBcIicgKyBtb2R1bGVOYW1lICsgJ1wiIGtleSBpbiB0aGUgY29udGFpbmVyLic7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFeHBvc2VzIHRoZSBjb250YWluZXIgdG8gdGhlIGdsb2JhbCBzY29wZS5cbiAgICAgKi9cbiAgICBleHBvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuY29udGFpbmVyID0gdGhpcztcbiAgICAgICAgY29uc29sZS53YXJuKCdUaGUgY2xhbSBjb250YWluZXIgaXMgbm93IGV4cG9zZWQgYXMgXCJjb250YWluZXJcIi4nKTtcbiAgICB9XG4gICAgLy8gLFxuXG4gICAgLy8gcmVtb3ZlTW9kdWxlOiBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2codGhpcy5tb2R1bGVzW21vZHVsZS5tb2R1bGUubmFtZV0pO1xuICAgIC8vICAgICB2YXIgbW9kdWxlc0xlbmd0aCA9IHRoaXMubW9kdWxlc1ttb2R1bGUubW9kdWxlLm5hbWVdLmxlbmd0aDtcbiAgICAvLyAgICAgZm9yICh2YXIgaSA9IG1vZHVsZXNMZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIC8vICAgICAgICAgaWYgKHRoaXMubW9kdWxlc1ttb2R1bGUubW9kdWxlLm5hbWVdW2ldID09PSBtb2R1bGUpIHtcbiAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm1vZHVsZXNbbW9kdWxlLm1vZHVsZS5uYW1lXVtpXSk7XG4gICAgLy8gICAgICAgICAgICAgZGVsZXRlIHRoaXMubW9kdWxlc1ttb2R1bGUubW9kdWxlLm5hbWVdW2ldO1xuICAgIC8vICAgICAgICAgICAgIHJldHVybjtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH0sXG5cbiAgICAvLyBjbGVhbjogZnVuY3Rpb24obW9kdWxlTmFtZSkge1xuICAgIC8vICAgICBpZiAodHlwZW9mIHRoaXMubW9kdWxlc1ttb2R1bGVOYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiB0cnVlO1xuICAgIC8vICAgICB9XG5cblxuICAgIC8vICAgICBpZiAoJC5pc0FycmF5KHRoaXMubW9kdWxlc1ttb2R1bGVOYW1lXSkpIHtcbiAgICAvLyAgICAgICAgIHZhciBtb2R1bGVzTGVuZ3RoID0gdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdLmxlbmd0aDtcbiAgICAvLyAgICAgICAgIGZvciAodmFyIGkgPSBtb2R1bGVzTGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAvLyAgICAgICAgICAgICBpZiAoISQuY29udGFpbnMod2luZG93LmRvY3VtZW50LCB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV1baV0ubW9kdWxlLiRvYmplY3RbMF0pKSB7XG4gICAgLy8gICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV1baV07XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgaWYgKCEkLmNvbnRhaW5zKHdpbmRvdy5kb2N1bWVudCwgdGhpcy5tb2R1bGVzW21vZHVsZU5hbWVdLm1vZHVsZS4kb2JqZWN0WzBdKSkge1xuICAgIC8vICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm1vZHVsZXNbbW9kdWxlTmFtZV07XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGN1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge2pRdWVyeX0gJG9iamVjdCBBIGpRdWVyeSBvYmplY3Qgd2l0aCBhIGxlbmd0aCBvZiBleGFjdGx5IDEuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbW9kaWZpZXIncyBiYXNlIG5hbWUuIChleC46IGJsb2NrIG9yIGVsZW1lbnQncyBuYW1lLilcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcHJlZml4XSBBIHByZWZpeC4gRGVmYXVsdCBpczogY3V0aWwubm90YXRpb24ubW9kaWZpZXIucHJlZml4LlxuICogQHRocm93cyBJZiB0aGUgalF1ZXJ5IG9iamVjdCBjb250YWlucyBubyBvciBtb3JlIHRoYW4gb25lIGVsZW1lbnRzLlxuICovXG5mdW5jdGlvbiBNb2RpZmllcigkb2JqZWN0LCBuYW1lLCBwcmVmaXgpIHtcbiAgICBpZiAodHlwZW9mIHByZWZpeCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcHJlZml4ID0gY3V0aWwubm90YXRpb24ubW9kaWZpZXIucHJlZml4O1xuICAgIH1cblxuICAgIC8vIEF0dHJpYnV0ZXNcbiAgICB0aGlzLm1vZGlmaWVyID0ge1xuICAgICAgICAkb2JqZWN0OiAkb2JqZWN0LFxuICAgICAgICBwcmVmaXg6IHByZWZpeCxcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgcHJlZml4ZWROYW1lOiBjdXRpbC5ub3RhdGlvbi5tb2RpZmllci5wcmVmaXggKyBuYW1lXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAgIGN1dGlsLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRvYmplY3QsIDEpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhyb3cgJ1ttb2RpZmllcjogXCInICsgbmFtZSArICdcIl0nICsgZTtcbiAgICB9XG59XG5cbi8qKlxuICogU3dpdGNoZXMgb24gYSBtb2RpZmllci5cbiAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSBUaGUgbW9kaWZpZXIncyBuYW1lLlxuICogQHJldHVybiB7TW9kaWZpZXJ9IFJldHVybnMgdGhlIE1vZGlmaWVyJ3MgcmVmZXJlbmNlLlxuICovXG5Nb2RpZmllci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIHRydWUpO1xufTtcblxuLyoqXG4gKiBTd2l0Y2hlcyBvZmYgYSBtb2RpZmllci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBtb2RpZmllcidzIG5hbWUuXG4gKiBAcmV0dXJuIHtNb2RpZmllcn0gUmV0dXJucyB0aGUgTW9kaWZpZXIncyByZWZlcmVuY2UuXG4gKi9cbk1vZGlmaWVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIGZhbHNlKTtcbn07XG5cbi8qKlxuICogVG9nZ2xlcyBhIG1vZGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG1vZGlmaWVyJ3MgbmFtZS5cbiAqIEByZXR1cm4ge01vZGlmaWVyfSBSZXR1cm5zIHRoZSBNb2RpZmllcidzIHJlZmVyZW5jZS5cbiAqL1xuTW9kaWZpZXIucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5nZXQobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KG5hbWUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZXQobmFtZSwgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIEdldCdzIHRoZSB2YWx1ZSBvZiBhIG1vZGlmaWVyLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG1vZGlmaWVyJ3MgbmFtZS5cbiAqIEByZXR1cm4ge3N0cmluZ30gUmV0dXJucyB0aGUgdmFsdWUuXG4gKi9cbk1vZGlmaWVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1vZFByZWZpeCA9IHRoaXMudHlwZUlEO1xuICAgIHZhciBtb2RpZmllckNsYXNzID0gY3V0aWwuZ2V0TW9kaWZpZXJDbGFzcyh0aGlzLm1vZGlmaWVyLnByZWZpeGVkTmFtZSwgbmFtZSk7XG5cbiAgICB2YXIgY2xhc3NlcyA9IGN1dGlsLmdldENsYXNzZXNCeVByZWZpeChtb2RpZmllckNsYXNzLCB0aGlzLm1vZGlmaWVyLiRvYmplY3QpO1xuICAgIC8vIE1vZGlmaWVyIG5vdCBmb3VuZFxuICAgIGlmIChjbGFzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHZhbHVlID0gY2xhc3Nlc1swXS5zcGxpdChjdXRpbC5ub3RhdGlvbi5tb2RpZmllci52YWx1ZVNlcGFyYXRvcik7XG5cbiAgICAvLyBNb2RpZmllciBmb3VuZCwgYnV0IGRvZXNuJ3QgaGF2ZSBhIHNwZWNpZmljIHZhbHVlXG4gICAgaWYgKHR5cGVvZiB2YWx1ZVsxXSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBNb2RpZmllciBmb3VuZCB3aXRoIGEgdmFsdWVcbiAgICByZXR1cm4gdmFsdWVbMV07XG59O1xuXG4vKipcbiAqIFNldCdzIGEgbW9kaWZpZXIgdG8gYSBnaXZlbiB2YWx1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBtb2RpZmllcidzIG5hbWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIG1vZGlmaWVyJ3MgdmFsdWUuXG4gKiBAcmV0dXJuIHtNb2RpZmllcn0gUmV0dXJucyB0aGUgTW9kaWZpZXIncyByZWZlcmVuY2UuXG4gKi9cbk1vZGlmaWVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChcbiAgICAgICAgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnICYmXG4gICAgICAgIHR5cGVvZiB2YWx1ZSAhPSAnYm9vbGVhbidcbiAgICApIHtcbiAgICAgICAgdGhyb3cgJ0EgQkVNIG1vZGlmaWVyIHZhbHVlIGNhbiBvbmx5IGVpdGhlciBiZSBcInN0cmluZ1wiLCBvciBcImJvb2xlYW5cIi4gVGhlIGdpdmVuIHZhbHVlIHdhcyBvZiB0eXBlIFwiJyArICh0eXBlb2YgdmFsdWUpICsgJ1wiLic7XG4gICAgfVxuXG4gICAgdmFyIG1vZGlmaWVyQ2xhc3MgPSBjdXRpbC5nZXRNb2RpZmllckNsYXNzKHRoaXMubW9kaWZpZXIucHJlZml4ZWROYW1lLCBuYW1lKTtcbiAgICBjdXRpbC5yZW1vdmVDbGFzc2VzQnlQcmVmaXgobW9kaWZpZXJDbGFzcywgdGhpcy5tb2RpZmllci4kb2JqZWN0KTtcbiAgICBpZiAodmFsdWUgIT09IGZhbHNlKSB7XG4gICAgICAgIG1vZGlmaWVyQ2xhc3MgPSBjdXRpbC5nZXRNb2RpZmllckNsYXNzKHRoaXMubW9kaWZpZXIucHJlZml4ZWROYW1lLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgIHRoaXMubW9kaWZpZXIuJG9iamVjdC5hZGRDbGFzcyhtb2RpZmllckNsYXNzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kaWZpZXI7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY3V0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBjbGFtX2NvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29udGFpbmVyJyk7XG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7alF1ZXJ5fSAkb2JqZWN0IEEgalF1ZXJ5IG9iamVjdCB3aXRoIGEgbGVuZ3RoIG9mIDEuIEl0IG11c3QgaGF2ZVxuICogdGhlIG1vZHVsZSdzIGNsYXNzbmFtZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbc2V0dGluZ3NdIFRoZSBNb2R1bGUgc2V0dGluZ3MuIChFeGFtcGxlIGtleXM6IFwidHlwZVwiLFxuICogXCJoYXNHbG9iYWxIb29rc1wiLCBcImNvbmZcIi4pXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZdIFRoZSBjb25maWd1cmF0aW9uIE9iamVjdC5cbiAqL1xuZnVuY3Rpb24gTW9kdWxlKCRvYmplY3QsIHNldHRpbmdzLCBjb25mKSB7XG4gICAgdmFyIG1vZHVsZU5hbWUgPSBjdXRpbC5nZXRNb2R1bGVOYW1lKHRoaXMpO1xuICAgIHZhciBjbGFzc05hbWUgPSBjdXRpbC5nZXRNb2R1bGVDbGFzcyhtb2R1bGVOYW1lKTtcblxuICAgIHZhciBkZXB0aCA9IDE7XG4gICAgaWYgKHR5cGVvZiBzZXR0aW5ncy5oYXNHbG9iYWxIb29rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2V0dGluZ3MuaGFzR2xvYmFsSG9va3MgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ29udmVydGluZyBwb3NzaWJsZSB0aHJ1dGh5IHZhbHVlcyB0byB0cnVlXG4gICAgc2V0dGluZ3MuaGFzR2xvYmFsSG9va3MgPSAhIXNldHRpbmdzLmhhc0dsb2JhbEhvb2tzO1xuXG4gICAgaWYgKHNldHRpbmdzLnR5cGUgIT09ICdzaW5nbGV0b24nKSB7XG4gICAgICAgIHNldHRpbmdzLnR5cGUgPSAnYmFzaWMnO1xuXG4gICAgICAgIGRlcHRoID0gJG9iamVjdC5wYXJlbnRzKCcuJyArIGNsYXNzTmFtZSkubGVuZ3RoICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBtb2R1bGUgY2FuIGJlIGEgc2luZ2xldG9uIG9yIG5vdFxuICAgICAgICB2YXIgY2xhc3NFbGVtZW50Q291bnQgPSAkKCcuJyArIGNsYXNzTmFtZSkubGVuZ3RoO1xuICAgICAgICBpZiAoY2xhc3NFbGVtZW50Q291bnQgPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyAnVGhlIG1vZHVsZScgKyAnIFsnICsgbW9kdWxlTmFtZSArICddICcgKyAnY291bGQgbm90IGJlIGluc3RhbnRpYXRlZCBhcyBhIHNpbmdsZXRvbi4gJyArIGNsYXNzRWxlbWVudENvdW50ICsgJyBET00gZWxlbWVudHMgd2VyZSBmb3VuZCB3aXRoIHRoZSBcIicgKyBjbGFzc05hbWUgKyAnXCIgY2xhc3MgaW5zdGVhZCBvZiBqdXN0IG9uZS4nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5tb2R1bGUgPSB7XG4gICAgICAgICRvYmplY3Q6ICRvYmplY3QsXG4gICAgICAgIG5hbWU6IG1vZHVsZU5hbWUsXG4gICAgICAgIGNsYXNzOiBjbGFzc05hbWUsXG4gICAgICAgIGNvbmY6IHt9LFxuICAgICAgICBldmVudHM6IHt9LFxuICAgICAgICBob29rczoge30sXG4gICAgICAgIHR5cGU6IHNldHRpbmdzLnR5cGUsXG4gICAgICAgIGRlcHRoOiBkZXB0aCxcbiAgICAgICAgaGFzR2xvYmFsSG9va3M6IHNldHRpbmdzLmhhc0dsb2JhbEhvb2tzXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAgIGN1dGlsLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRvYmplY3QsIDEpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9XG5cbiAgICAvLyBDaGVja2luZyBpZiB0aGUgalF1ZXJ5IG9iamVjdCBoYXMgdGhlIG5lZWRlZCBqc20gY2xhc3NcbiAgICBpZiAoISRvYmplY3QuaGFzQ2xhc3ModGhpcy5tb2R1bGUuY2xhc3MpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBnaXZlbiBqUXVlcnkgT2JqZWN0IGRvZXMgbm90IGhhdmUgdGhpcyBtb2R1bGVcXCdzIGNsYXNzLicpO1xuICAgIH1cblxuICAgIC8vIFNldHRpbmcgdXAgZGVmYXVsdCBjb25maWd1cmF0aW9uXG4gICAgaWYgKHNldHRpbmdzLmNvbmYgIT09IG51bGwpIHtcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5tb2R1bGUuY29uZiwgc2V0dGluZ3MuY29uZik7XG4gICAgfVxuXG4gICAgLy8gTWVyZ2luZyBpbiBkYXRhLSBjb25maWd1cmF0aW9uXG4gICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5tb2R1bGUuY29uZiwgdGhpcy5nZXREYXRhQ29uZmlndXJhdGlvbigpKTtcblxuICAgIC8vIE1lcmdpbmcgaW4gcGFzc2VkIGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHlwZW9mIGNvbmYgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICQuZXh0ZW5kKHRydWUsIHRoaXMubW9kdWxlLmNvbmYsIGNvbmYpO1xuICAgIH1cbn07XG5cbi8vIEFQSVxuLy89PT09XG4vLyBNb2R1bGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbihyZW1vdmVET00pIHtcbi8vICAgICBpZiAocmVtb3ZlRE9NKSB7XG4vLyAgICAgICAgIHRoaXMubW9kdWxlLiRvYmplY3QucmVtb3ZlKCk7XG4vLyAgICAgfVxuXG4vLyAgICAgY2xhbV9jb250YWluZXIucmVtb3ZlTW9kdWxlKHRoaXMpO1xuLy8gICAgIC8vIGNsYW1fY29udGFpbmVyLmNsZWFuKHRoaXMubW9kdWxlLm5hbWUpO1xuLy8gfTtcblxuTW9kdWxlLnByb3RvdHlwZS5hZGRIb29rRXZlbnQgPSBmdW5jdGlvbihob29rTmFtZSwgZXZlbnRUeXBlLCBhZGRQcmVQb3N0RXZlbnRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciAkaG9vayA9IHRoaXMuZ2V0SG9va3MoaG9va05hbWUpO1xuICAgIGlmICgkaG9vay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBldmVudE5hbWUgPSBob29rTmFtZS5zcGxpdCgnLScpO1xuICAgIGV2ZW50TmFtZS5wdXNoKGV2ZW50VHlwZSk7XG4gICAgdmFyIGV2ZW50TmFtZUxlbmd0aCA9IGV2ZW50TmFtZS5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IGV2ZW50TmFtZUxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGV2ZW50TmFtZVtpXSA9IGN1dGlsLnVjZmlyc3QoZXZlbnROYW1lW2ldKTtcbiAgICB9O1xuICAgIHZhciBldmVudE5hbWUgPSBldmVudE5hbWUuam9pbignJyk7XG5cbiAgICAkaG9vay5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKHRoaXMpLm9uKGV2ZW50VHlwZSwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGFkZFByZVBvc3RFdmVudHMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnRyaWdnZXJFdmVudCgncHJlJyArIGV2ZW50TmFtZSwgW2UsICQodGhpcyldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGZbJ29uJyArIGV2ZW50TmFtZV0uYXBwbHkoc2VsZiwgW2UsICQodGhpcyldKTtcbiAgICAgICAgICAgIGlmIChhZGRQcmVQb3N0RXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgc2VsZi50cmlnZ2VyRXZlbnQoJ3Bvc3QnICsgZXZlbnROYW1lLCBbZSwgJCh0aGlzKV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLm1vZHVsZS5ldmVudHNbZXZlbnROYW1lXSA9IGNhbGxiYWNrO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5nZXRNb2R1bGVOYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGN1dGlsLmdldE1vZHVsZU5hbWUodGhpcyk7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLnRyaWdnZXJFdmVudCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdGhpcy5tb2R1bGUuZXZlbnRzW2V2ZW50TmFtZV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5ldmVudHNbZXZlbnROYW1lXS5hcHBseSh0aGlzLCBhcmdzKTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUucHJldHRpZnkgPSBmdW5jdGlvbihtZXNzYWdlLCBzdWJqZWN0KSB7XG4gICAgcmV0dXJuICdbJyArIHRoaXMubW9kdWxlLm5hbWUgKyAoc3ViamVjdCA/ICc6ICcgKyBzdWJqZWN0OiAnJykgKyAnXSAnICsgbWVzc2FnZTtcbn07XG5cbi8qKlxuICogR2V0cyBhIHNpbmdsZSAtIG9yIG5vIC0gaG9vayBqUXVlcnkgb2JqZWN0IGZyb20gdGhlIG1vZHVsZSBjb250ZXh0LlxuICogVGhlIGZvdW5kIGhvb2sgd2lsbCBiZSBzYXZlZCwgdXNpbmcgdGhlIGhvb2tOYW1lIGFzIGEga2V5LiBUaGlzIHdheSwgb25seSBvbmVcbiAqIHNlYXJjaCBvY2N1cnMgZm9yIGFueSBnaXZlbiBob29rTmFtZSBpbiB0aGUgRE9NIHRyZWUuICBcbiAqIEZpbmRpbmcgbW9yZSB0aGFuIG9uZSBob29rIHdpbGwgcmVzdWx0IGluIGFuIGV4Y2VwdGlvbi4gKEFuIGVtcHR5IHJlc3VsdCBpc1xuICogYWxsb3dlZCBieSBkZWZhdWx0LilcbiAqIEBwYXJhbSB7c3RyaW5nfSBob29rTmFtZSBUaGUgc2VhcmNoZWQgaG9vayBuYW1lLlxuICogQHBhcmFtIHtib29sZWFufSBbZW1wdHlSZXN1bHROb3RBbGxvd2VkXSBJZiBzZXQgdG8gdHJ1ZSwgdGhlbiBub3QgZmluZGluZyBhIGhvb2tcbiAqIHdpbGwgYWxzbyB0aHJvdyBhbiBleGNlcHRpb24uXG4gKiBAcmV0dXJuIHtqUXVlcnl9IENsYW0gaG9vay5cbiAqL1xuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rID0gZnVuY3Rpb24oaG9va05hbWUsIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCkge1xuICAgIHJldHVybiB0aGlzLmdldEhvb2tzKGhvb2tOYW1lLCAxLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpO1xufTtcblxuLyoqXG4gKiBHZXRzIGFueSBudW1iZXIgb2YgalF1ZXJ5IG9iamVjdCAtIGluY2x1ZGluZyBub25lIC0gZnJvbSB0aGUgbW9kdWxlIGNvbnRleHQuXG4gKiBUaGUgZm91bmQgaG9vayB3aWxsIGJlIHNhdmVkLCB1c2luZyB0aGUgaG9va05hbWUgYXMgYSBrZXkuIFRoaXMgd2F5LCBvbmx5IG9uZVxuICogc2VhcmNoIG9jY3VycyBmb3IgYW55IGdpdmVuIGhvb2tOYW1lIGluIHRoZSBET00gdHJlZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBob29rTmFtZSBUaGUgc2VhcmNoZWQgaG9vayBuYW1lLlxuICogQHBhcmFtIHtpbnR9IFtleHBlY3RlZEhvb2tOdW1dIChvcHRpb25hbCkgRGVmaW5lcyBleGFjdGx5IGhvdyBtYW55IGhvb2sgb2JqZWN0c1xuICogbXVzdCBiZSByZXR1cm5lZCBpbiB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24uIElmIGdpdmVuLCBidXQgdGhlIGZvdW5kIGhvb2tzXG4gKiBjb3VudCBkb2VzIG5vdCBlcXVhbCB0aGF0IG51bWJlciwgdGhlbiBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uIFxuICogQHBhcmFtIGJvb2xlYW4gW2VtcHR5UmVzdWx0Tm90QWxsb3dlZF0gSWYgc2V0IHRvIHRydWUsIHRoZW4gbm90IGZpbmRpbmcgaG9va3NcbiAqIHdpbGwgYWxzbyB0aHJvdyBhbiBleGNlcHRpb24uXG4gKiBAcmV0dXJuIHtqUXVlcnl9IENsYW0gaG9vay5cbiAqL1xuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rcyA9IGZ1bmN0aW9uKGhvb2tOYW1lLCBleHBlY3RlZEhvb2tOdW0sIGVtcHR5UmVzdWx0Tm90QWxsb3dlZCkge1xuICAgIGlmICh0eXBlb2YgdGhpcy5tb2R1bGUuaG9va3NbaG9va05hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLm1vZHVsZS5ob29rc1tob29rTmFtZV0gPSB0aGlzLmZpbmRIb29rcyhob29rTmFtZSwgZXhwZWN0ZWRIb29rTnVtLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5ob29rc1tob29rTmFtZV07XG59O1xuXG4vKipcbiAqIEdldHMgYSBzaW5nbGUgLSBvciBubyAtIGhvb2sgalF1ZXJ5IG9iamVjdCBmcm9tIHRoZSBtb2R1bGUgY29udGV4dCB1c2luZ1xuICogalF1ZXJ5IHNlbGVjdG9ycy4gVXNlZnVsIHdoZW4gaG9va3MgY2FuIGJlIGFkZGVkIGRpbmFtaWNhbGx5IHRvIHRoZSBtb2R1bGUuXG4gKiBGaW5kaW5nIG1vcmUgdGhhbiBvbmUgaG9vayB3aWxsIHJlc3VsdCBpbiBhbiBleGNlcHRpb24uIChBbiBlbXB0eSByZXN1bHQgaXNcbiAqIGFsbG93ZWQgYnkgZGVmYXVsdC4pXG4gKiBAcGFyYW0ge3N0cmluZ30gaG9va05hbWUgVGhlIHNlYXJjaGVkIGhvb2sgbmFtZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2VtcHR5UmVzdWx0Tm90QWxsb3dlZF0gSWYgc2V0IHRvIHRydWUsIHRoZW4gbm90IGZpbmRpbmcgYSBob29rXG4gKiB3aWxsIGFsc28gdGhyb3cgYW4gZXhjZXB0aW9uLlxuICogQHJldHVybiB7alF1ZXJ5fSBDbGFtIGhvb2suXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZmluZEhvb2sgPSBmdW5jdGlvbihob29rTmFtZSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluZEhvb2tzKGhvb2tOYW1lLCAxLCBlbXB0eVJlc3VsdE5vdEFsbG93ZWQpO1xufTtcblxuXG4vKipcbiAqIEdldHMgYW55IG51bWJlciBvZiBqUXVlcnkgb2JqZWN0IC0gaW5jbHVkaW5nIG5vbmUgLSBmcm9tIHRoZSBtb2R1bGUgY29udGV4dFxuICogdXNpbmcgalF1ZXJ5IHNlbGVjdG9ycy4gVXNlZnVsIHdoZW4gaG9va3MgY2FuIGJlIGFkZGVkIGRpbmFtaWNhbGx5IHRvIHRoZVxuICogbW9kdWxlLlxuICogQHBhcmFtIHtzdHJpbmd9IGhvb2tOYW1lIFRoZSBzZWFyY2hlZCBob29rIG5hbWUuXG4gKiBAcGFyYW0ge2ludH0gW2V4cGVjdGVkSG9va051bV0gKG9wdGlvbmFsKSBEZWZpbmVzIGV4YWN0bHkgaG93IG1hbnkgaG9vayBvYmplY3RzXG4gKiBtdXN0IGJlIHJldHVybmVkIGluIHRoZSBqUXVlcnkgY29sbGVjdGlvbi4gSWYgZ2l2ZW4sIGJ1dCB0aGUgZm91bmQgaG9va3NcbiAqIGNvdW50IGRvZXMgbm90IGVxdWFsIHRoYXQgbnVtYmVyLCB0aGVuIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2VtcHR5UmVzdWx0Tm90QWxsb3dlZF0gSWYgc2V0IHRvIHRydWUsIHRoZW4gbm90IGZpbmRpbmcgYSBob29rXG4gKiB3aWxsIGFsc28gdGhyb3cgYW4gZXhjZXB0aW9uLlxuICogQHJldHVybiB7alF1ZXJ5fSBDbGFtIGhvb2suXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZmluZEhvb2tzID0gZnVuY3Rpb24oaG9va05hbWUsIGV4cGVjdGVkSG9va051bSwgZW1wdHlSZXN1bHROb3RBbGxvd2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBob29rQ2xhc3NOYW1lID0gdGhpcy5nZXRIb29rQ2xhc3NOYW1lKGhvb2tOYW1lKTtcbiAgICB2YXIgJGhvb2tzO1xuICAgIHZhciAkaW5Db250ZXh0SG9va3M7XG5cbiAgICBpZiAodGhpcy5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICBpZiAodGhpcy5tb2R1bGUuaGFzR2xvYmFsSG9va3MpIHtcbiAgICAgICAgICAgICRob29rcyA9ICQoJy4nICsgaG9va0NsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkaG9va3MgPSB0aGlzLm1vZHVsZS4kb2JqZWN0LmZpbmQoJy4nICsgaG9va0NsYXNzTmFtZSk7XG5cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGUgbWFpbiBtb2R1bGUgZWxlbWVudCBpZiBpdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZHVsZS4kb2JqZWN0Lmhhc0NsYXNzKGhvb2tDbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgJGhvb2tzID0gJGhvb2tzLmFkZCh0aGlzLm1vZHVsZS4kb2JqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEdldHRpbmcgYWxsIGhvb2tzIGluIHRoZSBtb2R1bGUsIGV4Y2x1ZGluZyBvdGhlciBpbnN0YW5jZXMgb2YgdGhlXG4gICAgICAgIC8vIHNhbWUgbW9kdWxlIGluc2lkZSB0aGUgY3VycmVudCBvbmUuXG5cbiAgICAgICAgLy8gQ3JlYXRpbmcgYSBcImRlcHRoQ2xhc3NcIiB0byBleGNsdWRlIHRoZSBzYW1lIHR5cGVzIG9mIG1vZHVsZXMgaW5zaWRlXG4gICAgICAgIC8vIHRoZSBhY3R1YWwgb25lIHdoZW4gc2VhcmNoaW5nIGZvciBhIGhvb2suXG4gICAgICAgIHZhciBkZXB0aENsYXNzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLm1vZHVsZS5kZXB0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGRlcHRoQ2xhc3MucHVzaCgnLicgKyB0aGlzLm1vZHVsZS5jbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgZGVwdGhDbGFzcyA9IGRlcHRoQ2xhc3Muam9pbignICcpO1xuXG4gICAgICAgICRob29rcyA9XG4gICAgICAgICAgICB0aGlzLm1vZHVsZS4kb2JqZWN0XG4gICAgICAgICAgICAuZmluZCgnLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgLy8gRXhjbHVkaW5nIGFsbCBob29rcyBpbnNpZGUgb3RoZXIgbW9kdWxlIGluc3RhbmNlc1xuICAgICAgICAgICAgLm5vdChkZXB0aENsYXNzICsgJyAuJyArIGhvb2tDbGFzc05hbWUpXG4gICAgICAgICAgICAvLyBFeGNsdWRpbmcgYWxsIG90aGVyIG1vZHVsZXMgdGhhdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgICAgIC5ub3QoZGVwdGhDbGFzcyArICcuJyArIGhvb2tDbGFzc05hbWUpO1xuXG4gICAgICAgIC8vIEFkZGluZyBldmVyeSBob29rIG91dHNpZGUgb2YgdGhlIG1vZHVsZSBpbnN0YW5jZXMuXG4gICAgICAgIGlmICh0aGlzLm1vZHVsZS5oYXNHbG9iYWxIb29rcykge1xuICAgICAgICAgICAgdmFyICRnbG9iYWxIb29rcyA9XG4gICAgICAgICAgICAgICAgJCgnLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgICAgIC8vIEV4Y2x1ZGluZyBob29rcyBmcm9tIHdpdGhpbiBtb2R1bGVzXG4gICAgICAgICAgICAgICAgLm5vdCgnLicgKyB0aGlzLm1vZHVsZS5jbGFzcyArICcgLicgKyBob29rQ2xhc3NOYW1lKVxuICAgICAgICAgICAgICAgIC5ub3QoJy4nICsgdGhpcy5tb2R1bGUuY2xhc3MgKyAnLicgKyBob29rQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoJGdsb2JhbEhvb2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRob29rcyA9ICRob29rcy5hZGQoJGdsb2JhbEhvb2tzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZGluZyB0aGUgbWFpbiBtb2R1bGUgZWxlbWVudCBpZiBpdCBoYXMgdGhlIGhvb2sgY2xhc3NcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlLiRvYmplY3QuaGFzQ2xhc3MoaG9va0NsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICRob29rcyA9ICRob29rcy5hZGQodGhpcy5tb2R1bGUuJG9iamVjdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBleHBlY3RlZEhvb2tOdW0gPT09ICdudW1iZXInICYmXG4gICAgICAgIGV4cGVjdGVkSG9va051bSAhPSAkaG9va3MubGVuZ3RoXG4gICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICRob29rcy5sZW5ndGggIT09IDAgfHxcbiAgICAgICAgICAgIGVtcHR5UmVzdWx0Tm90QWxsb3dlZFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJGhvb2tzKTtcbiAgICAgICAgICAgIHRocm93ICdBbiBpbmNvcnJlY3QgbnVtYmVyIG9mIGhvb2tzIHdlcmUgZm91bmQuIEV4cGVjdGVkOiAnICsgZXhwZWN0ZWRIb29rTnVtICsgJy4gRm91bmQ6ICcgKyAkaG9va3MubGVuZ3RoICsgJy4gSG9vayBuYW1lOiBcIicgKyBob29rQ2xhc3NOYW1lICsgJ1wiJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAkaG9va3M7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmdldEhvb2tDbGFzc05hbWUgPSBmdW5jdGlvbihob29rTmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5jbGFzcyArIGN1dGlsLm5vdGF0aW9uLm1vZHVsZS5zZXBhcmF0b3IgKyBob29rTmFtZTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuZ2V0RGF0YUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGF0YUNvbmYgPSB0aGlzLm1vZHVsZS4kb2JqZWN0LmRhdGEoY3V0aWwuZ2V0TW9kdWxlQ2xhc3ModGhpcy5tb2R1bGUubmFtZSkpO1xuICAgIGlmICh0eXBlb2YgZGF0YUNvbmYgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRhdGFDb25mID0ge307XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkYXRhQ29uZiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVGhlIGRhdGEtKiBhdHRyaWJ1dGVcXCdzIGNvbnRlbnQgd2FzIG5vdCBhIHZhbGlkIEpTT04uIEZldGNoZWQgdmFsdWU6ICcgKyBkYXRhQ29uZik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGFDb25mO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5nZXRIb29rQ29uZmlndXJhdGlvbiA9IGZ1bmN0aW9uKCRob29rKSB7XG4gICAgcmV0dXJuICRob29rLmRhdGEodGhpcy5tb2R1bGUuY2xhc3MpO1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5leHBvc2UgPSBmdW5jdGlvbihjb250YWluZXJOYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBjb250YWluZXJOYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBjb250YWluZXJOYW1lID0gJ2V4cG9zZWRfbW9kdWxlcyc7XG4gICAgfVxuICAgIFxuICAgIGlmICh0eXBlb2Ygd2luZG93W2NvbnRhaW5lck5hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV0gPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgbW9kdWxlTmFtZSA9IHRoaXMubW9kdWxlLm5hbWUucmVwbGFjZSgvXFwtL2csICdfJyk7XG5cbiAgICBpZiAodGhpcy5tb2R1bGUudHlwZSA9PSAnc2luZ2xldG9uJykge1xuICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnNvbGUud2FybignRXhwb3NlZCBhczogXCInICsgY29udGFpbmVyTmFtZSArICcuJyArIG1vZHVsZU5hbWUgKyAnXCIuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB3aW5kb3dbY29udGFpbmVyTmFtZV1bbW9kdWxlTmFtZV0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtb2R1bGVDb3VudCA9IHdpbmRvd1tjb250YWluZXJOYW1lXVttb2R1bGVOYW1lXS5sZW5ndGg7XG5cbiAgICAgICAgd2luZG93W2NvbnRhaW5lck5hbWVdW21vZHVsZU5hbWVdLnB1c2godGhpcyk7XG5cbiAgICAgICAgY29uc29sZS53YXJuKCdFeHBvc2VkIGFzOiBcIicgKyBjb250YWluZXJOYW1lICsgJy4nICsgbW9kdWxlTmFtZSArICdbJyArIG1vZHVsZUNvdW50ICsgJ11cIi4nKTtcbiAgICB9XG59O1xuXG4vLyBFeHBvcnQgbW9kdWxlXG4vLz09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICogVGhlIGNsYW0gdXRpbGl0eSBtb2R1bGUuXG4gKiBAbW9kdWxlIHV0aWxcbiAqL1xudmFyICQgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy4kIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC4kIDogbnVsbCk7XG52YXIgY29udGFpbmVyID0gcmVxdWlyZSgnLi9jb250YWluZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbm90YXRpb246IHtcbiAgICAgICAgbW9kdWxlOiB7XG4gICAgICAgICAgICBwcmVmaXg6ICdqc20tJyxcbiAgICAgICAgICAgIHNlcGFyYXRvcjogJ19fJ1xuICAgICAgICB9LFxuXG4gICAgICAgIG1vZGlmaWVyOiB7XG4gICAgICAgICAgICBwcmVmaXg6ICdiLScsXG4gICAgICAgICAgICBlbGVtZW50U2VwYXJhdG9yOiAnX18nLFxuICAgICAgICAgICAgbW9kaWZpZXJTZXBhcmF0b3I6ICctLScsXG4gICAgICAgICAgICB2YWx1ZVNlcGFyYXRvcjogJ18nXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBtb2R1bGUgaW5zdGFuY2VzIGZvciBldmVyeSBET00gZWxlbWVudCB0aGF0IGhhcyB0aGUgYXBwcm9wcmlhdGVcbiAgICAgKiBtb2R1bGUgY2xhc3MuIElmIHRoZSAkY29udGFpbmVyT2JqIGpRdWVyeSBvYmplY3QgaXMgZ2l2ZW4gdGhlbiB0aGVcbiAgICAgKiBmdW5jdGlvbiB3aWxsIGxvb2sgZm9yIHRoZSBtb2R1bGUgY2xhc3NlcyBpbiB0aGF0IGNvbnRhaW5lci5cbiAgICAgKiBAcGFyYW0gIHtDbGFtTW9kdWxlfSBtb2R1bGUgQSBjbGFtIG1vZHVsZS5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IFtjb25maWddIEEgY29uZmlndXJhdGlvbiBvYmplY3QuXG4gICAgICogQHBhcmFtICB7alF1ZXJ5fSBbJGNvbnRhaW5lck9ial0gVGhlIGNvbnRhaW5lciBvYmplY3QuXG4gICAgICogQHJldHVybiB7YXJyYXl8Q2xhbU1vZHVsZXxudWxsfSBSZXR1cm5zIGFuIGFycmF5IG9mIGNyZWF0ZWQgaW5zdGFuY2VzIG9yXG4gICAgICogYSBzaW5nbGUgaW5zdGFuY2UsIG9yIG51bGwuXG4gICAgICovXG4gICAgY3JlYXRlUHJvdG90eXBlczogZnVuY3Rpb24obW9kdWxlLCBjb25maWcsICRjb250YWluZXJPYmopIHtcbiAgICAgICAgLy8gR2V0dGluZyB0aGUgbW9kdWxlIG5hbWUsIHRvIHNlbGVjdCB0aGUgRE9NIGVsZW1lbnRzLlxuICAgICAgICB2YXIgbW9kdWxlTmFtZSA9IHRoaXMuZ2V0TW9kdWxlTmFtZShtb2R1bGUpO1xuICAgICAgICB2YXIgbW9kdWxlQ2xhc3MgPSB0aGlzLmdldE1vZHVsZUNsYXNzKG1vZHVsZU5hbWUpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBjb25maWcgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAhY29uZmlnIC8vIGZhbHN5IHZhbHVlc1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbmZpZyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGFwcHJvcHJpYXRlIG1vZHVsZSBET00gb2JqZWN0c1xuICAgICAgICB2YXIgJG1vZHVsZXMgPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mICRjb250YWluZXJPYmogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlSlF1ZXJ5T2JqZWN0KCRjb250YWluZXJPYmopO1xuICAgICAgICAgICAgJG1vZHVsZXMgPSAkY29udGFpbmVyT2JqLmZpbmQoJy4nICsgbW9kdWxlQ2xhc3MpO1xuICAgICAgICAgICAgaWYgKCRjb250YWluZXJPYmouaGFzQ2xhc3MobW9kdWxlQ2xhc3MpKSB7XG4gICAgICAgICAgICAgICAgJG1vZHVsZXMgPSAkbW9kdWxlcy5hZGQoJGNvbnRhaW5lck9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkbW9kdWxlcyA9ICQoJy4nICsgbW9kdWxlQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIG1vZHVsZSBpbnN0YW5jZXNcbiAgICAgICAgdmFyIGluc3RhbmNlcyA9IFtdO1xuICAgICAgICBpZiAoJG1vZHVsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJG1vZHVsZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZXMucHVzaChuZXcgbW9kdWxlKCQodGhpcyksIGNvbmZpZykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID09IDEgJiYgaW5zdGFuY2VzWzBdLm1vZHVsZS50eXBlID09ICdzaW5nbGV0b24nKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2VzID0gaW5zdGFuY2VzWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb250YWluZXIuYWRkKGluc3RhbmNlcyk7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLy8gR2V0J3MgYSBtb2R1bCdzIG5hbWUgZnJvbSBpdCdzIGRlZmluaXRpb24sIG9yIGZyb20gYSBwcm90b3R5cGVcbiAgICBnZXRNb2R1bGVOYW1lOiBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgICAgdmFyIGZ1bmNEZWYgPSB0eXBlb2YgbW9kdWxlID09PSAnZnVuY3Rpb24nID8gU3RyaW5nKG1vZHVsZSkgOiBTdHJpbmcobW9kdWxlLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgdmFyIGZ1bmNOYW1lID0gZnVuY0RlZi5zdWJzdHIoJ2Z1bmN0aW9uICcubGVuZ3RoKTtcbiAgICAgICAgZnVuY05hbWUgPSBmdW5jTmFtZS5zdWJzdHIoMCwgZnVuY05hbWUuaW5kZXhPZignKCcpKTtcblxuICAgICAgICByZXR1cm4gZnVuY05hbWUucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGNvbGxlY3Rpb24gaXMgYSB2YWxpZCBqUXVlcnkgb2JqZWN0IG9yIG5vdC5cbiAgICAvLyBJZiB0aGUgY29sbGVjdGlvblNpemUgKGludGVnZXIpIHBhcmFtZXRlciBpcyBzcGVjaWZpZWQsIHRoZW4gdGhlXG4gICAgLy8gY29sbGVjdGlvbidzIHNpemUgd2lsbCBiZSB2YWxpZGF0ZWQgYWNjb3JkaW5nbHkuXG4gICAgdmFsaWRhdGVKUXVlcnlPYmplY3Q6IGZ1bmN0aW9uKCRjb2xsZWN0aW9uLCBjb2xsZWN0aW9uU2l6ZSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgY29sbGVjdGlvblNpemUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICB0eXBlb2YgY29sbGVjdGlvblNpemUgIT09ICdudW1iZXInXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgJ1RoZSBnaXZlbiBcImNvbGxlY3Rpb25TaXplXCIgcGFyYW1ldGVyIGZvciB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gdmFsaWRhdGlvbiB3YXMgbm90IGEgbnVtYmVyLiBQYXNzZWQgdmFsdWU6ICcgKyBjb2xsZWN0aW9uU2l6ZSArICcsIHR5cGU6ICcgKyAodHlwZW9mIGNvbGxlY3Rpb25TaXplKSArICcuJztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCRjb2xsZWN0aW9uIGluc3RhbmNlb2YgalF1ZXJ5ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhyb3cgJ1RoaXMgaXMgbm90IGEgalF1ZXJ5IE9iamVjdC4gUGFzc2VkIHR5cGU6ICcgKyAodHlwZW9mICRjb2xsZWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBjb2xsZWN0aW9uU2l6ZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICRjb2xsZWN0aW9uLmxlbmd0aCAhPSBjb2xsZWN0aW9uU2l6ZVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93ICdUaGUgZ2l2ZW4galF1ZXJ5IGNvbGxlY3Rpb24gY29udGFpbnMgYW4gdW5leHBlY3RlZCBudW1iZXIgb2YgZWxlbWVudHMuIEV4cGVjdGVkOiAnICsgY29sbGVjdGlvblNpemUgKyAnLCBnaXZlbjogJyArICRjb2xsZWN0aW9uLmxlbmd0aCArICcuJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1Y2ZpcnN0OiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zdWJzdHIoMSk7XG4gICAgfSxcblxuICAgIGdldE1vZHVsZUNsYXNzOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGF0aW9uLm1vZHVsZS5wcmVmaXggKyBuYW1lO1xuICAgIH0sXG5cbiAgICBnZXRNb2RpZmllckNsYXNzOiBmdW5jdGlvbihiYXNlTmFtZSwgbW9kaWZpZXJOYW1lLCB2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5ub3RhdGlvbi5tb2RpZmllci52YWx1ZVNlcGFyYXRvciArIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJhc2VOYW1lICsgdGhpcy5ub3RhdGlvbi5tb2RpZmllci5tb2RpZmllclNlcGFyYXRvciArIG1vZGlmaWVyTmFtZSArIHZhbHVlO1xuICAgIH0sXG5cbiAgICBnZXRDbGFzc2VzQnlQcmVmaXg6IGZ1bmN0aW9uKHByZWZpeCwgJGpRT2JqKSB7XG4gICAgICAgIHZhciBjbGFzc2VzID0gJGpRT2JqLmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGlmICghY2xhc3NlcykgeyAvLyBpZiBcImZhbHN5XCIsIGZvciBleDogdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXMuc3BsaXQoJyAnKTtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSBuZXcgUmVnRXhwKCdeKCcgKyBwcmVmaXggKyAnKSguKiknKS5leGVjKGNsYXNzZXNbaV0pO1xuICAgICAgICAgICAgaWYgKG1hdGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2hbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoZXM7XG4gICAgfSxcblxuICAgIHJlbW92ZUNsYXNzZXNCeVByZWZpeDogZnVuY3Rpb24ocHJlZml4LCAkalFPYmopIHtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSB0aGlzLmdldENsYXNzZXNCeVByZWZpeChwcmVmaXgsICRqUU9iaik7XG4gICAgICAgIG1hdGNoZXMgPSBtYXRjaGVzLmpvaW4oJyAnKTtcbiAgICAgICAgJGpRT2JqLnJlbW92ZUNsYXNzKG1hdGNoZXMpO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xudmFyIG1vZGlmaWVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZGlmaWVyJyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XG52YXIgZHluYW1pY19jb25maWcgPSByZXF1aXJlKCcuLi9jb25mL2R5bmFtaWNfY29uZmlnJyk7XG52YXIgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LiQgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLiQgOiBudWxsKTtcblxudmFyIHNldHRpbmdzID0ge1xuICAgIGNvbmY6IHtcbiAgICAgICAgcHJvdG90eXBlSFRNTDogJzxkaXYgY2xhc3M9XCJqc20tZHluYW1pYyBiLWR5bmFtaWNcIj4gPGEgaHJlZj1cImphdmFzY3JpcHQ6IHZvaWQoMClcIiBjbGFzcz1cImpzbS1keW5hbWljX19hZGQtZW1iZWRkZWQtYnRuXCI+TmV3IGVtYmVkZGVkPC9hPiB8IDxhIGhyZWY9XCJqYXZhc2NyaXB0OiB2b2lkKDApXCIgY2xhc3M9XCJqc20tZHluYW1pY19fYWRkLXNpYmxpbmctYnRuXCI+TmV3IHNpYmxpbmc8L2E+IHwgPGEgaHJlZj1cImphdmFzY3JpcHQ6IHZvaWQoMClcIiBjbGFzcz1cImpzbS1keW5hbWljX190b2dnbGUtaGlnaGxpZ2h0XCI+SGlnaGxpZ2h0PC9hPiB8IDxhIGhyZWY9XCJqYXZhc2NyaXB0OiB2b2lkKDApXCIgY2xhc3M9XCJqc20tZHluYW1pY19fZGVzdHJveVwiPkRlc3Ryb3k8L2E+IDxkaXYgY2xhc3M9XCJiLWR5bmFtaWNfX2FkZGl0aW9uYWwtbW9kdWxlcyBqc20tZHluYW1pY19fYWRkaXRpb25hbC1tb2R1bGVzXCI+PC9kaXY+IDwvZGl2PicsXG4gICAgICAgIGFsbG93QWRkU2libGluZzogdHJ1ZSxcbiAgICAgICAgYWxsb3dBZGRFbWJlZGRlZDogdHJ1ZVxuICAgIH1cbiAgICAvLyBoYXNHbG9iYWxIb29rczogdHJ1ZVxufTtcblxuZnVuY3Rpb24gRHluYW1pYygkalFPYmosIGNvbmYpIHtcbiAgICAvL3ZhciBzZWxmID0gdGhpcztcbiAgICBjb25zb2xlLmxvZygnRHluYW1pYycpO1xuICAgIGNsYW1fbW9kdWxlLmFwcGx5KHRoaXMsIFskalFPYmosIHNldHRpbmdzLCBjb25mXSk7XG4gICAgdGhpcy5leHBvc2UoKTtcblxuICAgIHRoaXMubW9kdWxlTW9kaWZpZXIgPSBuZXcgbW9kaWZpZXIodGhpcy5tb2R1bGUuJG9iamVjdCwgJ2R5bmFtaWMnKTtcblxuICAgIGlmICh0aGlzLm1vZHVsZS5jb25mLmFsbG93QWRkRW1iZWRkZWQpIHtcbiAgICAgICAgdGhpcy5nZXRIb29rKCdhZGQtZW1iZWRkZWQtYnRuJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmFkZEVtYmVkZGVkLCB0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5nZXRIb29rKCdhZGQtZW1iZWRkZWQtYnRuJykucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW9kdWxlLmNvbmYuYWxsb3dBZGRTaWJsaW5nKSB7XG4gICAgICAgIHRoaXMuZ2V0SG9vaygnYWRkLXNpYmxpbmctYnRuJykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmFkZFNpYmxpbmcsIHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmdldEhvb2soJ2FkZC1zaWJsaW5nLWJ0bicpLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0SG9vaygnZGVzdHJveScpLm9uKCdjbGljaycsICQucHJveHkodGhpcy5kZXN0cm95LCB0aGlzKSk7XG4gICAgXG4gICAgdGhpcy5nZXRIb29rKCd0b2dnbGUtaGlnaGxpZ2h0Jykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLnRvZ2dsZUhpZ2hsaWdodCwgdGhpcykpO1xufVxuXG5pbmhlcml0cyhEeW5hbWljLCBjbGFtX21vZHVsZSk7XG5cbi8vIER5bmFtaWMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbi8vICAgICBjbGFtX21vZHVsZS5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMsIGZhbHNlKTtcbi8vIH07XG5cbkR5bmFtaWMucHJvdG90eXBlLmFkZEVtYmVkZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICQud2hlbih0aGlzLnRyaWdnZXJFdmVudCgnYWRkJykpXG4gICAgLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdFUlJST1InKTtcbiAgICB9KVxuICAgIC5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYuYWRkQWRkaXRpb25hbE1vZHVsZSgpO1xuICAgIH0pO1xufTtcblxuRHluYW1pYy5wcm90b3R5cGUuYWRkU2libGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYWRkQWRkaXRpb25hbE1vZHVsZSh0cnVlKTtcbn07XG5cbkR5bmFtaWMucHJvdG90eXBlLnRvZ2dsZUhpZ2hsaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubW9kdWxlTW9kaWZpZXIudG9nZ2xlKCdoaWdobGlnaHQnKTtcbn07XG5cbkR5bmFtaWMucHJvdG90eXBlLmFkZEFkZGl0aW9uYWxNb2R1bGUgPSBmdW5jdGlvbihhc1NpYmxpbmcpIHtcbiAgICB2YXIgJGVtYmVkZGVkTW9kdWwgPSAkKCQucGFyc2VIVE1MKHRoaXMubW9kdWxlLmNvbmYucHJvdG90eXBlSFRNTCkpO1xuICAgIGlmIChhc1NpYmxpbmcpIHtcbiAgICAgICAgdGhpcy5tb2R1bGUuJG9iamVjdC5hZnRlcigkZW1iZWRkZWRNb2R1bCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5nZXRIb29rKCdhZGRpdGlvbmFsLW1vZHVsZXMnKS5hcHBlbmQoJGVtYmVkZGVkTW9kdWwpO1xuICAgIH1cbiAgICBcbiAgICBjdXRpbC5jcmVhdGVQcm90b3R5cGVzKHRoaXMuY29uc3RydWN0b3IsIGR5bmFtaWNfY29uZmlnLCAkZW1iZWRkZWRNb2R1bCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IER5bmFtaWM7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xudmFyIG1vZGlmaWVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZGlmaWVyJyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHM7XG52YXIgZHluYW1pY19jb25maWcgPSByZXF1aXJlKCcuLi9jb25mL2R5bmFtaWNfY29uZmlnJyk7XG52YXIgZHluYW1pYyA9IHJlcXVpcmUoJy4vZHluYW1pYycpO1xudmFyICQgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy4kIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC4kIDogbnVsbCk7XG5cbmZ1bmN0aW9uIER5bmFtaWNFeHQoJGpRT2JqLCBjb25mKSB7XG4gICAgY29uZi5wcm90b3R5cGVIVE1MID0gJzxkaXYgY2xhc3M9XCJqc20tZHluYW1pYy1leHQgYi1keW5hbWljXCI+IDxhIGhyZWY9XCJqYXZhc2NyaXB0OiB2b2lkKDApXCIgY2xhc3M9XCJqc20tZHluYW1pYy1leHRfX2FkZC1lbWJlZGRlZC1idG5cIj5OZXcgZW1iZWRkZWQ8L2E+IHwgPGEgaHJlZj1cImphdmFzY3JpcHQ6IHZvaWQoMClcIiBjbGFzcz1cImpzbS1keW5hbWljLWV4dF9fYWRkLXNpYmxpbmctYnRuXCI+TmV3IHNpYmxpbmc8L2E+IHwgPGEgaHJlZj1cImphdmFzY3JpcHQ6IHZvaWQoMClcIiBjbGFzcz1cImpzbS1keW5hbWljLWV4dF9fdG9nZ2xlLWhpZ2hsaWdodFwiPkhpZ2hsaWdodDwvYT4gfCA8YSBocmVmPVwiamF2YXNjcmlwdDogdm9pZCgwKVwiIGNsYXNzPVwianNtLWR5bmFtaWMtZXh0X19kZXN0cm95XCI+RGVzdHJveTwvYT4gPGRpdiBjbGFzcz1cImItZHluYW1pY19fYWRkaXRpb25hbC1tb2R1bGVzIGpzbS1keW5hbWljLWV4dF9fYWRkaXRpb25hbC1tb2R1bGVzXCI+PC9kaXY+IDwvZGl2Pic7XG4gICAgZHluYW1pYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdhZGQnLCB0aGlzLmFkZCk7XG59XG5cbmluaGVyaXRzKER5bmFtaWNFeHQsIGR5bmFtaWMpO1xuXG5EeW5hbWljRXh0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnRHluYW1pY0V4dC5wcm90b3R5cGUuYWRkJyk7XG4gICAgdGhpcy5kZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcbiAgICB0aGlzLmFkZE1vcmUoKTtcbiAgICByZXR1cm4gdGhpcy5kZWZlcnJlZDtcbn07XG5cbkR5bmFtaWNFeHQucHJvdG90eXBlLmFkZE1vcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5kZWZlcnJlZC5yZWplY3QoKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vIHNlbGYuZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgIH0sIDMwMDApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEeW5hbWljRXh0O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGN1dGlsID0gcmVxdWlyZSgnY2xhbS9jb3JlL3V0aWwnKTtcbnZhciBjbGFtX21vZHVsZSA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2R1bGUnKTtcbnZhciBtb2RpZmllciA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2RpZmllcicpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzO1xudmFyICQgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy4kIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC4kIDogbnVsbCk7XG5cbnZhciBzZXR0aW5ncyA9IHtcbiAgICBjb25mOiB7XG4gICAgICAgIGhpZ2hsaWdodFR5cGU6IHRydWVcbiAgICB9LFxuICAgIGhhc0dsb2JhbEhvb2tzOiB0cnVlXG59O1xuXG52YXIgZ2xvYmFsQ291bnQgPSAwO1xuXG5mdW5jdGlvbiBIaWdobGlnaHRlcigkalFPYmosIGNvbmYpIHtcbiAgICAvL3ZhciBzZWxmID0gdGhpcztcbiAgICBjbGFtX21vZHVsZS5hcHBseSh0aGlzLCBbJGpRT2JqLCBzZXR0aW5ncywgY29uZl0pO1xuICAgIHRoaXMuZXhwb3NlKCk7XG5cbiAgICB0aGlzLmxvY2FsQ291bnQgPSAwO1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcblxuICAgIHRoaXMuZ2V0SG9vaygnaGlnaGxpZ2h0Jykub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLnRvZ2dsZUhpZ2hsaWdodCwgdGhpcykpO1xuXG4gICAgdGhpcy5oaWdobGlnaHRNb2QgPSBuZXcgbW9kaWZpZXIoXG4gICAgICAgIHRoaXMuZ2V0SG9vaygnaGlnaGxpZ2h0JyksXG4gICAgICAgIHRoaXMubW9kdWxlLm5hbWVcbiAgICApO1xufVxuXG5pbmhlcml0cyhIaWdobGlnaHRlciwgY2xhbV9tb2R1bGUpO1xuXG5IaWdobGlnaHRlci5wcm90b3R5cGUudG9nZ2xlSGlnaGxpZ2h0ID0gZnVuY3Rpb24oZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmdldEhvb2soJ2dsb2JhbC1jb3VudGVyJykudGV4dCgrK2dsb2JhbENvdW50KTtcbiAgICB0aGlzLmdldEhvb2soJ2xvY2FsLWNvdW50ZXInKS50ZXh0KCsrdGhpcy5sb2NhbENvdW50KTtcblxuICAgIGlmICh0aGlzLmhpZ2hsaWdodE1vZC5nZXQoJ2hpZ2hsaWdodCcpKSB7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0TW9kLm9mZignaGlnaGxpZ2h0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5oaWdobGlnaHRNb2Quc2V0KCdoaWdobGlnaHQnLCB0aGlzLm1vZHVsZS5jb25mLmhpZ2hsaWdodFR5cGUpO1xuICAgIH1cbn07XG5cbkhpZ2hsaWdodGVyLnByb3RvdHlwZS5pbmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oaWdobGlnaHRNb2Quc2V0KCdpbmFjdGl2ZScsIHRydWUpO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG59O1xuXG5IaWdobGlnaHRlci5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmhpZ2hsaWdodE1vZC5zZXQoJ2luYWN0aXZlJywgZmFsc2UpO1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSGlnaGxpZ2h0ZXI7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY3V0aWwgPSByZXF1aXJlKCdjbGFtL2NvcmUvdXRpbCcpO1xudmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xudmFyIGNsYW1fY29udGFpbmVyID0gcmVxdWlyZSgnY2xhbS9jb3JlL2NvbnRhaW5lcicpO1xudmFyIGhpZ2hsaWdodGVyID0gcmVxdWlyZSgnLi9oaWdobGlnaHRlcicpO1xuLy92YXIgbW9kaWZpZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kaWZpZXInKTtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0cztcblxudmFyIHNldHRpbmdzID0ge1xuICAgIHR5cGU6ICdzaW5nbGV0b24nLFxuICAgIC8vIGhhc0dsb2JhbEhvb2tzOiB0cnVlLFxuICAgIGNvbmY6IHt9XG59O1xuXG5mdW5jdGlvbiBIaWdobGlnaHRlckFjdGl2YXRvcigkalFPYmosIGNvbmYpIHtcbiAgICAvL3ZhciBzZWxmID0gdGhpcztcbiAgICBjbGFtX21vZHVsZS5hcHBseSh0aGlzLCBbJGpRT2JqLCBzZXR0aW5ncywgY29uZl0pO1xuICAgIHRoaXMuZXhwb3NlKCk7XG4gICAgLy8gdGhyb3cgdGhpcy5wcmV0dGlmeSgnZXJyb3InKTtcbiAgICBcbiAgICB0aGlzLmFsbEFjdGl2YXRlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5nZXRIb29rKCdhY3RpdmF0ZS1idG4nKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuYWN0aXZhdGUsIHRoaXMpKTtcbn1cblxuaW5oZXJpdHMoSGlnaGxpZ2h0ZXJBY3RpdmF0b3IsIGNsYW1fbW9kdWxlKTtcblxuSGlnaGxpZ2h0ZXJBY3RpdmF0b3IucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuYWxsQWN0aXZhdGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5hbGxBY3RpdmF0ZWQgPSB0cnVlO1xuXG4gICAgY2xhbV9jb250YWluZXIuZ2V0KCdtZXNzYWdlJykubWVzc2FnZSgnU3VjY2Vzc2Z1bCBtb2R1bCBhY3RpdmF0aW9uIScpO1xuXG4gICAgdGhpcy5nZXRIb29rKCdhY3RpdmF0ZS1idG4nKS5mYWRlT3V0KCczMDAnKTtcblxuICAgIHZhciBwcm90b3R5cGVzID0gY3V0aWwuY3JlYXRlUHJvdG90eXBlcyhoaWdobGlnaHRlciwge30sICQoJyNoaWdobGlnaHRlci0yJykpO1xuICAgICQuZWFjaChwcm90b3R5cGVzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5hY3RpdmF0ZSgpO1xuICAgIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlckFjdGl2YXRvcjtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjbGFtX21vZHVsZSA9IHJlcXVpcmUoJ2NsYW0vY29yZS9tb2R1bGUnKTtcbi8vdmFyIGNsYW1fbW9kdWxlID0gcmVxdWlyZSgnY2xhbS9jb3JlL21vZHVsZScpO1xuLy92YXIgY2xhbV9jb250YWluZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvY29udGFpbmVyJyk7XG52YXIgbW9kaWZpZXIgPSByZXF1aXJlKCdjbGFtL2NvcmUvbW9kaWZpZXInKTtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0cztcblxudmFyIHNldHRpbmdzID0ge1xuICAgIHR5cGU6ICdzaW5nbGV0b24nLFxuICAgIGhhc0dsb2JhbEhvb2tzOiB0cnVlLFxuICAgIGNvbmY6IHtcbiAgICAgICAgZmFkZU91dFRpbWU6IDUwMFxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIE1lc3NhZ2UoJGpRT2JqLCBjb25mKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGNsYW1fbW9kdWxlLmFwcGx5KHRoaXMsIFskalFPYmosIHNldHRpbmdzLCBjb25mXSk7XG4gICAgdGhpcy5leHBvc2UoKTtcbiAgICAvLyB0aHJvdyB0aGlzLnByZXR0aWZ5KCdlcnJvcicpO1xuICAgIC8vIGNsYW1fY29udGFpbmVyLmdldCgnY2xhbS1tb2R1bGUnKTtcblxuICAgIHRoaXMubWVzc2FnZU1vZCA9IG5ldyBtb2RpZmllcihcbiAgICAgICAgdGhpcy5tb2R1bGUuJG9iamVjdCxcbiAgICAgICAgdGhpcy5tb2R1bGUubmFtZVxuICAgICk7XG5cbiAgICB0aGlzLmlzT3BlbiA9ICEhdGhpcy5tZXNzYWdlTW9kLmdldCgndHlwZScpO1xuICAgIFxuICAgIHRoaXMuZ2V0SG9va3MoJ3Rlc3QtYnRuJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAkKHRoaXMpLm9uKCdjbGljaycsICQucHJveHkoc2VsZi50ZXN0Q2xpY2ssIHNlbGYsICQodGhpcykpKTtcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLmdldEhvb2tzKCdjbG9zZS1idG4nKS5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuY2xvc2UsIHRoaXMpKTtcbn1cblxuaW5oZXJpdHMoTWVzc2FnZSwgY2xhbV9tb2R1bGUpO1xuXG5NZXNzYWdlLnByb3RvdHlwZS5tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSwgdHlwZSkge1xuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdHlwZSA9ICdzdWNjZXNzJztcbiAgICB9XG5cbiAgICB0aGlzLm1lc3NhZ2VNb2Quc2V0KCd0eXBlJywgdHlwZSk7XG4gICAgdGhpcy5nZXRIb29rKCdtZXNzYWdlJykudGV4dChtZXNzYWdlKTtcblxuICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgdGhpcy5tb2R1bGUuJG9iamVjdC5mYWRlSW4oMzAwKTtcbiAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICAgIH1cbn07XG5cbk1lc3NhZ2UucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24obWVzc2FnZSwgdHlwZSkge1xuICAgIHRoaXMubW9kdWxlLiRvYmplY3QuZmFkZU91dCgzMDApO1xuICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG59O1xuXG5NZXNzYWdlLnByb3RvdHlwZS50ZXN0Q2xpY2sgPSBmdW5jdGlvbigkaG9vaykge1xuICAgIHZhciBjb25mID0gdGhpcy5nZXRIb29rQ29uZmlndXJhdGlvbigkaG9vayk7XG4gICAgdGhpcy5tZXNzYWdlKGNvbmYubWVzc2FnZSwgY29uZi50eXBlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZTtcbiIsIi8vIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBkeW5hbWljLmpzIG1vZHVsZS4gU2luY2Ugc29tZSBwcm90b3R5cGVzIGFyZVxuLy8gaW5zdGFudGlhdGVkIGluIHRoZSBhcHAuanMgYW5kIGFsc28gaW4gdGhlIG1vZHVsZSBpdHNlbGYgbGF0ZXIgb24sXG4vLyBJIHNhdmVkIHRoZSBjb25maWd1cmF0aW9uLCBzbyB0aGF0IEkgZG9uJ3QgaGF2ZSB0byB1cGRhdGUgaXQgYXQgdHdvXG4vLyBkaWZmZXJlbnQgaWYgY2hhbmdlcyB3ZXJlIG5lZWRlZC5cbi8vIFRvIGV4cGVyaW1lbnQsIGp1c3QgY2hhbmdlIG9uZSBvZiB0aGUgdmFsdWVzIGZyb20gdHJ1ZSB0byBmYWxzZS5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFsbG93QWRkU2libGluZzogdHJ1ZSxcbiAgICBhbGxvd0FkZEVtYmVkZGVkOiB0cnVlXG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5NdXRhdGlvbk9ic2VydmVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcblxuICAgIGlmIChjYW5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgIHZhciBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWVMaXN0ID0gcXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBxdWV1ZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoaGlkZGVuRGl2LCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGhpZGRlbkRpdi5zZXRBdHRyaWJ1dGUoJ3llcycsICdubycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiJdfQ==
