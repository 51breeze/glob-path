const Glob = require('../index.js')
describe('Glob', function() {
    var globInstance = null;
    beforeAll(async function() {
        globInstance = new Glob()
    });

    it('test', function() {
        globInstance.addRule('****', 'test/{...}/{basename}')
        globInstance.addRule('**/*.json', 'json/{...}/{basename}')
        globInstance.addRule('test/**/*.es', 'test/{...}/../{basename}')
        globInstance.addRule('test/**/*.*', 'test/{...}/../all/{basename}')
        globInstance.addRule('test/dir/**/*.*', 'test/{0}/{1}-{2}/{basename}')
        globInstance.addRule('**/api/model/**/*.*', 'test/build/server/model/{...globs[0]}/{globs[1][1]}/{basename}')
        globInstance.addRule('**/apis/*/model/**/*.*', 'test/apis/server/model/{...globs[0]}/{globs[1]}/{globs[2]}/{basename}')
        globInstance.addRule('**/apis/*/*/*.js', 'test/js/{globs[1]}-{globs[2]}{basename}')
        globInstance.addRule('com/**/test', 'com/{...}/test/ok')
        globInstance.addRule('com/*/test/api/*', 'com/{...}/test/api/{1}')
        globInstance.addRule('com/*/test/api/**', 'coms/{0}/test/api/{globs[1]}/{filename}')
        globInstance.addRule('com/**/apis/**', 'comss/{-2}/{0}/test/api/{globs[1]}/{filename}')
        globInstance.addRule('element-ui/packages/***', 'element-plus/es/components/{...}/{filename}')

        expect('test/src/api/http/Index.es').toEqual( globInstance.dest('src/api/http/Index.es') )
        expect('test/src/api/Index.es').toEqual( globInstance.dest('test/src/api/http/Index.es') )
        expect('test/src/api/all/Index.js').toEqual( globInstance.dest('test/src/api/http/Index.js') )
        expect('test/build/server/model/test/com/test/Category.es').toEqual( globInstance.dest('test/com/api/model/category/test/Category.es') )
        expect('json/src/assets/front/met.json').toEqual( globInstance.dest('src/assets/front/met.json') )
        expect('test/dev/src-controller/http.es').toEqual( globInstance.dest('test/dir/dev/src/controller/http.es') )
        expect('test/apis/server/model/test/prod/person/test/com/Category.es').toEqual( globInstance.dest('test/prod/apis/person/model/test/com/Category.es') )
        expect('test/js/hash-prodindex.js').toEqual( globInstance.dest('test/prod/apis/hash/prod/index.js') )
        expect('com.test.http.test.ok').toEqual( globInstance.dest('com/test/http/test', {delimiter:'.'}) )
        expect('com.http.test.api').toEqual( globInstance.dest('com/http/test/api/dev', {delimiter:'.'}) )
        expect('coms.http.test.api.dev.cc.name').toEqual( globInstance.dest('com/http/test/api/dev/cc/name', {delimiter:'.'}) )
        expect('comss.dev.http.test.api.dev.cc.name').toEqual( globInstance.dest('com/http/test/apis/dev/cc/name', {delimiter:'.'}) )
        expect('element-plus/es/components/from').toEqual( globInstance.dest('element-ui/packages/from') )

    })

})


describe('ex',()=>{

    var glob = null;
    beforeAll(async function() {
        glob = new Glob()
    });

    it('test', function() {

        glob.addRule('****', 'full/{...}/{basename}')
        glob.addRule('**/*.json', 'json/{...}/{basename}')
        glob.addRule('src/**/*.es', 'test/{...}/../{basename}')
        glob.addRule('src/**/*.es', 'test/{...}/../{basename}')
        glob.addRule('given/***', (id)=>{
            if(id.endsWith('.png')){
                return 'proxy/'+id
            }
            //If does not return, next rule of matched to processed
        })
        
        glob.addRule('given/**/*.jpg', 'image/{1}/{2}-{basename}')

        
        //Matching rule 1
        let res = glob.dest('admin/api/http/Index.es') //output: full/admin/api/http/Index.es
        expect('full/admin/api/http/Index.es', res)
        
        //Matching rule 3
        res = glob.dest('src/api/http/Index.es') //output: test/src/api/Index.es
        expect('test/src/api/Index.es', res)
        
        //Matching rule 2
        res = glob.dest('test/karma/config.json') //output: json/test/karma/config.json
        expect('json/test/karma/config.json', res)
        
        //Matching rule 4
        res = glob.dest('given/abs/profile/static/person.png') //output: proxy/given/abs/profile/static/person.png
        expect('proxy/given/abs/profile/static/person.png', res)
        
        //Matching rule 5
        res = glob.dest('given/abs/profile/static/person.jpg') //output: image/profile/static-person.jpg
        expect('image/profile/static-person.jpg', res)

    })


})
