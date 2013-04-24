var nodePath = require('path'),
    File = require('raptor/files/File'),
    Page = require('./Page'),
    pathFilters = require('path-filters'),
    raptor = require('raptor'),
    templateFinders = [
        function(dir, ext) {
            return new File(dir, "index." + ext);
        },
        function(dir, ext) {
            return new File(dir, dir.getName() + '.' + ext);
        },
        function(dir, ext) {
            var files = dir.listFiles();
            for (var i=0,len=files.length; i<len; i++) {
                var file = files[i];

                if (file.getExtension() === ext) {
                    return file;
                }
            }
            return null;
        }
    ];

var PageFinder = function() {
    this._baseDir = null;
    this._resourceSearchPathDir = undefined;
    this._singlePage = null;
    this._includes = pathFilters.create();
    this._excludes = pathFilters.create();
    this._templateExtensions = {};
    this.templateExtension("rhtml");

};

PageFinder.prototype = {
    templateExtension: function(ext) {
        this._templateExtensions[ext] = true;
        return this;
    },

    resourceSearchPathDir: function(path) {
        this._resourceSearchPathDir = path;
        return this;
    },

    include: function(filter) {
        this._includes.add(filter);
        return this;
    },

    exclude: function(filter) {
        this._excludes.add(filter);
        return this;
    },

    singlePage: function(pageName) {
        this._singlePage = pageName;
        return this;
    },

    baseDir: function(path) {
        this._baseDir = path;
        return this;
    },    

    findPages: function() {
        var baseDir = this._baseDir;
        if (baseDir) {
            if (typeof baseDir === 'string') {
                baseDir = new File(nodePath.resolve(process.cwd(), baseDir));
            }
        }



        var foundPages = [];
        var baseDirPath = baseDir.getAbsolutePath();
        var resourceSearchPathDir = this._resourceSearchPathDir;
        var excludes = this._excludes;
        var includes = this._includes;
        var singlePage = this._singlePage;
        var templateExtensionsLookup = this._templateExtensions;
        var templateExtensions = Object.keys(templateExtensionsLookup);
        
        if (resourceSearchPathDir === undefined) {
            var searchPath = require('raptor/resources').getSearchPath();
            searchPath.forEachEntry(function(entry) {
                if (entry.getDir) {
                    var searchPathDir = '' + entry.getDir();
                    if (baseDirPath.startsWith(searchPathDir)) {
                        resourceSearchPathDir = searchPathDir;
                    }
                }
            }, this);
        }

        function handleTemplate(templateFile) {
            var path = templateFile.getAbsolutePath();
            if (excludes.hasMatch(path)) {
                return;
            }

            if (!includes.hasMatch(path) && (!includes.isEmpty() || !excludes.isEmpty())) {
                return;
            }

            var relativePath = templateFile.getParent().substring(baseDirPath.length),
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
            var controllerPath = nodePath.join(templateFile.getParent(), templateFile.getNameWithoutExtension() + '-controller.js');

            var controllerFile = new File(controllerPath);
            if (!controllerFile.exists()) {
                controllerFile = null;
            }

            outputPath = relativePath + '/index.html';

            if (outputPath.startsWith('/')) {
                outputPath = outputPath.substring(1);
            }

            
            var page = new Page();
            raptor.extend(page, {
                templateFile: templateFile,
                templateResourcePath: templateResourcePath,
                outputPath: outputPath,
                name: pageName,
                path: path,
                controllerFile: controllerFile
            });

            foundPages.push(page);
        }

        function findTemplateFile(dir) {

            for (var i=0, len=templateFinders.length; i<len; i++) {
                for (var j=0; j<templateExtensions.length; j++) {
                    

                    var templateFile = templateFinders[i](dir, templateExtensions[j]);
                    if (templateFile && templateFile.exists()) {
                        return templateFile;
                        
                    }  
                }
                
            }
            return null;
        }

        if (singlePage) {
            var pagePath = singlePage;
            var templateFile;

            var lastDot = pagePath.lastIndexOf('.');

            if (lastDot !== -1 && templateExtensionsLookup.hasOwnProperty(pagePage.substring(lastDot+1))) {
                var templatePath = pagePath;
                templateFile = new File(nodePath.resolve(process.cwd(), templatePath));
                if (templateFile.exists()) {
                    // See if the template file is an absolute path
                    handleTemplate(templateFile);
                }
                else {
                    if (templatePath.startsWith('/')) {
                        templatePath = templatePath.substring(1);
                    }
                    // Try the template as path relative to the base pages directory
                    templateFile = new File(baseDir, templatePath);
                    if (templateFile.exists()) {
                        handleTemplate(templateFile);
                    }
                    else {
                        throw new Error("Invalid page: " + singlePage);
                    }
                }
            }
            else {
                if (pagePath.startsWith('/')) {
                    pagePath = pagePath.substring(1);
                }
                var pageDir = new File(baseDir, pagePath);
                if (pageDir.exists()) {
                    templateFile = findTemplateFile(pageDir);    
                }
                
                if (templateFile) {
                    handleTemplate(templateFile);
                }
                else {
                    throw new Error("Invalid page: " + singlePage);
                }
            }
        }
        else
        {

            require('raptor/files/walker').walk(
                baseDir, 
                function(file) {
                    if (file.isDirectory()) {

                        var templateFile = findTemplateFile(file);

                        if (templateFile) {
                            handleTemplate(templateFile);
                        }
                    }
                },
                this);
        }
            

        return foundPages;
    }
};

module.exports = PageFinder;