var context = require('../../');
var ConstInjection = context.register(function ConstInjection(value /*@inject Speak*/ ) /*@module ConstInjection |@type function*/ {
	this.value = value;

});
ConstInjection.prototype.invoke = function() {
	this.value.say("const");
};
module.exports = ConstInjection;
module.exports = context.wrap(ConstInjection);