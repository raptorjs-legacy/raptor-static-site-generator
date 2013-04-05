var raptor = require('raptor');


var PageWriter = require('./PageWriter');
var PageFinder = require('./PageFinder');

exports.PageWriter = PageWriter;
exports.PageFinder = PageFinder;


function findPages(config) {
    var pageFinder = new PageFinder(config);
    return pageFinder.findPages();
}

function createPageWriter(config) {
    return new PageWriter(config);
}

function writePages(config, pages) {
    if (!pages) {
        pages = findPages(config);
    }

    return this.createPageWriter(config).writePages(pages);
}


exports.createPageWriter = createPageWriter;
exports.writePages = writePages;
exports.findPages = findPages;