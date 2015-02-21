"use strict";

var fs = require('fs');
var path = require('path');

var UIPackage = require('./lib/UIPackage').UIPackage;
var UI_PATH = UIPackage.UI_PATH;

function PCR(options) {
  if (!(this instanceof PCR)) return new PCR(options);

  options = options || {};

  this.routes = options.routes || {};
  this.packages = {};
  this.pages = {};

  var self = this;

  fs.readdir(UI_PATH, function(err, files) {
    for (let file of files) {
      fs.stat(path.join(UI_PATH, file), function(err, stat) {
        if (stat.isDirectory()) {
          self.packages[file] = new UIPackage(file);
        }
      })
    }
  });
}

exports = module.exports = PCR;

PCR.prototype.parse = require('./lib/parse').parse;
PCR.prototype.paths = require('./lib/paths').paths;
