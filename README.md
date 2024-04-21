# glob-path
Use glob pattern match or replace a string 

# APIs

glob.addRule
glob.addRules
glob.scheme
glob.dest
glob.parse

**Extensitions**
glob.addExt
glob.addExts

# Rules

`****` Full matching
`***` Matching paths and basename and extensition
`**` Matching paths
`*` Matching pathname or basename or extname

# Globs

Portion of each asterisk segments is parsed into glob array object. except for the basename parts

# Replaces

`{expressions}` Delimiter expression, where the value of the resolved asterisk is replaced here.

# Expressions

`{filename}` Replace the value of the filename
`{basename}` Replace the value of the filename and extname
`{extname}` Replace the value of the extension but not contain the dot
`{ext}` Replace the value of the extension and contain the dot
`{...}` Replace the value of all globs
`{index}` Replace the value at this index of all globs
`{globs[0]}` Replace the value of the globs array index
`{globs[1].slice(0,-2)}` Replace the value of the globs expressions

# Path Parse

`..` Replace with the previous pathname

# Examples

```js

const glob = new Glob()
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
glob.dest('admin/api/http/Index.es') //output: full/admin/api/http/Index.es

//Matching rule 3
glob.dest('src/api/http/Index.es') //output: test/src/api/Index.es

//Matching rule 2
glob.dest('test/karma/config.json') //output: json/test/karma/config.json

//Matching rule 4
glob.dest('given/abs/profile/static/person.png') //output: proxy/given/abs/profile/static/person.png

//Matching rule 5
glob.dest('given/abs/profile/static/person.jpg') //output: image/profile/static-person.jpg

```