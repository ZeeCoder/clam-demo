var test = require('./module/test');
var popup_extension = require('./module/popup_extension');
var test_extension = require('./module/test_extension');
var cutil = require('../bower_components/clam/core/util');
var attachFastClick = require('fastclick');

cutil.createModulesByArray([
        test
    ],
    {},
    $('#tests-1')
);

specTest = new test_extension($('#tests-2 .jsm-test:nth(0)'));

cutil.createModulesByArray([popup_extension]);


$(function() {
    attachFastClick(document.body);
});
