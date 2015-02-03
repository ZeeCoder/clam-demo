'use strict';
// Scroller.js module extension
var clam_scroller = require('clam-scroller/module/scroller');
// var clam_container = require('clam/core/container');
// var modifier = require('clam/core/modifier');
var $ = require('jquery');
var inherits = require('util').inherits;
// var q = require('q');

function ScrollerExt($jQObj, conf) {
    var self = this;
    clam_scroller.apply(this, arguments);
    // this.expose();

    this.addEventListener('beforeScroll', this.beforeScroll);
}

inherits(ScrollerExt, clam_scroller);

ScrollerExt.prototype.beforeScroll = function() {
    console.log('A Before Scroll event occured.');

    // Returning false would stop the scrolling.
    // return false;
    
    // To test a delayed effect with q's promises, uncomment the following code.
    // Don't forget to uncomment the require('q') row at the start of this file.
    // var deferred = q.defer();
    // setTimeout(function(){
    //     deferred.resolve();
    // }, 1000); // 1 second delay before the scrolling effect

    // return deferred.promise;
};

module.exports = ScrollerExt;
