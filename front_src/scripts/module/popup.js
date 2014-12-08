var clam_module = require('../../bower_components/clam/core/module');
var modifier = require('../../bower_components/clam/core/modifier');
var inherits = require('util').inherits;

var settings = {
    name: 'popup',
    type: 'singleton',
    defConf: {
        backtrackingEnabled: true
    },
    events: [
        'preOpenClick'
    ],
    hooks: [
        'close-btn',
        'open-btn',
        'wrapper'
    ]
};

function Popup($jQObj, conf) {
    clam_module.apply(this, [$jQObj, settings, conf]);
    this.expose();
}

inherits(Popup, clam_module);

Popup.prototype.initializeHooks = function() {
    this.addHookEvent('close-btn', 'click', true);
    this.addHookEvent('open-btn', 'click', true);
};

Popup.prototype.initializeProperties = function() {
    this.animation = {
        timeout: 300,
        lock: false
    };
    this.eventNamespace = '.' + this.module.name;
    this.isOpened = false;
    this.previousPopups = [];
    this.modifier = new modifier(this.module.$object, 'popup');
};

Popup.prototype.onOpenBtnClick = function(hook, e) {
    e.preventDefault();
    this.open(this.getHookConfiguration($(hook)));
};

Popup.prototype.onCloseBtnClick = function(hook, e) {
    e.preventDefault();
    this.close();
};

Popup.prototype.open = function(conf, backtracking) {
    var self = this;
    if (this.animation.lock) {
        return false;
    }

    this.triggerEvent('preOpenClick', arguments);

    if (
        this.isOpened &&
        !backtracking &&
        this.module.conf.backtrackingEnabled
    ) {
        this.previousPopups.push(this.modifier.get('show'));
        this.modifier.on('backtracking');
    }

    this.lock();
    this.modifier.set('show', conf.type);

    var $wrapper = this.getHook('wrapper');
    var marginTop = $(window).scrollTop();
    if ($('#medium-up').css('display') !== 'none') {
        marginTop += 50; // 50 -> margin top
    }

    $wrapper.css({
        marginTop: marginTop
    });
    this.module.$object.css({
        left: 0
    });

    if (this.isOpened) {
        this.unlock();
    } else {
        this.unlockIfDone();
    }


    if (!this.isOpened) {
        $(document)
            .on('click' + this.eventNamespace, function(e) {
                if (e.target === self.module.$object[0]) {
                    self.previousPopups = [];
                    self.modifier.off('backtracking');
                    self.close();
                }
            })
            .on('keyup' + this.eventNamespace, function(e) {
                if (e.keyCode == 27) {
                    self.close();
                }
            });
    }

    this.isOpened = true;

    return true;
};

Popup.prototype.close = function() {
    if (this.animation.lock) {
        return false;
    }

    if (this.previousPopups.length > 0) {
        if (this.previousPopups.length === 1) {
            this.modifier.off('backtracking');
        }
        var prevPopupType = this.previousPopups.pop();
        this.open({type: prevPopupType}, true);

        return true;
    }

    this.lock();

    this.isOpened = false;
    this.modifier.on('hide');
    this.unlockIfDone(true);

    $(document).unbind(this.eventNamespace);

    return true;
};

Popup.prototype.lock = function() {
    this.animation.lock = true;
};

Popup.prototype.unlock = function() {
    this.animation.lock = false;
};

Popup.prototype.unlockIfDone = function(isClosing) {
    var self = this;

    setTimeout(function() {
        self.animation.lock = false;
        if (isClosing) {
            self.modifier.off('show');
            self.modifier.off('hide');
            self.module.$object.css({
                left: -99999
            });
        }
    }, this.animation.timeout);
};

module.exports = Popup;
