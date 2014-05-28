var expect = require('expect.js');
var context = require('../');


function Foo() /*@module com.example.Foo */{
}

context.call(function(foo /*@inject com.example.Foo*/){
    expect(foo).to.be(undefined); // no register
});

context.register(Foo);

context.call(function(foo /*@inject com.example.Foo*/){

    expect((foo instanceof Foo)).to.be(true);
});

context.call(function(foo /*@inject com.example.mistake.Foo*/){
    expect(foo).to.be(undefined);
});

context.call(function(foo1 /*@inject com.example.Foo*/,foo2 /*@inject com.example.Foo*/){
    expect((foo1 == foo2)).to.be(true); // default @singleton
});


function Bar() /*@module com.example.Bar | @prototype */ {}
context.register(Bar);
context.call(function(foo1 /*@inject com.example.Bar */,foo2 /*@inject com.example.Bar */){
    expect((foo1 == foo2)).to.be(false); // @prototype
});

function Func()/*@module com.example.Func | @function */{}
context.register(Func);

context.call(function(func /*@inject com.example.Func*/){
    expect((func instanceof Function)).to.be(true); // function injection
    expect((func == Func)).to.be(true);
    var f = new func();
    expect((f instanceof Func)).to.be(true);
    
});
context.call(function(func1 /*@inject com.example.Func*/,func2 /*@inject com.example.Func*/){
    expect((func1 == func2)).to.be(true);
});

function ProtoFunc()/*@module com.example.ProtoFunc | @prototype | @function*/ {
}
ProtoFunc.prototype.foo = function(){
    return 'foo';
}
context.register(ProtoFunc)
context.call(function(Proto1 /*@inject com.example.ProtoFunc*/
    ,Proto2 /*@inject com.example.ProtoFunc*/){
    var proto1 = new Proto1();
    var proto2 = new Proto2();
    expect((proto1 instanceof ProtoFunc)).to.be(true);
    expect((proto2 instanceof ProtoFunc)).to.be(true);
    expect((proto1 == proto2)).to.be(false);
    expect(proto1.foo()).to.be('foo');
    expect(proto2.foo()).to.be('foo');
    
     
});

console.log("succeed.");
