const Glob = require('../index.js')
describe('Glob', function() {
    var globInstance = null;
    beforeAll(async function() {
        globInstance = new Glob()
    });

    it('test', function() {
        globInstance.addRule('****', 'test/{...}/{filename}')
        globInstance.addRule('*.route', 'route')
        globInstance.addRule('*.route2', '{`extreal.substring(1)`}')
        globInstance.addRule('config.php', 'configphp')
        globInstance.addRule('src/*.php', 'src-*-php')
        globInstance.addRule('**/*.json', 'json/{...}/{filename}')
        globInstance.addRule('test/**/*.es', 'test/{...}/../{filename}')
        globInstance.addRule('test/**/*.*', 'test/{...}/../all/{filename}')
        globInstance.addRule('test/dir/**/*.*', 'test/{0}/{1}-{2}/{filename}')
        globInstance.addRule('**/api/model/**/*.*', 'test/build/server/model/{...globs[0]}/{globs[1][1]}/{filename}')
        globInstance.addRule('**/apis/*/model/**/*.*', 'test/apis/server/model/{...globs[0]}/{globs[1]}/{globs[2]}/{filename}')
        globInstance.addRule('**/apis/*/*/*.js', 'test/js/{globs[1]}-{globs[2]}{filename}')
        globInstance.addRule('com/**/test', 'com/{...}/test/ok')
        globInstance.addRule('com/*/test/api/*', 'com/{...}/test/api/{1}')
        globInstance.addRule('com/*/test/api/**', 'coms/{0}/test/api/{globs[1]}/{basename}')
        globInstance.addRule('com/**/apis/**', 'comss/{-2}/{0}/test/api/{globs[1]}/{basename}')
        globInstance.addRule('element-ui/packages/***', 'element-plus/es/components/{...}/{basename}')

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
        expect('route').toEqual( globInstance.dest('element-ui/packages/from.route') )
        expect('route2').toEqual( globInstance.dest('element-ui/packages/from.route2') )
        expect('configphp').toEqual( globInstance.dest('element-ui/packages/config.php') )
        expect('src-*-php').toEqual( globInstance.dest('element-ui/packages/src/config.php') )

    })

})


describe('ex',()=>{

    var glob = null;
    beforeAll(async function() {
        glob = new Glob()
    });

    it('test', function() {

        glob.addRule('****', 'full/{...}/{filename}')
        glob.addRule('**/*.json', 'json/{...}/{filename}')
        glob.addRule('src/**/*.es', 'test/{...}/../{filename}')
        glob.addRule('given/***', (id)=>{
            if(id.endsWith('.png')){
                return 'proxy/'+id
            }
            //If does not return, next rule of matched to processed
        })
        
        glob.addRule('given/**/*.jpg', 'image/{1}/{2}-{filename}')
        glob.addRule('global:///given/abs/***', 'abs/{...}')
        glob.addRule('**/fullpath/***', '{globs[1]}/{filename}')

        glob.addRule('fullpath/***', '{...}/{filename}', 0, 'image')
       
        
        //Matching rule 1
        let res = glob.dest('admin/api/http/Index.es') //output: full/admin/api/http/Index.es
        expect('full/admin/api/http/Index.es').toEqual( res)
        
        //Matching rule 3
        res = glob.dest('src/api/http/Index.es') //output: test/src/api/Index.es
        expect('test/api/Index.es').toEqual( res)
        
        //Matching rule 2
        res = glob.dest('test/karma/config.json') //output: json/test/karma/config.json
        expect('json/test/karma/config.json').toEqual( res)
        
        //Matching rule 4
        res = glob.dest('given/abs/profile/static/person.png') //output: proxy/given/abs/profile/static/person.png
        expect('proxy/given/abs/profile/static/person.png').toEqual( res)
        
        //Matching rule 5
        res = glob.dest('given/abs/profile/static/person.jpg') //output: image/profile/static-person.jpg
        expect('image/profile/static-person.jpg').toEqual( res)

        expect('abs/static').toEqual( glob.dest('global:///given/abs/static/person.jpg') )
        expect('image/fullpath/test-person.jpg').toEqual( glob.dest('D:/given/abs/fullpath/test/static/person.jpg') )
        expect('image/test/static-person.jpg').toEqual( glob.dest('D:/given/abs/test/static/fullpath/person.jpg') )

        expect('iii/person.jpg').toEqual(glob.dest('D:/given/abs/test/static/fullpath/iii/person.jpg::image') )

        expect('images/person.jpg').toEqual( glob.dest('D:/given/abs/test/static/fullpath/images/person.jpg::image')  )



    })


})
