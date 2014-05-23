var context = require("../");
var Speak = function() /*@module Speak */ {};

Speak.prototype.say = function(message) {
    console.log(message);
};

var Foo = function(speak /*@inject Speak*/ , message /*@inject "foo" */ ) /*@module com.example.Foo*/ {
    this.speak = speak;
    this.message = message;
};
Foo.prototype.fooCall = function() {
    this.speak.say(this.message);
};
var Bar = function(speak /*@inject Speak*/ , message /*@inject "bar"*/ ) /*@module Bar*/ {
    this.speak = speak;
    this.message = message;
};
Bar.prototype.barCall = function() {
    this.speak.say(this.message);
};

context.register(Speak, new Speak());

// var foo = context._new(Foo); // newしたければ勝手にどうぞ
// foo.fooCall();
// var bar = context._new(Bar);
// bar.barCall();
context.register(Foo);
context.register(Bar);

context.call(function(fooinstance /*@inject  com.example.Foo */ , a, barinstance /*@inject Bar*/ , b) {
    fooinstance.fooCall(); // foo
    console.log(a); // 1
    barinstance.barCall(); // bar
    console.log(b); // 2
}, 1, 2);
context.call(function() {
    console.log("no args");
});