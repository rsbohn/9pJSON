var _util = require("./ixputil");
var _ixp = require("./ixp");
_ixp.set_util(_util);

exports.ixp = _ixp.Service;
exports.ixp.tree = _ixp.mkroot();