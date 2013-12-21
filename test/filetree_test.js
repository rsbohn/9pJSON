var util = require("../ixputil"),
	ixp = require("../ixp");

var root = ixp.mkroot();
root.mkdir("/a").mkdir("b");
root.mkdir("/a/a").mkdir("b");
root.mkdir("/a/nother");
root.mkdir("/cows");

//lookup should return a directory
exports["find a file"] = function(test){
  test.strictEqual(ixp.isDir(root.lookup("/a/a/b")),
	true);
  test.done();
};

//child nodes should be able to lookup
exports.lookup_nother = function(test){
  var fixture = root.lookup('/a').lookup('nother');
  test.equals(fixture.name, "nother", "lookup failure");
  test.done();
};
//should throw an error if path is not found
exports["throws not found"] = function(test){
  test.throws(function(){
      root.lookup("/a/c");
    }, /not found/);
  test.done();
};

//files
exports.mkfile = function(test){
  var k = {open: null, read: null, write: null, close: null};
  var parent = root.lookup('/a/b', false);
  var fixture = parent.mkfile("file0", k.open, k.read, k.write, k.close);
  test.ok(ixp.isFile(fixture));
  test.equals(fixture.name, "file0");
  test.done();
};
