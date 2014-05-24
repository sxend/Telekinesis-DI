var context = require("../");
context.scan(__dirname);
console.log(context.__container);
context.call(function(fooinstance /*@inject  com.example.Foo */ , a, barinstance /*@inject Bar*/ , b) {
	fooinstance.fooCall(); // foo
	console.log(a); // 1
	barinstance.barCall(); // bar
	console.log(b); // 2
}, 1, 2);
context.call(function() {
	console.log("no args");
});
var ConstInjection = require('./lib/const');
var c = new ConstInjection();
c.invoke(); // const
context.call(function(constInjection1 /*@inject ConstInjection*/ ) {
	context.call(function(constInjection2 /*@inject ConstInjection*/ ) {
		console.log(constInjection1 === constInjection2); // true
		console.log(c === constInjection1); //false
	});
});
context.call(function(func /*@inject functionModule*/){
	context.call(func);
});