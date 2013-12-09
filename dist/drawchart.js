(function(exports){
var canvas = document.getElementById('catclock');

exports.points = [12,15,18,21,24];

exports.add = function(x){
  exports.points.push(x);
  while (exports.points.length > canvas.height) {
    exports.points.shift();
  }
}

var drawBox = function(cx, y) {
  var x = 1;
  var g = exports.points.length;
  if (y < g) { x = exports.points[g-y];}
  var mid = canvas.width/2;
  cx.moveTo(mid-x,y);
  cx.lineTo(mid+x, y);
  cx.stroke();
}

exports.update = function(){
  var cx = canvas.getContext('2d');
  var height = canvas.height;
  canvas.height=canvas.height;
  for (x=0; x<height;x++) {
    drawBox(cx, height-x);
  }
}

exports.append = function(s){
  var max = 8
  for (x in s) {
    if (x < max) { exports.add(s.charCodeAt(x));}
    else { break; }
  }
}

exports.update();
})(typeof(exports)==='undefined' ? this.drawchart={} : exports);

function CanvasCtrl($scope, $timeout) {
  var promise;
  $scope.tick = function(){
    drawchart.update();
    promise = $timeout($scope.tick, 1000);
  }
  promise = $scope.tick();
}