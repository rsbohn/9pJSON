var _util = require("./ixputil");
var _ixp = require("./ixp");
_ixp.set_util(_util);

exports.Server = function(){
  var s = _ixp.Service;
  s.tree = _ixp.mkroot();
  return s;
};

exports.Client = function(){
  var c = {};
  return c;
};

//who uses ixp?
exports.ixp = {
  tree:{
    mkfile: function(s){throw new Error("bang! "+s);}
  }
};