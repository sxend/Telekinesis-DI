
var Bar = function(speak /*@inject Speak*/ , message /*@inject "bar"*/ ) /*@module Bar*/ {
    this.speak = speak;
    this.message = message;
};
Bar.prototype.barCall = function() {
    this.speak.say(this.message);
};

module.exports = Bar;