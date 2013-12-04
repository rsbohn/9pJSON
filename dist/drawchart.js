(function(exports){
var canvas = document.getElementById('catclock');

exports.points = [12,15,18,21,24];

exports.add = function(x){
  exports.points.push(x);
}

var drawBox = function(cx, y) {
  var x = (y < export.points.length) ? export.points[y] : 1;
  var mid = canvas.width/2;
  cx.moveTo(mid-x,y);
  cx.lineTo(mid+x, y);
  cx.stroke();
}

exports.update = function(){
  var cx = canvas.getContext('2d');
  var height = canvas.height;
  for (x=0; x<height;x++) {
    drawBox(cx, height-x);
  }
 

}(typeof(exports)==='undefined' ? this.drawchart={} : exports);