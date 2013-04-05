var File = require('raptor/files/File'),
    templating = require('raptor/templating'),
    promises = require('raptor/promises'),
    logger = require('raptor/logging').logger('raptor-static-website');

var PageWriter = function(config) {
    this.baseTemplatesDir = config.baseTemplatesDir;
    this.baseOutputDir = config.baseOutputDir;
    this.urlsIncludeFilename = config.urlsIncludeFilename;
    this.promises = [];
    this.writtenPages = [];
};

PageWriter.prototype = {
    writePages: function(pages) {
        var _this = this;
        pages.forEach(this.writePage, this);
        var deferred = promises.defer();

        promises.all(this.promises)
            .then(function() {
                deferred.resolve(_this);
            },
            function(e) {
                deferred.reject(e);
            });
        return deferred.promise;
    },

    writePage: function(page) {



        var controllerFile = page.controllerFile,
            templateData,
            baseOutputDir = this.baseOutputDir,
            _this = this;

        function _writePage(templateData) {
            // console.error(templateData);
            var outputFile = new File(baseOutputDir, page.outputPath);
            templateData = templateData || {};
            templateData.pageName = page.name;
            templateData.pageOutputPath = outputFile.getParent();

            var template = page.templateResourcePath || page.templateFile;
            //if (this.modulesDir)
            //var templateResourcePath = templateFile.getAbsolutePath().slice(this.modulesDir.length);

            var context = templating.createContext();
            var attributes = context.getAttributes();

            attributes['staticWebsite'] = {
                currentPage: page,
                writer: _this
            }

            templating.render(template, templateData, context);
            outputFile.writeAsString(context.getOutput());

            _this.writtenPages.push(page);
            logger.info("Page written: " + outputFile.getAbsolutePath());
        }

        var promise;

        if (controllerFile) {
            var controller = require(controllerFile.getAbsolutePath());

            var controllerFunc = typeof controller.controller === 'function' ? controller.controller : controller;
            
            if (controllerFunc) {
                var output = controllerFunc(page);
                if (promises.isPromise(output)) {
                    promise = output;
                    this.promises.push(promise)
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
};

module.exports = PageWriter;