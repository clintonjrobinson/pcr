"use strict";

const UI_PATH = './ui';

var fs = require('fs');
var path = require('path');

var UIPackage = require('./lib/UIPackage').UIPackage;
var PolymerElementFile = require('./lib/File').PolymerElementFile;
var readFile = require('./lib/utils').readFile;

function PCR(options) {
  if (!(this instanceof Polymerize)) return new PCR(options);

  options = options || {};

  this.routes = options.routes || this.routes;
  this.UI = {};
  this.pages = {};

  var self = this;

  fs.readdir(UI_PATH, function(err, files) {
    files.map(function(file) {
      fs.stat(path.join(UI_PATH, file), function(err, stat) {
        if (stat.isDirectory()) {
          self.UI[file] = new UIPackage(file);
        }
      })
    });
  });
}

exports = module.exports = PCR;

PCR.prototype.paths = function () {
  var routes = this.routes;
  var self = this;

  return function *(next) {
    if (this.method === 'GET') {
      if (/\/pcr\/ui\//.test(this.path)) {
        let parts = this.path.split('/');
        let uiName = parts[3];
        let name = parts[4];
        let subFile = parts[5];

        let file = self.UI[uiName].files[name];

        if (!file) {
          throw new Error('Cannot find ' + this.path);
        }

        if (file.constructor === PolymerElementFile && subFile) {
          file = file[subFile];
        }

        this.type = file.ext;
        this.body = file.transformed;
        return;
      }

      for (var route in routes) {
        if (this.path === route) {

          //Check cache first
          if (!(isProduction && self.pages[this.path])) {
            self.pages[this.path] = yield self.parse(routes[route]);
          }

          this.body = self.pages[this.path];
        }
      }
    }

    yield next;
  }
};

PCR.prototype.parse = function *(filePath) {
  var html = yield readFile(filePath);

  //Split the html based on  {{, }}, {%, %}, {=, =}
  var tokens = html.split(/(\[\[|\]\]|\[%|%\]|\[=|=\])/);

  var expecting = null;
  var result = '';
  var i = 0;

  while (i < tokens.length) {
    let input = tokens[i];
    let token;

    if (expecting && input !== expecting) {
      throw new Error('Expecting ' + expecting + ' but got ' + input);
    } else if (expecting && input === expecting) {
      expecting = null;
      i++;
      continue;
    }


    switch (input) {
      case '[[':
        expecting = ']]';
        token = tokens[++i];
        break;
      case '[%':
        expecting = '%]';
        token = tokens[++i];
        break;
      case '[=':
        expecting = '=]';
        token = tokens[++i];
        break;
      default:
        result += input;
    }

    if (token && token.indexOf('ui:') !== -1) {
      var uis = token.split('ui:')[1].split(',');

      for (let j=0; j<uis.length; j++) {
        let ui = uis[j].trim();
        result += `<!-- ui package: ${ui} -->\n`;
        result += this.UI[ui].toString();
      }
    }

    i++;
  }

  return result;
};

