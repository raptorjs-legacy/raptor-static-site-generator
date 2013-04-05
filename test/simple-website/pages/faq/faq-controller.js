exports.controller = function(page) {
    var deferred = require('raptor/promises').defer();
    
    setTimeout(function() {
        deferred.resolve({
            name: 'FAQ',
            count: 50
        });
    }, 200);

    return deferred.promise;
}