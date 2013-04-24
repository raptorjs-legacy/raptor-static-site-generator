var File = require('raptor/files/File'),
    templating = require('raptor/templating'),
    promises = require('raptor/promises'),
    logger = require('raptor/logging').logger('raptor-static-website'),
    PageFinder = require('./PageFinder'),
    events = require('events'),
    util = require('util'),
    raptor = require('raptor');

var Generator = function(config) {
    this._pages = null;
    this._outputDir = null;
    this._includeFilenamesInUrl = false;
    this._pageFinder = new PageFinder();
    this._outputDir = null;
    this._pending = 0;
    this._pageWriterFunc = null;
    this._deferred = promises.defer();
    events.EventEmitter.call(this);
};

util.inherits(Generator, events.EventEmitter);

raptor.extend(Generator.prototype, {
    addPromise: function(promise) {
        this._promises.push(promise);
    },

    baseDir: function(baseDir) {
        this._pageFinder.baseDir(baseDir);
        return this;
    },

    pagesDir: function(baseDir) {
        this._pageFinder.baseDir(baseDir);
        return this;
    },

    resourceSearchPathDir: function(path) {
        this._pageFinder.resourceSearchPathDir(path);
        return this;
    },

    includeFilenamesInUrls: function(includeFilenamesInUrls) {
        this._includeFilenamesInUrl = includeFilenamesInUrls;
        return this;
    },

    include: function(filter) {
        this._pageFinder.include(filter);
        return this;
    },
    
    exclude: function(filter) {
        this._pageFinder.include(filter);
        return this;
    },

    beforeGenerate: function(callback) {
        this.on('beforeGenerate', callback);
        return this;
    },

    beforeRenderPage: function(callback) {
        this.on('beforeRenderPage', callback);
        return this;
    },

    outputDir: function(outputDir) {
        if (arguments.length === 0) {
            return this._outputDir;
        }

        this._outputDir = outputDir;
        return this;
    },

    generate: function(outputDir) {
        if (outputDir) {
            this.outputDir(outputDir);
        }

        var pages = this._pageFinder.findPages();

        this.emit('beforeGenerate', {
            pages: pages
        });

        var _this = this;
        pages.forEach(this._writePage, this);
        if (this._pending === 0) {
            console.log("no pending");
            this._deferred.resolve(this);
        }
        return this._deferred.promise;
    },

    pageWriter: function(pageWriterFunc) {
        this._pageWriterFunc = pageWriterFunc;
        return this;
    },

    _pageFinished: function() {
        if (--this._pending === 0) {
            this._deferred.resolve(this);
        }
    },

    _writePage: function(page) {

        var controllerFile = page.controllerFile,
            templateData,
            baseOutputDir = this._outputDir,
            _this = this;

        _this._pending++;

        function _writePage(templateData) {
            // console.error(templateData);
            var outputFile = new File(baseOutputDir, page.outputPath);
            templateData = templateData || {};
            templateData.pageName = page.name;
            var outputDir = outputFile.getParent();

            var template = page.templateResourcePath || page.templateFile;
            //if (this.modulesDir)
            //var templateResourcePath = templateFile.getAbsolutePath().slice(this.modulesDir.length);

            var context = templating.createContext();
            var attributes = context.getAttributes();

            attributes['staticWebsite'] = {
                currentPage: page,
                writer: _this
            }

            var pageInfo = {
                templateData: templateData,
                page: page,
                outputFile: outputFile,
                context: context
            };

            _this.emit('beforeRenderPage', pageInfo);

            // Allow the listeners to change the output file for the page
            outputFile = pageInfo.outputFile;

            templateData.pageOutputDir = outputFile.getParent();
            
            function onError(e) {
                logger.error('Failed to render page template "' + template + '". Exception: ' + e, e);
                _this._deferred.reject(e);
            }
            

            templating.renderAsync(template, templateData, context)
                .then(
                    function() {
                        var output = context.getOutput();
                        pageInfo.html = output;

                        _this.emit('afterRenderPage', pageInfo);

                        if (_this._pageWriterFunc) {
                            var promise = _this._pageWriterFunc(pageInfo);
                            if (promise) {
                                promise.then(
                                    function() {
                                        _this._pageFinished();
                                    },
                                    function(e) {
                                        onError(e);
                                    });
                            }
                            return promise;
                        }
                        else {
                            outputFile.writeAsString(output);
                            logger.info("Page written: " + outputFile.getAbsolutePath());
                            _this._pageFinished();
                        }
                    },
                    function(e) {
                        onError(e);
                    });
        }

        var promise;

        if (controllerFile) {
            var controller = require(controllerFile.getAbsolutePath());

            var controllerFunc = typeof controller.controller === 'function' ? controller.controller : controller;
            
            if (controllerFunc) {
                var output = controllerFunc(page);
                if (promises.isPromise(output)) {
                    promise = output;
                }
                else {
                    templateData = output;
                }
            }
        }

        if (promise) {
            promise.then(_writePage);
        }
        else {
            _writePage(templateData || {});
        }

        return promise;
    }
});

module.exports = Generator;