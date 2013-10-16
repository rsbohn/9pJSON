var unit = require("./unit"),
	ixp = require("./ixp");

console.log("ixp:");
var root = ixp.mkroot();
root.mkdir("/a").mkdir("b");
root.mkdir("/a/a").mkdir("b");
root.mkdir("/a/nother");
root.mkdir("/cows");

//lookup should return a directory
unit.testcase(ixp.isDir(root.lookup("/a/a/b", false)));
//child nodes should be able to lookup
exports.lookup_nother = function(test){
  var fixture = root.lookup('/a').lookup('nother');
  test.equals(fixture.name, "nother", "lookup failure");
  test.done();
};
//should throw an error if path is not found
unit.testcase(unit.should_throw("/a/c not found", function(){
    root.lookup("/a/c");
}));

//files
exports.mkfile = function(test){
  var k = {open: null, read: null, write: null, close: null};
  var parent = root.lookup('/a/b', false);
  var fixture = parent.mkfile("file0", k.open, k.read, k.write, k.close);
  test.ok(ixp.isFile(fixture));
  test.equals(fixture.name, "file0");
  test.done();
};

console.log("protocol 9p:");
console.log("should answer Tnonesuch with an error");
ixp.Service.answer({type:99, tag: 1998});

console.log("should answer Tversion with ???");
ixp.Service.answer({type:100, tag: 1999, version: "tablespoon"});

console.log("should answer Tauth with an error");
ixp.Service.answer({type:ixp.Tauth, tag: 2000});

ixp.Service.tree = root;
console.log("should allow first Tattach");
ixp.Service.answer({type:ixp.Tattach, tag: 2000, fid: 1812});

console.log("should fail second Tattach with same fid");
ixp.Service.answer({type:ixp.Tattach, tag: 2000, fid: 1812});

var fmt_dirent = [
"i2:size", "i2:type", "i4:dev", "b13:qid", 
"i4:mode", "i4:atime", "i4:mtime", "i8:length", 
"S2:name", "S2:uid", "S2:gid", "S2:muid"
];
var util = require('./ixputil');
var verbose = false;

ixp.Service.send9p = function(p){return p;};
exports.Tread = function(test) {
  verbose = false;
  if (verbose) { console.log(); }

  var request = {type:ixp.Tread, tag:2001, fid:1812, count:128, offset:0};
  var fixture =  ixp.Service.answer(request);
  if (verbose) { console.log("\n"+JSON.stringify(fixture));}
  test.equals(fixture.type, 117);
  test.equals(fixture.tag, 2001);
  var dent = util.unpack(fixture.data, fmt_dirent);
  if (verbose) { console.log(dent);}
  test.equals(dent.name, "a"); 
  test.equals(dent.mode & 0777, 0111);
  test.equals(dent.mode >>> 24, 0x80); //DMDIR >>> 24 (to avoid sign extension)

  request.offset += fixture.data.length;
  request.tag++;
  fixture = ixp.Service.answer(request);
  if (verbose) { console.log(fixture);}
  test.equals(fixture.type, ixp.Rread);
  test.equals(fixture.tag, request.tag);
  dent = util.unpack(fixture.data, fmt_dirent);
  test.equals(dent.name, 'cows');

  //at the end
  request.offset += fixture.data.length;
  fixture = ixp.Service.answer(request);
  if (verbose) { console.log(fixture);}
  test.equals(fixture.tag, request.tag);
  test.equals(fixture.data, '');

  //we're at the end+1, can we still read?
  //no need to update request.offset
  request.tag++;
  fixture = ixp.Service.answer(request);
  if (verbose) { console.log(fixture);}
  test.equals(fixture.tag, request.tag);
  test.equals(fixture.data, '');
  
  test.done();
};


exports.dirent = function(test) {
  var fixture = util.unpack(ixp.dirent(root), fmt_dirent);
  test.equals(fixture.type, "0", "dirent type fail");
  test.equals(fixture.name, "/", "dirent name fail");
  test.done();
};

exports.dirent_a = function(test){
  var fixture = util.unpack(ixp.dirent(root.lookup("a")), fmt_dirent);
  test.equals(fixture.type, "0");
  test.equals(fixture.name, "a");
  test.done();
};

//add a test to walk to a file and read it
// attach, walk, open, read, close

exports.walker = function(test){
  ixp.Service.verbose=true;
  var request = {type:ixp.Tattach, tag:3000, fid:427};
  var fixture = ixp.Service.answer(request);
  test.equals(fixture.tag, request.tag);

  request.type=ixp.Twalk;
  request.newfid=429;
  request.nwname="/cows/holstein".substring(1).split('/');
  fixture = ixp.Service.answer(request);
  test.done();
};
