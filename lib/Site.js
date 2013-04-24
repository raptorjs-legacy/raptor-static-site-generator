var File = require('raptor/files/File');

function Site() {
    this._includeFilenamesInUrls = true;
    this._outputDir = null;
    this._currentOutputDir = null;
}

Site.prototype = {
    clone: function() {
        var clone = new Site();
        require('raptor').extend(clone, this);
        return clone;
    },

    setOutputDir: function(outputDir) {
        if (typeof outputDir === 'string') {
            outputDir = new File(outputDir);
        }
        this._outputDir = outputDir;
    },

    setCurrentOutputDir: function(currentOutputDir) {
        if (typeof currentOutputDir === 'string') {
            currentOutputDir = new File(currentOutputDir);
        }
        this._currentOutputDir = currentOutputDir;
    },


    url: function(url) {

        var isIndexHtml = url.lastIndexOf('.') === -1 || url.charAt(url.length-1) === '/';

        url = require('path').relative(this._currentOutputDir.getAbsolutePath(), this._outputDir.getAbsolutePath()) + url;

        if (isIndexHtml) {
            //The URL is a page
            if (url.charAt(url.length-1) !== '/') {
                url += '/';
            }
            if (this._includeFilenamesInUrls !== false) {
                url += 'index.html';
            }
        }

        if (url.charAt(0) === '/') {
            url = '.' + url;
        }


        return url;
    }
}

module.exports = Site;