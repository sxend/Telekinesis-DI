Telekinesis DI
===========

** Annotation Based DI Library **

```javascript
var context = require("../");
context.scan(__dirname + '/lib');

context.call(function(fooinstance /*@inject  com.example.Foo */ , a, barinstance /*@inject Bar*/ , b) {
    fooinstance.fooCall(); // foo
    console.log(a); // 1
    barinstance.barCall(); // bar
    console.log(b); // 2
}, 1, 2);

var ConstInjection = require('./lib/const');

var c = new ConstInjection();
c.invoke(); // const

var Foo = require('./lib/foo');
context.call(function(speak /*@inject Speak*/ ) {
    new Foo(speak, "newFoo").fooCall(); // newFoo
});
context.call(function(constInjection1 /*@inject ConstInjection*/ , constInjection2 /*@inject ConstInjection*/ ) {

    console.log(constInjection1 === constInjection2); // true
    console.log(c === constInjection1); //false

});
context.call(function() {
    console.log("no arguments");
});
```
