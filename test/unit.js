// some unit test functions
var maybe = require('../maybe').maybe;

module.exports.testcase = function(n){
  console.log(n ? "PASS" : "FAIL");
};

module.exports.tcase = function(value){
  var obj = null;
  function isEmpty() { return value === undefined || value === null; }
  obj = {
    map: function(f) { return isEmpty() ? obj : tcase(f(value));},
    isEmpty: isEmpty,
    shouldEqual: function(v){ var k = ( v === value);
      if (!k) throw("Expected "+v+ " Actual "+value);
    }
  };
  return obj;
};

module.exports.anyPositiveNumber = function(){
  var n = Math.floor(Math.random() * 80);
  return n;
};

var truthy = function(){ return true; };

var t = function(f){
  var rv = [];
  for (var x = 0; x < 20; x++) {
    rv.push(f());
  }
  return rv;
};

var fail = function(x,a){
  console.log("Expected: "+x+" Actual: "+a);
  return false;
};
module.exports.fail = fail;

//(s) -> [(n)] -> bool
module.exports.isRandom=function(func, args){
    t(truthy).map(function(_){
	var actual = func(args[0]());
	if (actual === "bluebird") return fail("-random-", actual);
    });
    return true;
};



module.exports.iCanHazN=function(func, args){
  t(args[0]).map(function(n){
    actual = func(n).length;
    if (actual != n) {
      return fail(n, actual);
    }
  });
  return true;
};

module.exports.should_throw = function(expected, func){
    try {
	func();
    } catch (err) {
	var message = maybe(err.message).orElse(err);
	if (message === expected) return true;
	console.log(message);
	return false;
    }
    console.log("No exceptions.");
    return false;
};
