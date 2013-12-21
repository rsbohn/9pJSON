9pJSON
======

A new Javascript implementation of the 9p protocol.
Unlike most other implementations this one decouples the marshalling.
In this way we can put classic 9p2000 packets on the wire,
or JSON (9pJSON). Use as a module for node.js, or in a web page 
(ixp.all.js).

The node.js test suite runs with grunt. Please npm install -g 'grunt-cli' first,
then use npm install in this directory. It should install a current version of
the actual 'grunt' and associated modules.

For 'over-the-wire' calls you need to build a packet according to the formats
in ixp.js:packets[] and send it to service.answer(). You'll get a response packet
(as a javascript object). Within your program you can make direct protocol 
function calls, "service.Tattach({...})" for example.

Contributing
Porting any of the following:
* libdraw (to HTML5 Canvas)
* auth (kinda essential)
* factotum
* secret store

To contribute please fork this repository, submit pull requests.

Much of this code is based on https://github.com/aiju/jsdrawterm