var should = require('chai').should(),
    path = require('path');

require('raptor');



describe('page-writer', function(){
    describe('#writePages()', function(){
        it('should find all pages and write them', function(done) {

            require('../index').writePages(
                {
                    basePagesDir: path.join(__dirname, 'simple-website/pages'),
                    baseOutputDir: path.join(__dirname, 'build'),
                })
                .then(function(writer) {
                        writer.writtenPages.should.have.length(3);
                        done();
                    },
                    function(e) {
                        done(e);                    
                    });


        });
    })
});