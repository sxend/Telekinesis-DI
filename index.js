'use strict';

var AnnotationScanner = function() {
    this.annotationAreaRegex = /^function(.*?){/
    this.typeAnnotationsRegex = /.*\) *(\/\*(.*)\*\/)/
    this.argumentAreaRegex = /\(.*\)/
    this.annotationRegex = /\/\* *?(@.*?)\*\//
}

AnnotationScanner.prototype.__annotationAreaExtract = function(funcString) {
    return funcString.match(this.annotationAreaRegex)[1].trim();
}
AnnotationScanner.prototype.__sliceAnnotation = function(annotationArea) {
    return annotationArea.split('|');
}

AnnotationScanner.prototype.__typeAnnotationsExtract = function(annotationArea) {
    var typeAnnotations = annotationArea.match(this.typeAnnotationsRegex);
    return typeAnnotations ? this.__sliceAnnotation(typeAnnotations[2].trim()) : null;
}
AnnotationScanner.prototype.__argumentAreaExtract = function(annotationArea) {
    return annotationArea.match(this.argumentAreaRegex)[0]
}

AnnotationScanner.prototype.__argAnnotationExtract = function(argumentArea) {
    var scanner = this;
    return argumentArea.slice(1, argumentArea.length - 1).split(',').map(function(arg) {
        return arg.trim();
    }).map(function(arg, index) {
        var ann = arg.match(scanner.annotationRegex);
        return ann ? scanner.__sliceAnnotation(ann[1].trim()) : null;
    });
}
AnnotationScanner.prototype.extract = function(obj) {
    var context = this;
    if (obj instanceof Array) {
        return obj.map(function(func) {
            return _extract(func);
        });
    } else {
        return _extract(obj);
    }

    function _extract(func) {
        var result = {
            argAnnotations: null,
            typeAnnotations: null
        }
        if (!(typeof func === 'function')) {
            return result;
        }
        var annotationArea = context.__annotationAreaExtract(func.toString());

        var typeAnnotations = context.__typeAnnotationsExtract(annotationArea);

        var argumentArea = context.__argumentAreaExtract(annotationArea);

        var argAnnotations = context.__argAnnotationExtract(argumentArea);

        result.argAnnotations = argAnnotations;
        result.typeAnnotations = typeAnnotations;
        return result;
    }
}
AnnotationScanner.prototype.annotationValue = function(annotations, regex) {
    
    for (var i = 0 ;i<annotations.length ; i++) {
        var value = annotations[i].match(regex);
        if (value) {
            return value[1].trim();
        }
    }
    return null;
}

var Context = function Context() {
    this.__annotationScanner = new AnnotationScanner();
    this.__container = {};
}
Context.prototype.register = function(Type, instance) {
    var context = this;
    var metadata = context.__annotationScanner.extract(Type);
    if (!metadata.typeAnnotations) {
        return Type;
    }
    var moduleValue = context.__annotationScanner.annotationValue(metadata.typeAnnotations, /@module *(.*)/);
    var typeValue = context.__annotationScanner.annotationValue(metadata.typeAnnotations, /@type *(function|object)/);

    if (moduleValue) {

        if (!instance) {
            switch (typeValue) {
                case 'function':
                    instance = Type;
                    break;
                case 'object':
                default:
                    instance = context._new(Type);
            }
        }

        context.__container[moduleValue] = instance;

        var lazyInjection = function lazyInjection(object) {
            Object.keys(object).forEach(function(key) {
                var value = object[key];
                if (value instanceof PlaceHolder && value.typeName == moduleValue) {
                    object[key] = instance;
                } else if (typeof value == 'object') {
                    lazyInjection(value);
                }
            });
        }
        lazyInjection(context.__container);
    }

    return Type;

}
var PlaceHolder = function(typeName) {
    this.typeName = typeName;
}
Context.prototype.argmentResolve = function(func, thisArgs, localContainer) {
    var context = this;
    localContainer = localContainer || {};
    var metadata = this.__annotationScanner.extract(func);

    return metadata.argAnnotations.map(function(anns) {
        if (!anns) {
            return thisArgs.shift();
        }

        var result = context.__annotationScanner.annotationValue(anns, /@inject *(.*)/);
        if (result) {
            var valueInjection = result.match(/"(.*)"/);
            var scopedInjection = result.match(/\[(.*)\]/);
            var resultValue = undefined;
            if (context.__container[result]) {
                resultValue = context.__container[result];
            }
            if (valueInjection) {
                resultValue = valueInjection[1];
            }
            if (scopedInjection) {
                resultValue = localContainer[scopedInjection[1]];
            }
            

            return resultValue || new PlaceHolder(result);

        }

    });
}
Context.prototype._new = function() {
    var thisArgs = Array.prototype.slice.call(arguments);
    var Type = thisArgs.shift();
    var args = this.argmentResolve(Type, thisArgs);

    function construct(type, args) {
        function F() {
            return type.apply(this, args);
        }
        F.prototype = type.prototype;
        return new F();
    }
    return construct(Type, args);
}
Context.prototype.call = function() {
    var thisArgs = Array.prototype.slice.call(arguments);
    var func = thisArgs.shift();
    var args = this.argmentResolve(func, thisArgs);
    return func.apply(this, args);
};
Context.prototype.scan = function(path) {

    if (!(typeof require === 'function')) {
        return;
    }
    var fs;
    var _path;
    try {
        _path = require('path');
        fs = require('fs');
    } catch (e) {
        return;
    }
    var context = this;

    function read(path) {
        var files = fs.readdirSync(path);
        if (!files) {
            return;
        } else {
            files.map(function(file) {

                var fqdn = _path.join(path, file);
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
    read(path);
}
Context.prototype.wrap = function(origin) {
    var context = this;
    var wrapped = function() {
        var that = this;
        var injected = context._new(origin);
        Object.keys(injected).forEach(function(key) {
            that[key] = injected[key];
        });
    };
    wrapped.prototype = origin.prototype;
    return wrapped;
};


module.exports = new Context();