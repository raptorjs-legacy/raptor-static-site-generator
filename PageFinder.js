var path = require('path'),
    File = require('raptor/files/File'),
    templating = require('raptor/templating'),
    templateFinders = [
        function(dir) {
            return new File(dir, "index.rhtml");
        },
        function(dir) {
            return new File(dir, dir.getName() + '.rhtml');
        },
        function(dir) {
            var files = dir.listFiles();
            for (var i=0,len=files.length; i<len; i++) {
                var file = files[i],
                    filename = file.getName();

                if (filename.startsWith('index-') && filename.endsWith('.rhtml')) {
                    return file;
                }
                else if (filename.endsWith('-index.rhtml')) {
                    return file;
                }
            }
            return null;
        }
    ];

var PageFinder = function(config) {
    var basePagesDir = config.basePagesDir;
    if (typeof basePagesDir === 'string') {
        basePagesDir = new File(path.resolve(process.cwd(), basePagesDir));
    }
    this.basePagesDir = basePagesDir;
    this.resourceSearchPathDir = config.resourceSearchPathDir;
};

PageFinder.prototype = {
    findPages: function() {
        var foundPages = [],
            basePagesDirPath = this.basePagesDir.getAbsolutePath(),
            resourceSearchPathDir = this.resourceSearchPathDir;

        
        if (resourceSearchPathDir === undefined) {
            var searchPath = require('raptor/resources').getSearchPath();
            if (searchPath.hasDir(basePagesDirPath)) {
                resourceSearchPathDir = basePagesDirPath;
            }
        }

        function handlePage(templateFile) {
            var relativePath = templateFile.getParent().substring(basePagesDirPath.length),
                pageName,
                pathParts,
                pageName,
                outputPath,
                path,
                templateResourcePath;


            if (resourceSearchPathDir) {
                if (templateFile.getAbsolutePath().startsWith(resourceSearchPathDir)) {
                    templateResourcePath = templateFile.getAbsolutePath().substring(resourceSearchPathDir.length);    
                }
            }

            if (relativePath === '') {
                pageName = 'index';
                path = '/';
            }
            else {
                pathParts = relativePath.substring(1).split(/[\/\\]/)
                pageName = pathParts.join('-');    
                path = relativePath;
            }

            var templatePath = templateFile.getAbsolutePath();
            var controllerPath = templatePath.slice(0, 0-".rhtml".length) + "-controller.js";

            var controllerFile = new File(controllerPath);
            if (!controllerFile.exists()) {
                controllerFile = null;
            }

            outputPath = relativePath + '/index.html';

            if (outputPath.startsWith('/')) {
                outputPath = outputPath.substring(1);
            }

            
            foundPages.push({
                templateFile: templateFile,
                templateResourcePath: templateResourcePath,
                outputPath: outputPath,
                name: pageName,
                path: path,
                controllerFile: controllerFile
            });
        }

        require('raptor/files/walker').walk(
            this.basePagesDir, 
            function(file) {
                if (file.isDirectory()) {
                    for (var i=0, len=templateFinders.length; i<len; i++) {
                        var templateFile = templateFinders[i](file);
                        if (templateFile && templateFile.exists()) {
                            handlePage(templateFile);    
                        }
                    }
                }
            },
            this);

        return foundPages;
    }
};

module.exports = PageFinder;