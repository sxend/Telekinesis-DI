'use strict';

var AnnotationScanner = function() {
    this.annotationAreaRegex = /^function(.*?){/
    this.typeAnnotationRegex = /.*\) *(\/\*(.*)\*\/)/
    this.argumentAreaRegex = /\(.*\)/g
    this.annotationRegex = /\/\* *?(@.*?)\*\//
}

AnnotationScanner.prototype.__annotationAreaExtract = function(funcString) {
    return funcString.match(this.annotationAreaRegex)[1].trim();
}

AnnotationScanner.prototype.__typeAnnotationExtract = function(annotationArea) {
    var typeAnnotation = annotationArea.match(this.typeAnnotationRegex);
    return typeAnnotation ? typeAnnotation[2].trim() : null;
}
AnnotationScanner.prototype.__argumentAreaExtract = function(annotationArea) {
    return annotationArea.match(this.argumentAreaRegex)[0]
}

AnnotationScanner.prototype.__argAnnotationExtract = function(argumentArea) {
    var that = this;
    return argumentArea.slice(1, argumentArea.length - 1).split(',').map(function(arg) {
        return arg.trim();
    }).map(function(arg, index) {
        var ann = arg.match(that.annotationRegex);
        return ann ? ann[1].trim() : null;
    });
}
AnnotationScanner.prototype.extract = function(func) {
    var that = this;

    var annotationArea = this.__annotationAreaExtract(func.toString());

    var typeAnnotation = this.__typeAnnotationExtract(annotationArea);

    var argumentArea = this.__argumentAreaExtract(annotationArea);

    var argAnnotations = this.__argAnnotationExtract(argumentArea);

    var result = {
        argAnnotations: argAnnotations,
        typeAnnotation: typeAnnotation
    }
    return result;
}
AnnotationScanner.prototype.annotationValue = function(annotation, regex) {
    var value = annotation.match(regex);
    return value ? value[1] : null; 
}

var Context = function Context() {
    this.__annotationScanner = new AnnotationScanner();
    this.__container = {};
}
Context.prototype.register = function(Type, instance) {

    var metadata = this.__annotationScanner.extract(Type);
    if (!metadata.typeAnnotation) {
        return;
    }

    var result = this.__annotationScanner.annotationValue(metadata.typeAnnotation, /@module *(.*)/);

    if (result) {
        instance = instance || this._new(Type);
        this.__container[result] = instance;
    }

}
Context.prototype.argmentResolve = function(func, thisArgs) {
    var that = this;
    var metadata = this.__annotationScanner.extract(func);
    return metadata.argAnnotations.map(function(ann) {

        if (!ann) {
            return thisArgs.shift();
        }

        var result = that.__annotationScanner.annotationValue(ann, /@inject *(.*)/);
        if (result) {
            var valueInjection = result.match(/"(.*)"/);
            return valueInjection ? valueInjection[1] : that.__container[result];
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

module.exports = new Context();
