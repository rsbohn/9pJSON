var unit = require("./unit"),
	client = require("../client"),
	ixp = require("../index").ixp,
	maybe = require("../maybe").maybe;
var OREAD=0, OWRITE=1, ORDWR=2, OEXEC=3;

ixp.tree.mkfile("/temp",
	undefined,
	function(o,n){  return this.data.substr(o,n);},
	function(o,d){ 
		this.data=maybe(this.data).orElse("")+d; 
		return d.length;},
	function(){ console.log("closed"); });

exports["Can't write to unopened fid."] = function(test){
  //ixp.verbose=true;
  client.attach(ixp, function(request, reply){
    var target = ixp.tree.lookup("/temp");
    test.equals(target.data, undefined);
    var fixture = ixp.Twalk({fid:request.fid,
	tag:1, newfid: 101, nwname:1,
	wname:["temp"]});
    fixture = ixp.Twrite({fid: 101,
	tag:1, offset:0, data:"nothing"});
    test.equals(fixture.type, ixp.msgtype.Rerror);
    test.equals(fixture.ename, "fid not open");
  });
  test.done();
}; 

exports["Open then write."] = function(test){
  //ixp.verbose=true;
  var target = ixp.tree.lookup("/temp");
  client.attach(ixp, function(request, reply){
    test.equals(target.data, undefined);
    var fixture = ixp.Twalk({fid:request.fid,
	tag:1, newfid: 101, nwname:1,
	wname:["temp"]});

    fixture = ixp.Topen({fid:101, tag:1, mode:OWRITE});
    test.equals(fixture.ename, undefined);
    test.equals(fixture.type, ixp.msgtype.Ropen);
    fixture = ixp.Twrite({fid:101, tag: 1, offset:0, data:"french fries"});
  });
  test.equals(target.data, "french fries");
  test.done();
};
