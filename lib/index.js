var raptor = require('raptor');


var Generator = require('./Generator');
var PageFinder = require('./PageFinder');

exports.Generator = Generator;
exports.PageFinder = PageFinder;

exports.create = function() {
    var generator = new Generator();
    return generator;
}

