# 9pJSON

[![CI](https://github.com/rsbohn/9pJSON/actions/workflows/ci.yml/badge.svg)](https://github.com/rsbohn/9pJSON/actions/workflows/ci.yml)

A new Javascript implementation of the 9p protocol. Unlike most other implementations this one decouples the marshalling. In this way we can put classic 9p2000 packets on the wire, or JSON (9pJSON). Use as a module for node.js, or in a web page (ixp.all.js).

### Node.js

Install dependencies with `npm install`.
Run `npm run lint` to lint the code, `npm run format` to apply formatting, and `npm test` to run the Jest suite.

For 'over-the-wire' calls you need to build a packet according to the formats in ixp.js:packets[] and send it to service.answer(). You'll get a response packet (as a javascript object). Within your program you can make direct protocol function calls, `service.Tattach({...})` for example.

## Usage

### Browser
Include dist/ixp.all.js in your HTML file. See proto.html for more information.
### Node.js
Require 9pJSON, then call .Server() or .Client() as needed. Servers will build a file tree and then respond to requests by calling .answer(packet).

## Contributing

Porting any of the following:
* libdraw (to HTML5 Canvas)
* auth (kinda essential)
* factotum
* secret store

To contribute please fork this repository, make sure the linter, formatter and test suite pass, then submit pull requests. Code aligned with the project direction is more likely to be merged into the master branch. Unlikely to be accepted: overly complex code, patches that change multiple features, patches without tests.

Much of this code is based on https://github.com/aiju/jsdrawterm. Most of this code was developed using Acme and a 'test first (mostly)' process.
