
var context = require("../");
context.scan("./");


// context.register(Speak, new Speak());

// var foo = context._new(Foo); // newしたければ勝手にどうぞ
// foo.fooCall();
// var bar = context._new(Bar);
// bar.barCall();
// context.register(Foo);
// context.register(Bar);
var speak = require('./lib/speak');
context.scan(__dirname);


context.call(function(fooinstance /*@inject  com.example.Foo */ , a, barinstance /*@inject Bar*/ , b) {
    fooinstance.fooCall(); // foo
    console.log(a); // 1
    barinstance.barCall(); // bar
    console.log(b); // 2
}, 1, 2);
context.call(function() {
    console.log("no args");
});
var other = context.call()