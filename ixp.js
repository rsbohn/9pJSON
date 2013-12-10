// cat ixputil.js ixp.js > ixp.all.js
(function(exports){
var util = {};
exports.set_util = function(that){util=that;};

var QTDIR = 0x80;
var Qid = ["i1:type", "i4:ver", "i8:path"];
var lastquid = 0;

var packets = {
    100: {name: "Tversion", fmt: ["i4:size", "i1:type", "i2:tag", "i4:msize", "S2:version"]},
    101: {name: "Rversion", fmt: ["i4:size", "i1:type", "i2:tag", "i4:msize", "S2:version"]},
    102: {name: "Tauth", fmt: ["i4:size", "i1:type", "i2:tag", "S2:uname", "S2:aname"]},
    104: {name: "Tattach", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid", "i4:afid", "S2:uname", "S2:aname"]},
    105: {name: "Rattach", fmt: ["i4:size", "i1:type", "i2:tag", "b13:qid"]},
    107: {name: "Rerror", fmt: ["i4:size", "i1:type", "i2:tag", "S2:ename"]},
    108: {name: "Tflush", fmt: ["i4:size", "i1:type", "i2:tag", "i2:oldtag"]},
    109: {name: "Rflush", fmt: ["i4:size", "i1:type", "i2:tag"]},
    110: {name: "Twalk", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid", "i4:newfid", "i2:nwname", "R:wname"]},
    111: {name: "Rwalk", fmt: ["i4:size", "i1:type", "i2:tag", "i2:nqid", "R:qids"]},
    112: {name: "Topen", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid", "i1:mode"]},
    113: {name: "Ropen", fmt: ["i4:size", "i1:type", "i2:tag", "b13:qid", "i4:iounit"]},
    114: {name: "Tcreate", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid", "S2:name", "i4:perm", "i1:mode"]},
    115: {name: "Rcreate", fmt:["i4:size", "i1:type", "i2:tag", "i13:qid", "i4:iounit"]},
    116: {name: "Tread", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid", "i8:offset", "i4:count"]},
    117: {name: "Rread", fmt: ["i4:size", "i1:type", "i2:tag", "S4:data"]},
    118: {name: "Twrite", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid", "i8:offset", "S4:data"]},
    119: {name: "Rwrite", fmt: ["i4:size", "i1:type", "i2:tag", "i4:count"]},
    120: {name: "Tclunk", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid"]},
    121: {name: "Rclunk", fmt: ["i4:size", "i1:type", "i2:tag"]},
    122: {name: "Tremove", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid"]},
    124: {name: "Tstat", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid"]},
    125: {name: "Rstat", fmt: ["i4:size", "i1:type", "i2:tag", "S2:stat"]},
    126: {name: "Twstat", fmt: ["i4:size", "i1:type", "i2:tag", "i4:fid", "S2:stat"]}
};

exports.packets = packets;

var msgtype = {};
for (var p in packets) {
    //console.log(""+p+" "+JSON.stringify(packets[p].name+" -> "+packets[p].fmt));
    exports[packets[p].name] = p;
    msgtype[packets[p].name] = p;
}

exports.Service = {
    msgtype: msgtype,
    tree: {},
    fids: [],
    answer: function(p) {
        if (this.verbose) { console.log(p); }
        if (packets[p.type] !== undefined) {
            var handler = packets[p.type].name;
            if (this[handler] !== undefined) {
              var response = this[handler](p);
              if (this.verbose) {console.log(response);}
              return response;
            }
         }
        var err = this.error9p(p.tag, "unimplemented type="+p.type);
        if (this.verbose) {console.log(err);}
        return err;
    },

    error9p: function(tag, msg) {
        return this.send9p({type:msgtype.Rerror, tag:tag, ename:msg});
    },
    send9p: function(p){
        return p;
    },
    Tauth: function(p){
        return this.error9p(p.tag, "no auth necessary");
    },

    Tversion: function(p){
        p.type = msgtype.Rversion;
        return this.send9p(p);
    },

    Tattach: function(p){
        if (p.fid === undefined) return this.error9p(p.tag, "attach requires a fid");
        if (this.fids[p.fid] !== undefined) return this.error9p(p.tag, "fid already in use");
        this.fids[p.fid] = { f: this.tree, open: false};
        return this.send9p({type: msgtype.Rattach, tag: p.tag, qid: util.pack(this.tree.qid, Qid)});
    },

    Twalk: function(p){
        if(this.fids[p.fid] === undefined) return this.error9p(p.tag, "fid not in use");
        if(this.fids[p.newfid] !== undefined) return this.error9p(p.tag, "fid already in use");
        var f = this.fids[p.fid];
        if (p.nwname === 0) {
          this.fids[p.newfid] = this.fids[p.fid];
          return this.send9p({type:msgtype.Rwalk, tag:p.tag, nqid:0});
        }
        if (p.nwname === 1) {
          var nf = f.f.lookup(p.wname[0]);
          this.fids[p.newfid] = {f: nf, open:false}; 
          //what if lookup failed? catch exception, return this.error9p(p.tag, "not found");
          return this.send9p({type:msgtype.Rwalk, tag:p.tag, nqid:1, qids:[nf.qid]});
        }
        return this.error9p(p.tag, "Can't do plaid!"); //should be "walk multiple steps not yet implemented"
    },

    Topen: function(p){
        var node = this.fids[p.fid];
        if (node === undefined) { return this.error9p(p.tag, "no such fid"); }
        //will ignore node.f.open for now
        var reason = must_deny_access(node.f, p.mode);
        if (!reason) {
          if (isDir(node.f)) { node.f.bloc = node.f.nloc = 0;}
          node.open=true;
         //console.log(node);
          return this.send9p({type:msgtype.Ropen, tag:p.tag, qid: util.pack(node.f.qid, Qid), iounit:0});
        } else { 
            return this.error9p(p.tag, "permission denied: "+reason);
        }
    },

    Tcreate: function(p){
        if (p.perm < 0xFFFF) return this.error9p(p.tag, "permission denied");
        if (p.mode !== 0) return this.error9p(p.tag, "permission denied");
        var node = this.fids[p.fid];
        node.f = this.tree.mkdir(p.name);
        node.f.open = true;
        return this.send9p({type:msgtype.Ropen, tag:p.tag});
    },

    Tread: function(p){
        var node = this.fids[p.fid];
        if (node === undefined) return this.error9p(p.tag, "no such fid");
        if (node.open !== true) return this.error9p(p.tag, "fid not open");
        if (node.f.qid.type & QTDIR) return read_dirent(this, p, node);
        if (node.f.read === undefined) return this.error9p(p.tag, "permission denied");
        return read_file(this, p, node);
    },

    Twrite: function(p){
	var node = this.fids[p.fid];
	if(node === undefined) return this.error9p(p.tag, "no such fid");
	if(node.open !== true) return this.error9p(p.tag, "fid not open");
	if(node.f.qid.type & QTDIR) return this.error9p(p.tag, "permission denied");
	if(node.f.write === undefined) return this.error9p(p.tag, "permission denied");
	return write_file(this, p, node);
    },
    
    Tclunk: function(p){
        if (this.fids[p.fid] === undefined) return this.error9p(p.tag, "fid not in use");
        delete this.fids[p.fid];
        return this.send9p({type:msgtype.Rclunk, tag:p.tag});
    }
};

var must_deny_access = function(f, mode) {
  var reason;
  if (isDir(f)) { return (mode & 3) ? "directories are read only" : false; }
  if (mode & 3 === 3) { return "OEXEC not implemented";}
  if (mode & 3 && f.write === undefined) { return "read only";}
  return false;
};

var read_file = function(service, packet, node) {
  var data = node.f.read(packet.offset, packet.count);
  return service.send9p({type:msgtype.Rread, tag:packet.tag, count:5, data:data});
};

var read_dirent = function(service, packet, f) {
  //sends one dirent at a time, provided packet.offset===f.bloc and the dirent fits into packet.count
  var reply = {type:msgtype.Rread, tag:packet.tag};
  if (packet.offset === 0) f.bloc = f.nloc = 0;
  if (packet.offset != f.bloc) return service.error9p(packet.tag, "seek in directory illegal "+
    packet.offset +"!=" +f.bloc);
  if (packet.count < 2) return service.error9p(packet.tag, "read too short");
  if (f.nloc >= f.f.nchildren.length) {
    reply.data = "";
    return service.send9p(reply);
  }
  var child = f.f.nchildren[f.nloc];
  var s = exports.dirent(child);
  if (packet.count < s.length) {
    reply.data = s.substring(0,2);
    return service.send9p(reply);
  }
  f.bloc += s.length;
  f.nloc++;
  reply.data = s;
  return service.send9p(reply);
};

// here (for now) is dirent
exports.dirent = function(f){
  var fmt= ["i2:type", "i4:dev", "b13:qid", "i4:mode", "i4:atime", "i4:mtime", "i8:length", "S2:name", "S2:uid", "S2:gid", "S2:muid"];
  var now = new Date().getTime() / 1000;
  var s = { type: 0, dev: 0, qid: f.qid, mode: 0, atime: now, mtime: now, length: 1, 
    name: f.name, uid: "js", gid: "js", muid: "js"};
  if(f.qid.type & QTDIR) { s.mode |= 0111; s.mode += 0x80000000; }
  return s;
};

// filesystem funcs
var mkfile = function(path, open, read, write, close) {
    var f, parent, n;
    parent = this.lookup(path, true);
    path = path.split('/');
    n = path[path.length - 1];
    f = {
        name: n,
        parent: parent,
        qid: {type: 0, ver: 0, path: ++lastquid},
        open: open, read: read, write: write, close: close};
    parent.children[n] = f;
    parent.nchildren.push(f);
    return f;
};

var mkdir = function(path){
    var f, parent, name;
    parent = this.lookup(path, true);
    path = path.split('/');
    n = path[path.length-1];

    f = {
        mkfile: mkfile,
        mkdir: mkdir,
        lookup: lookup,
        name: n, parent: parent.name, children: {}, nchildren: [],
        qid: {type: QTDIR, ver: 0, path: ++lastquid}};
    parent.children[n] = f;
    parent.nchildren.push(f);

    return f;
};

function lookup(path, getParent) {
    var f, s, n, x;

    f = this;
    s = path.split('/');
    for(x in s){
        if(getParent && x == s.length - 1)
            break;
        n = s[x];
        if(n === "" || n == ".")    
            continue;
        if(n == "..")
            f = f.parent;
        else {
            f = f.children[n];
            if(f === undefined)
                throw path + " not found";
        }
    }
    return f;
}

var isDir = exports.isDir = function(i){
    return (i.qid.type === QTDIR);
};
var isFile = exports.isFile = function(i){
    return (i.qid.type !== QTDIR);
};

exports.mkroot = function(){
    return {
        name: "/", 
        children: {}, 
        nchildren: [],
        qid: {type: QTDIR, ver: 0, path: 0},
        mkfile: mkfile,
        mkdir: mkdir,
        lookup: lookup
    };
};

})(typeof(exports)==='undefined' ? this.ixp={} : exports);