var popup = require('./popup');
var inherits = require('util').inherits;

function PopupExtension() {
    popup.apply(this, arguments);

    this.test2Opened = 0;
    this.registerHooks(['test2-custom-element']);

    this.addEventListener('preOpenClick', function(conf, backtracking) {
        if (conf.type === 'test2') {
            this.getHook('test2-custom-element').text('Test2 popup opened times: ' + ++this.test2Opened);
        }
    });
}

inherits(PopupExtension, popup);

module.exports = PopupExtension;
