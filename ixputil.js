(function(exports){
var fuzz = function(n){ 
    var s, i;

    s = "";
    for(i = 0; i < n; i++)
	s += String.fromCharCode(Math.floor(Math.random() * 256));
    return s;
};

exports.fuzz = fuzz;
exports.ipack = ipack = function(fmt, data){
  var wide = fmt.substring(1);
  var packed = "";
  switch (fmt.substring(0,1)){
      case 'i': return npack(data, wide);          
      case 'R':
        for (var x in data) {
          packed += counted(data[x].toString(),2);
        }
        return packed;
      case 'b':
      case 's':
        packed = data.substring(0, wide);
        if (packed.length < wide) { packed = pad(packed, wide, "\0");}
        return packed;
     case 'S': return counted(data, wide);
     default: throw "pack: unknown type is "+fmt+".";
  }
  
};

var npack = function(n, wide){
  out = "";
  for (var p = 0; p < wide; p++){
    out += String.fromCharCode(n & 0xFF);
    n >>>= 8;
  }
  return out;
};

var counted = function(data, wide){
  return npack(data.length, wide) + data;
};

var pad = function(s, wide, fill) {
  var pwide = wide - s.length;
  s += Array(pwide+1).join(fill);
  return s;
};
exports.pad = pad;

exports.pack = function(data, spec){
  var out = [];
  for (var x in spec) {
    var ss = spec[x].split(":");
    out.push(ipack(ss[0], data[ss[1]]));
  }
  return out.join('');
};

function asInteger(s){
  var i = 0;
  for (var p = s.length - 1; p >= 0; p--) {
    i *= 256;
    i += s.charCodeAt(p);
  }
  return i;
}

var iunpack = function(fmt, data){
  var wide = fmt.substring(1);
  switch (fmt.substring(0,1)) {
    case 'i': return asInteger(data.substring(0, wide));
    case 'b':
    case 's': return data.substring(0, wide);
    case 'S': 
      //get actual count
      var wide2 = asInteger(data.substring(0,wide));
      data = data.substring(wide);
      return data.substring(0, wide2);
    case 'R':
      var out = [];
      while (data.length > 0) {
        var len = asInteger(data.substring(0, 2));
        if (len < 1) { throw "invalid size in array: "+len+" <<"+data+">>"; }
        out.push(data.substring(2, 2+len));
        data = data.substring(2+len);
      }
      return out;
    default: throw "unpack: unknown type is "+fmt;
  }
};

exports.unpack = function(data, spec){
  var out = {};
  for (var x in spec) {
    var ss = spec[x].split(":");
    var slot = ss[1];
    var wide = ss[0].substring(1);
    var value=iunpack(ss[0], data);
    data = data.substring(wide);
    if (ss[0].substring(0,1) === "S") {
      data = data.substring(value.length);
    }
    out[slot]=value;
  }
  return out;
};

})(typeof(exports)==='undefined' ? this.ixputils={} : exports) ;
    
