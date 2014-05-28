
var Foo = function(speak /*@inject Speak*/ , message /*@inject "foo" */ ) /*@module com.example.Foo*/ {
    this.speak = speak;
    this.message = message;
};
Foo.prototype.fooCall = function() {
    this.speak.say(this.message);
};

module.exports = Foo;