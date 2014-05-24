var context = require('../../');
var ConstInjection = context.register(function ConstInjection(value /*@inject Speak*/) /*@module ConstInjection*/{
	this.value = value;
});
ConstInjection.prototype.invoke = function(){
	this.value.say("const");
};
module.exports = context.wrap(ConstInjection);