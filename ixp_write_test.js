var unit = require("./unit"),
	client = require("./client"),
	ixp = require("./index").ixp;

ixp.tree.mkfile("/temp",
	undefined,
	function(o,n){  return this.data.substr(o,n);},
	function(o,d){ this.data+=d; return d.length();},
	function(){ console.log("closed"); });

exports["Can't write to unopened fid."] = function(test){
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