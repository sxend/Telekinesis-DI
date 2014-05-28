'use strict';
(function() {
    var AnnotationParser = require('telekinesis-annotation').AnnotationParser;

    var internal = {
        annotationParser: new AnnotationParser(),
        metadataContainer: {},
        container: {}
    };

    var Context = function Context() {

    }

    function find(arr, annotationName) {

        return arr.filter(function(annotation) {
            return annotation.name == annotationName;
        })[0];
    }

    Context.prototype.register = function(Type, instance) {
        if (!Type) {
            return;
        }

        var data = {
            metadata: null,
            isDirectory: false,
            instance: undefined
        }
        if (Type instanceof String) {
            data.instance = function(){
                return instance;
            };
            data.isDirect = true;
            internal.container[typeName] = data;
            return;
        }
        if (!(Type instanceof Function)) {
            return;
        }

        var parsedData = internal.annotationParser.parse(Type);
        var moduleAnnotation = find(parsedData.type, '@module');
        if (!moduleAnnotation) {
            return;
        }
        var typeName = moduleAnnotation.values[0] || "";
        var isFunction = !!find(parsedData.type, '@function');
        var isPrototype = !!find(parsedData.type, '@prototype');
        data.metadata = {
            raw: parsedData,
            isFunction: isFunction,
            isPrototype: isPrototype
        };

        data.isDirect = false;
        // data.instance = (isFunction || isPrototype) ? Type : _new(Type);
        data.instance = Type;
        internal.container[typeName] = data;
        return Type;
    }

    function _new() {

        var thisArgs = Array.prototype.slice.call(arguments);
        var Type = thisArgs.shift();
        if(!(Type instanceof Function)){
            return Type;
        }
        var parsedData = internal.annotationParser.parse(Type);
        var args = createArg(parsedData, thisArgs);

        function construct(type, args) {
            function F() {
                return type.apply(this, args);
            }
            F.prototype = type.prototype;
            return new F();
        }
        return construct(Type, args);
    }
    var PlaceHolder = function(typeName) {
        this.typeName = typeName;
    }

    function cloneObject(object) {
        var clone = (object instanceof Array) ? [] : {};
        Object.keys(object).forEach(function(key) {
            var value = object[key];
            clone[key] = (value instanceof Object) ? cloneObject(value) : value;

        });
        return clone;
    }

    function cloneFunction(Func) {

        function F(){};
        F.prototype = Func.prototype;
        Object.keys(Func).forEach(function(key) {
            var value = Func[key];
            F[key] = (value instanceof Object) ? cloneObject(value) : value;

        });

        return F;
    }

    function createInjectValue(injectAnnotationValue) {

        if(!injectAnnotationValue){
            return;
        }
        var quoteMatched = injectAnnotationValue.match(/"([\s\S]*)"/m);
        if(quoteMatched){
            return quoteMatched[1];
        }
        var data = internal.container[injectAnnotationValue];
        if(!data){
            return;
        }
        if (data.isDirect) {
            return data.instance();
        }

        if (data.metadata.isPrototype) {
            if (data.metadata.isFunction) {
                return cloneFunction(data.instance);
            } else {
                return cloneObject(data.instance);
            }
        }
        if(!data.metadata.isFunction){
            data.instance = _new(data.instance);
        }
         
        return data.instance;

    }

    function createArg(parsedData, thisArgs) {
        return parsedData.arg.map(function(arg) {
            var inject = find(arg.annotations, '@inject');
            if (!inject) {
                return thisArgs.shift();
            }
            var result = createInjectValue(inject.values[0]);
            return result;
        })

    }

    Context.prototype.call = function() {
        var thisArgs = Array.prototype.slice.call(arguments);
        var func = thisArgs.shift();
        if (!(func instanceof Function)) {
            return;
        }
        var parsedData = internal.annotationParser.parse(func);
        var args = createArg(parsedData, thisArgs);
        return func.apply(this, args);
    };

    Context.prototype.scan = function(dirname) {

        if (!(typeof require === 'function')) {
            return;
        }
        var fs = require('fs');
        var path = require('path');
        var context = this;

        function read(dirname) {
            var files = fs.readdirSync(dirname);
            if (!files) {
                return;
            } else {
                files.map(function(file) {

                    var fqdn = path.join(dirname, file);
                    var stat = fs.lstatSync(fqdn);
                    if (stat.isDirectory()) {
                        read(fqdn);
                    } else if (file.match(".js" + "$") == ".js") {
                        [].concat(require(fqdn)).map(function(module) {
                            context.register(module);
                        });
                    }
                });
            }
        }
        read(dirname);
    }
    Context.prototype.wrap = function(origin) {
        var context = this;
        var wrapped = function() {
            var that = this;
            var injected = _new(origin);
            Object.keys(injected).forEach(function(key) {
                that[key] = injected[key];
            });
        };
        wrapped.prototype = origin.prototype;
        return wrapped;
    };
    module.exports = new Context();
})();
