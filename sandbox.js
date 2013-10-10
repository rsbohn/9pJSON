var root = require('./ixp').mkroot();
var maybe = require('./maybe').maybe;

root.mkdir('/dev');
root.mkfile('/dev/cons',
    undefined,
    function(f,p){return "-nothing-";},
    function(f,p){console.log("f="+f+" p="+p);},
    undefined);

var cons = root.lookup("/dev/cons", true);
cons.write(null, "line1");
cons.write(null, "line2");
var k = cons.read(null, null);
cons.write(null, k);

maybe(cons.close).orElse(function(){})();
