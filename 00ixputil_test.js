var unit = require('./test/unit'),
  testcase = unit.testcase,
  isRandom = unit.isRandom,
  iCanHazN = unit.iCanHazN;
var util = require('./ixputil');

//test the test funcs
console.log("util.fuzz:");
testcase(isRandom(util.fuzz, [unit.anyPositiveNumber]));
testcase(iCanHazN(util.fuzz, [unit.anyPositiveNumber]));

console.log("util.pack:");
var string7 = "ABCDEFG";
console.log("should pack a fixed width string");
testcase("ABCDEFG"===util.ipack("s7", "ABCDEFG"));
testcase("ABC\0\0"===util.ipack("s5", "ABC"));
unit.tcase(util.ipack("b4", "mood")).shouldEqual("mood");

console.log("should pack an array");
unit.tcase(util.ipack("R", [string7])).shouldEqual("\u0007\u0000"+string7);

console.log("should pack one field from a map");
testcase("ABCDEFG"===util.pack({msg:"ABCDEFG"}, ["s7:msg"]));
testcase("EFGH"===util.pack({a:"ABCD",e:"EFGHI"}, ["s4:e"]));

console.log("should pack two strings from a map");
testcase("ABCDEF"==util.pack({a:"ABC",d:"DEF"},["s3:a","s3:d"]));

console.log("\nutil.unpack:");
console.log("should unpack a string");
unit.tcase(util.unpack(string7, ["s4:a"]).a).shouldEqual("ABCD");
unit.tcase(util.unpack(string7, ["s7:a"]).a).shouldEqual(string7);
//perhaps we should pad when unpacking?
unit.tcase(util.unpack(string7, ["s8:a"]).a).shouldEqual(string7);
console.log("should unpack a second string");
unit.tcase(util.unpack(string7, ["s4:a","s2:e"]).a).shouldEqual("ABCD");
unit.tcase(util.unpack(string7, ["s4:a","s2:e"]).e).shouldEqual("EF");

console.log("should unpack integers");
unit.tcase(util.unpack('\004', ["i1:a"]).a).shouldEqual(4);
//MG is 18253
unit.tcase(util.pack({n:18253}, ["i2:n"])).shouldEqual("MG");
unit.tcase(util.unpack('MG',["i2:a"]).a).shouldEqual(18253);
//This shows that we are little endian: 'B' is 0x42, '@' is 0x40
unit.tcase(util.pack({n:0x4240}, ["i2:n"])).shouldEqual("@B");

console.log("should pack counted strings");
unit.tcase(util.pack({s:"cows"},["S2:s"])).shouldEqual("\004\0cows");
unit.tcase(util.pack({s:"cows"},["S4:s"])).shouldEqual("\004\0\0\0cows");

console.log("should unpack counted strings");
unit.tcase(util.unpack("\004\0dogs",["S2:a"]).a).shouldEqual("dogs");
var animals="\005\0horse\004\0\0\0duck\003\0cow";
var farm = util.unpack(animals, ["S2:a","S4:b","S2:c"]);
unit.tcase(farm.a).shouldEqual("horse");
unit.tcase(farm.b).shouldEqual("duck");
unit.tcase(farm.c).shouldEqual("cow");

console.log("should unpack an array");
//can't reuse 'animals' because of the duck...
farm = util.unpack("\005\0horse\004\0duck\003\0cow", ["R:a"]).a;
unit.tcase(farm[0]).shouldEqual("horse");
unit.tcase(farm[1]).shouldEqual("duck");
unit.tcase(farm[2]).shouldEqual("cow");

var nums = util.ipack("R", ["duck", [4,14]]);//, 10,20,30]);
console.log(nums);
var numa = util.unpack(nums, ["R:a"]).a;
unit.tcase(numa[0]).shouldEqual("duck");
unit.tcase(numa[1]).shouldEqual("4,14");

//we can pack anything (with .toString())
//but we unpack strings.
nums = util.ipack("R", ["duck", 10, 20, 30]);
numa = util.unpack(nums, ["R:a"]).a;
unit.tcase(numa[0]).shouldEqual("duck");
unit.tcase(numa[1]).shouldEqual("10");
unit.tcase(numa[2]).shouldEqual("20");
unit.tcase(numa[3]).shouldEqual("30");





