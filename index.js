const path = require('path');
const slashSplitterRegexp = /(?<!\\)[\/]+/;
const keyScheme = Symbol('scheme');
class Glob{

    #rules = [];
    #initialized = false;
    #cache = {};
    #extensions = {};

    addExt(group, ext){
        this.#extensions[group] = ext;
    }

    addExts(data={}){
        Object.keys(data).forEach(key=>{
            this.addExt(key, data[key]);
        });
    }

    addRules(rules, group=null, data={}){
        Object.keys(rules).forEach(key=>{
            this.addRule(key,data[key],0,group,data);
        });
    }

    addRuleGroup(pattern, target, group, data={}){
        this.addRule(pattern, target, 0, group, data)
    }

    addRule(pattern, target, priority=0, group=null, data={}){
        let type = pattern instanceof RegExp ? 'regexp' : typeof pattern;
        let method = typeof target;
        let segments = [];
        let asterisks = 0;
        let protocol = null;
        let suffix = null;
        let prefix = false;
        let full = false;
        if(type ==='string'){
            pattern = pattern.trim();
            let pos = pattern.indexOf(':///')
            if(pos>0){
                protocol = pattern.substring(0, pos);
                pattern = pattern.substring(pos+4);
            }

            if(pattern.charCodeAt(0) === 94){
                prefix = true;
                pattern = pattern.substring(1)
            }
        
            segments =  pattern.replace(/^\/|\/$/).split( slashSplitterRegexp );
            asterisks = (pattern.match(/(?<!\\)\*/g)||[]).length;

            let last = segments[segments.length-1];
            let rPos = last.lastIndexOf('.');
            if(rPos > 0 && last.includes('*')){
                let lPos = last.indexOf('.');
                if( lPos !== rPos){
                    const pattern = last.replace(/\./g,'\\.').replace(/[\*]+/g, ()=>{
                        return '(.*?)'
                    });
                    suffix = new RegExp('^'+pattern+'$');
                }
            }

            if(pattern.includes('****')){
                if(segments.length>1){
                    throw new TypeError(`Glob the '****' full match pattern cannot have separator.`)
                }
                full = true;
            }else if(pattern.includes('***')){
               const at = pattern.indexOf('***');
               if(at<pattern.length-3){
                    throw new TypeError(`Glob the '***' full match pattern should is at the pattern ends.`)
               }
               full = true;
            }else if(/\*\*\.\w+$/.test(pattern)){
                throw new TypeError(`Glob the '**.ext' file match pattern should have a separator between the two asterisks. as the '*/*.ext'`)
            }else if(/\*{4,}/.test(pattern)){
                throw new TypeError(`Glob the '***' full match pattern should is three asterisks.`)
            }
        }else if( !(type ==='regexp' || type ==='function') ){
            throw new TypeError(`Glob pattern must is regexp or string or function`)
        }

        if(method==='function'){
            method = true;
        }else if(method ==='string'){
            method = false;
        }else if(target){
            throw new TypeError(`Glob the 'target' argument must is string or function`)
        }
        this.#rules.push({
            pattern,
            suffix,
            prefix,
            target,
            protocol,
            segments,
            asterisks,
            priority,
            group,
            type,
            full,
            method,
            data,
            setValue(prefix, name, value){
                if(arguments.length===2){
                    return data[prefix] = name;
                }else if(arguments.length===3){
                    let dataset = data[prefix] || (data[prefix] = {});
                    return dataset[name] = value;
                }
                return false;
            },
            getValue(prefix, name=null){
                if(arguments.length===1){
                    return data[prefix];
                }
                let dataset = data[prefix] || (data[prefix] = {});
                return dataset[name]
            }
        });
        this.#initialized=false;
    }

    removeRules(){
        this.#initialized=false;
        return this.#rules.splice(0, this.#rules.length);
    }

    removeRule(pattern){
        this.#initialized=false;
        pattern = typeof pattern === 'function' ? pattern : (rule)=>rule.pattern === pattern;
        const index = this.#rules.findIndex(pattern);
        if(index>=0){
            return this.#rules.splice(index, 1)
        }
        return null;
    }

    #init(){
        this.#rules.sort((a, b)=>{
            if(a.priority<b.priority)return -1;
            if(a.priority>b.priority)return 1;

            if(a.type==='regexp' || a.type==='function')return -1;
            if(b.type==='regexp' || b.type==='function')return 1;
            if(a.prefix && a.asterisks===0)return -1;

            let a1 = a.segments.length;
            let b1 = b.segments.length;
            if(a.full && !b.full){
                return 1;
            }

            if(a1>b1)return -1;
            if(a1<b1)return 1;
            let a2 = a.asterisks;
            let b2 = b.asterisks;
            return a2 - b2;
        });
        this.#initialized=true;
    }

    matchRule(rule, segments, basename, extname, globs=[]){
        let paths = rule.segments;
        let suffix = rule.suffix
        let len = paths.length-1;
        let base = paths[len];
        let globPos = -1;
        globs.length = 0;
        if(base==='****'){
            globs.push(segments.slice(0, -1));
            return true;
        }

        if(!rule.prefix && !paths[0].startsWith('*') && segments[0] !== paths[0]){
            const matchAt = segments.indexOf( paths[0] );
            if(matchAt<0){
                return false;
            }else{
                segments = segments.slice(matchAt);
            }
        }

        if(segments.length < paths.length)return false;

        if( base!=='***' && segments[segments.length-1] !== base ){
            if(suffix){
                if(!suffix.test(basename+(extname||''))){
                    return false
                }
            }else{
                if(extname && !(base.endsWith(extname) || base.endsWith('.*'))){
                    return false;
                }else if(basename !== base && !base.startsWith('*')){
                    return false;
                }else if(base.includes('.') && !extname){
                    return false;
                }
            }
        }

        if(paths.length===1)return true;
        if(segments.length > paths.length && !(paths.includes('**') || paths.includes('***'))  ){
            return false;
        }
        
        const push=(end)=>{
            if(globPos>=0){
                globs.push(segments.slice(globPos,end));
                globPos = -1;
            }
        }
        let offset = 0;
        let at = 0;
        let i=0;
        for(;i<len;i++){
            let segment = paths[i];
            at = offset+i;
            if(segment === segments[at]){
                push(at)
                continue;
            }else if(segment==='**'){
                let next = paths[i+1];
                if(next && !next.startsWith('*') && next !== base){
                    let start = at;
                    while(start<segments.length && (next !== segments[++start]));
                    if(next !== segments[start]){
                        return false;
                    }
                    offset = start-at-1;
                }
                globPos = at;
                continue;
            }else if(segment ==='*'){
                push(at)
                globs.push([segments[at]]);
                continue;
            }
            return false;
        }
        push(-1);
        if(base==='**' || base==='***'){
            at++;
            globPos = at;
            push(-1);
        }
        return true;
    }

    scheme(id, ctx={}, excludes=null){
        if(!this.#initialized){
            this.#init();
        }

        id = String(id).trim();

        let group = ctx.group || null;
        let gPos = id.lastIndexOf('::');
        if(gPos>0){
            group = id.substring(gPos+2);
            id = id.substring(0, gPos);
        }

        let normalId = id.replace(/\\/g,'/').replace(/^\/|\/$/g,'');
        let extname = ctx.extname || group && this.#extensions[group] || null;
        let extreal = '';
        let delimiter = ctx.delimiter || '/';
        let key = [normalId,String(group),delimiter,String(extname)].join(':')
        if(!excludes && this.#cache.hasOwnProperty(key)){
            return this.#cache[key];
        }

        let pos = normalId.indexOf(':///')
        let protocol = null;
        if(pos>0){
            protocol = normalId.substring(0, pos);
            normalId = normalId.substring(pos+4);
        }

        let segments = normalId.split(slashSplitterRegexp);
        let basename = segments[segments.length-1];
        let dotAt = basename.lastIndexOf('.');
        let result = null;
        let globs = [];
        if(dotAt>=0){
            extreal = basename.slice(dotAt);
            if(!extname){
                extname = extreal;
            }
            basename = basename.substring(0, dotAt);
        }

        for(let rule of this.#rules){
            if(excludes){
                if(excludes===rule)continue;
                if(Array.isArray(excludes) && excludes.includes(rule))continue;
            }
            if(rule.group !== group){
                continue;
            }
            if(rule.protocol!==protocol){
                continue;
            }
            if(rule.type==='function'){
                if(rule.pattern(id, ctx, rule)){
                    result = rule;
                    break;
                }
            }else if(rule.type==='regexp'){
                if(rule.pattern.test(id)){
                    result = rule;
                    break;
                }
            }else if(rule.pattern===id || rule.pattern===normalId){
                result = rule;
                break;
            }else if(this.matchRule(rule, segments, basename, extname, globs)){
                result = rule;
                break;
            }
        }

        const args = result ? globs.flat() : [];
        const old = this.#cache[key];
        if(!result && old){
            return old;
        }

        return this.#cache[key] = {
            segments,
            basename,
            extname,
            extreal,
            args,
            globs,
            protocol,
            id,
            normalId,
            rule:result,
            value:null,
            [keyScheme]:true
        }
    }

    dest(id, ctx={}){
        return this.parse(this.scheme(id, ctx), ctx);
    }

    parse(scheme, ctx={}){
        const defaultValue = ctx.failValue !== void 0 ? ctx.failValue : false;
        if(!scheme || !scheme.rule || scheme[keyScheme]!==true)return defaultValue;
        const {basename,extname,rule,args,value, id, extreal} = scheme;
        if(!rule.target){
            return rule.target;
        }
        if(value && scheme.cache !== false){
            return value;
        }
        if(rule.method){
            let _result = rule.target(id, scheme, ctx, this);
            if(_result === void 0){
                let _scheme = scheme;
                let _excludes = [rule];
                let _records = new WeakSet([_scheme]);
                while(_result === void 0){
                    _scheme = this.scheme(_scheme.id, ctx, _excludes);
                    if(_records.has(_scheme)){
                        break;
                    }
                    _records.add(_scheme);
                    if(_scheme && _scheme.rule){
                        _excludes.push(_scheme.rule);
                        _result = this.parse(_scheme, ctx)
                    }else{
                        break;
                    }
                }
            }
            return scheme.value = _result;
        }
        const delimiter = ctx.delimiter || '/';
        const _value = rule.target.replace(/(?<!\\)\{(.*?)\}/g, (_, name)=>{
            name = name.trim();
            if(name.startsWith('...')){
                name = name.substring(3).trim();
                if(!name){
                    return args.join('/')
                }
            }
            const isExpr = name.charCodeAt(0)===96 && name.charCodeAt(name.length-1)===96;
            if(isExpr){
                name = name.slice(1,-1);
            }
            if(isExpr || name.startsWith('globs')){
                try{
                    let _globs = eval(`(${name.replace(/\bglobs\b/g,'scheme.globs')})`);
                    _globs = Array.isArray(_globs) ? _globs.flat() : [_globs];
                    return _globs.join('/')
                }catch(e){
                    console.log(e)
                    throw new ReferenceError(`\`${name}\` expression invalid`)
                }
            }else if(name==='basename'){
                return basename;
            }else if(name==='filename'){
                return `${basename}${extname||''}`;
            }else if(name==='extname'){
                return (extname||'').substring(1);
            }else if(name==='ext'){
                return extname||'';
            }else if(name==='extreal'){
                return extreal||'';
            }else if(/-?\d+/.test(name)){
                if(name[0]==='-'){
                    name = args.length - Number(name.substring(1));
                }
                return args[name] || '';
            }else if(name==='group'){
                return ctx[name] || '';
            }
            if(ctx.data && Object.prototype.hasOwnProperty.call(ctx.data, name)){
                return String(ctx.data[name]);
            }
            return '';
        });
        return scheme.value = path.normalize(_value).split(/[\\\/]+/).filter(Boolean).join(delimiter);
    }

}

module.exports = Glob;

