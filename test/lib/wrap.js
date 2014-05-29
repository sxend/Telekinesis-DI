(function() {
	var expect = require('expect.js');
	var context = require('../../');
	var Func = function Func(value /*@inject "value"*/ ) /*@module com.example.wrap.InjectFunction*/ {
		this.value = value;
	}
	context.register(Func);
	var wrap = function(
		func /*@inject com.example.wrap.InjectFunction*/ ,
		arg /*@inject "arg!"*/ ) {
		this.func = func;
		this.arg = arg;

	}
	var Wrap = context.wrap(wrap);
	var wrapped = new Wrap();

	expect((wrapped.func instanceof Func)).to.be(true);
	expect(wrapped.arg == 'arg!').to.be(true);
})();