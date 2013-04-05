var should = require('chai').should(),
    path = require('path');

require('raptor');


describe('page-finder', function(){
    describe('#findPages()', function(){
        it('should find all pages', function(){
            
            var pages = require('../index').findPages({
                basePagesDir: path.join(__dirname, 'simple-website/pages'),
                resourceSearchPathDir: path.join(__dirname, 'simple-website/pages')
            });

            var pageIndex = {};

            pages.forEach(function(page) {
                pageIndex[page.path] = page;
            });
            //console.error(pages);
            //console.log('Found pages: ', pageIndex);
            
            pageIndex['/'].name.should.equal('index');
            pageIndex['/'].path.should.equal('/');
            pageIndex['/'].outputPath.should.equal('index.html');
            pageIndex['/'].templateFile.exists().should.equal(true);

            pageIndex['/faq'].name.should.equal('faq');
            pageIndex['/faq'].path.should.equal('/faq');
            pageIndex['/faq'].outputPath.should.equal('faq/index.html');
            pageIndex['/faq'].templateFile.exists().should.equal(true);
            pageIndex['/faq'].controllerFile.exists().should.equal(true);

            pageIndex['/docs/testing'].name.should.equal('docs-testing');
            pageIndex['/docs/testing'].path.should.equal('/docs/testing');
            pageIndex['/docs/testing'].outputPath.should.equal('docs/testing/index.html');
            pageIndex['/docs/testing'].templateFile.exists().should.equal(true);

            pages.should.have.length(3);
        });
    })
});