var context = require('../../');

var Speak = function() /*@module Speak */ {};

Speak.prototype.say = function(message) {
    console.log(message);
};

module.exports = context.register(Speak);