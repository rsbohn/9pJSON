var unit = require("./unit"),
	util = require("../ixputil"),
	ixp = require("../ixp");
	attach = require("../client").attach;

ixp.set_util(util);

console.log("protocol 9p:");
console.log("should answer Tnonesuch with an error");
ixp.Service.answer({type:99, tag: 1998});

console.log("should answer Tversion with ???");
ixp.Service.answer({type:100, tag: 1999, version: "tablespoon"});

console.log("should answer Tauth with an error");
ixp.Service.answer({type:ixp.Tauth, tag: 2000});

var root = ixp.mkroot();
root.mkdir("/a");
root.mkdir("/cows");

ixp.Service.tree = root;
console.log("should allow first Tattach");
ixp.Service.answer({type:ixp.Tattach, tag: 2000, fid: 1812});

console.log("should fail second Tattach with same fid");
ixp.Service.answer({type:ixp.Tattach, tag: 2000, fid: 1812});

var verbose = false;

ixp.Service.send9p = function(p){return p;};
exports.Tread = function(test) {
  ixp.Service.verbose = false;
  var fixture = ixp.Service.answer({type:ixp.Topen, tag:2000, fid:1812, mode:0});
  test.equals(tname(fixture.type), "Ropen", fixture.ename);

  var request = {type:ixp.Tread, tag:2001, fid:1812, count:128, offset:0};
  fixture =  ixp.Service.answer(request);
  test.equals(tname(fixture.type), "Rread", fixture.ename);
  if (fixture.type === ixp.Rread) {
    test.equals(fixture.tag, 2001);
    var dent = fixture.data;
  
    test.equals(dent.name, "a"); 
    test.equals(dent.mode & 0777, 0111);
    test.equals(dent.mode >>> 24, 0x80); //DMDIR >>> 24 (to avoid sign extension)
  
    request.offset += fixture.data.length;
    request.tag++;
    fixture = ixp.Service.answer(request);
  
    test.equals(fixture.type, ixp.Rread);
    test.equals(fixture.tag, request.tag);
    dent = fixture.data;
    test.equals(dent.name, 'cows');
  
    //at the end
    request.offset += fixture.data.length;
    fixture = ixp.Service.answer(request);
  
    test.equals(fixture.tag, request.tag);
    test.equals(fixture.data, '');
  
    //we're at the end+1, can we still read?
    //no need to update request.offset
    request.tag++;
    fixture = ixp.Service.answer(request);
  
    test.equals(fixture.tag, request.tag);
    test.equals(fixture.data, '');


  }

  var reply = ixp.Service.answer({type:ixp.Tclunk, tag:request.tag, fid:request.fid});
  test.equals(tname(reply.type), "Rclunk", reply.ename);

  test.done();
};


exports.dirent = function(test) {
  var fixture = ixp.dirent(root);
  test.equals(fixture.type, "0", "dirent type fail");
  test.equals(fixture.name, "/", "dirent name fail");
  test.done();
};

exports.dirent_a = function(test){
  var fixture = ixp.dirent(root.lookup("a"));
  test.equals(fixture.type, "0");
  test.equals(fixture.name, "a");
  test.done();
};

//add a test to walk to a file and read it

//I think I'm losing visibility of the protocol here
//might be better to use JSON literals so you can see what's actually going on.
exports.walker = function(test){
  ixp.Service.verbose=verbose;
  attach(ixp.Service, function(request, fixture){
    request.type=ixp.Twalk;
    request.newfid=429;
    request.wname=["cows"];
    request.nwname=request.wname.length;
    fixture = ixp.Service.answer(request);
    test.equals(fixture.type, ixp.Rwalk);
    test.equals(fixture.nqid, 1);
    test.equals(fixture.qids[0],root.lookup("/cows").qid);
    ixp.Service.answer(pclunk(request.newfid));
  });

  test.done();
};

exports.walk2 = function(test){
  ixp.Service.verbose=verbose;
  attach(ixp.Service, function(request, reply) {
    test.equals(reply.type, ixp.Rattach);
    var fixture = ixp.Service.answer({
	type:ixp.Twalk,
	tag:request.tag,
	fid:request.fid,
	newfid:430,
	wname:["cows","jersey"],
	nwname:2});
    test.equals(fixture.ename, "Can't do plaid!");
 } );
  test.done();
};
	
//walk to self (get a new fid same qid)
exports.walk_self = function(test){
  ixp.Service.verbose=verbose;
  attach(ixp.Service, function(request, reply){
    test.equals(reply.type, ixp.Rattach);
    request.type=ixp.Twalk;
    request.newfid=request.fid+1;
    request.nwname=0;
    var fixture = ixp.Service.answer(request);
    test.equals(fixture.type, ixp.Rwalk);
    test.equals(fixture.nqid, 0);
    test.equals(fixture.qids, undefined);
    //should try to use fixture.newfid
    //but for now just clunk it
    ixp.Service.answer(pclunk(request.newfid));
    
  });
  test.done();
};

var pclunk = function(fid){
  return {type:ixp.Tclunk, tag:3000, fid:fid};
};

var tname = function(t){ return ixp.packets[t].name;};

exports.open_close=function(test){
  attach(ixp.Service, function(request, response){
    //open an unknown fid
    var fixture = ixp.Service.answer({type:ixp.Topen, tag:request.tag, fid:435, mode:0});
    test.equals(fixture.ename, "no such fid"); 

    //open the root directory
    fixture = ixp.Service.answer({type:ixp.Topen, tag:request.tag, fid:request.fid, mode:0});
    test.equals(tname(fixture.type), "Ropen", fixture.ename);
    if (fixture.type === ixp.Ropen) {
      //there is no Tclose, and the file is clunked in attach()
      //so we don't need to do anything here.
      //fixture = ixp.Service.answer({type:ixp.Tclose, tag:request.tag, fid:request.fid});
      //test.equals(tname(fixture.type), "Rclose", fixture.ename);
    }
  });
  test.done();
};
exports.cat1 = function(test){
  root.mkfile("/zero", 
	null,
	function(offset, count){ return util.pad("", count, "\0"); },
	null,
	null);
  test.equals(root.lookup("/zero").read(0,5), "\0\0\0\0\0");
  attach(ixp.Service, function(request, response){
    ixp.Service.verbose=verbose;
    var fixture = ixp.Service.answer({
	type:ixp.Twalk,
	tag:request.tag,
	fid:request.fid,
	newfid: 440,
	wname: ["zero"],
	nwname: 1});
    if (fixture.type !== ixp.Rwalk) { return 0;}
    fixture = ixp.Service.answer({
	type:ixp.Topen,
	tag:request.tag,
	fid:440,
	mode:0});
    test.equals(tname(fixture.type), "Ropen", fixture.ename);
    if (fixture.type === ixp.Ropen) {
	//ixp.Service.verbose=true;
	fixture = ixp.Service.answer({type:ixp.Tread, fid:440, tag:request.tag, offset:0, count:5});
	test.equals(tname(fixture.type), "Rread", fixture.ename);
	test.equals(fixture.count, 5);
	test.equals(fixture.data, "\0\0\0\0\0");
	//ixp.Service.verbose=false;
    } 
    ixp.Service.answer(pclunk(440));

  });

  test.done();
};

exports['read unopened'] = function(test){
  attach(ixp.Service, function(request, response){
    test.equals(tname(response.type), "Rattach", response.ename);
    var fixture = ixp.Service.answer({
      type:ixp.Tread, tag:request.tag, fid:request.fid});
    test.equals(tname(fixture.type), "Rerror");
    test.equals(fixture.ename, "fid not open");
  });
  test.done();
};


exports.zzz = function(test){
  var fidList = [];
  for (var x in ixp.Service.fids){
    if (ixp.Service.fids[x] !== undefined) {
      fidList.push(x);
    }
  }

  //test.equals(ixp.Service.fids.length, 0);
  test.equals(fidList.length, 0, 
    "still open: "+fidList.toString());
  test.done();
};