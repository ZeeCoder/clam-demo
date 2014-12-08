var test = require('./test');
var inherits = require('util').inherits;

function TestExtension() {
    test.apply(this, arguments);

    this.addEventListener('onHighlightClick', function() {
        this.log('-- onHighlightClick');
        console.log(arguments);
    });

    this.addEventListener('preHighlightClick', function() {
        this.log('-- preHighlightClick');
    });

    this.addEventListener('postHighlightClick', function() {
        this.log('-- postHighlightClick');
    });

    this.addEventListener('preHiClick', function() {
        this.log('-- preHiClick');
    });
}

inherits(TestExtension, test);

module.exports = TestExtension;
