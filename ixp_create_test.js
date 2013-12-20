var unit = require("./unit"),
	util = require("./ixputil"),
	ixp = require("./ixp"),
	attach = require("./client").attach;

ixp.set_util(util);

var root = ixp.mkroot();
ixp.Service.tree = root;
var verbose = false;
var tname = function(t){ return ixp.packets[t].name;};

exports['create directory'] = function(test){
  ixp.Service.verbose=verbose;
  attach(ixp.Service, function(request, response){
    test.equals(tname(response.type), "Rattach", response.ename);
    var fixture = ixp.Service.answer({
	type:ixp.Tcreate, tag:request.tag, fid:request.fid, name:"shoehorn",
	perm:0700+0x80000000, mode:0});
    test.equals(tname(fixture.type), "Ropen", fixture.ename);
    //here we check root directly
    var check = root.lookup("shoehorn");
    test.ok(ixp.isDir(check), "should be a directory");
  });
  test.done();
};
