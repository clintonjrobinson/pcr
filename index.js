"use strict";

const isProduction = process.env.NODE_ENV === 'production';

var fs = require('fs');
var path = require('path');

var UIPackage = require('./lib/UIPackage').UIPackage;
var UI_PATH = UIPackage.UI_PATH;

var PolymerElementFile = require('./lib/File').PolymerElementFile;
var readFile = require('./lib/utils').readFile;

function PCR(options) {
  if (!(this instanceof PCR)) return new PCR(options);

  options = options || {};

  this.routes = options.routes || {};
  this.packages = {};
  this.pages = {};

  var self = this;

  fs.readdir(UI_PATH, function(err, files) {
    files.map(function(file) {
      fs.stat(path.join(UI_PATH, file), function(err, stat) {
        if (stat.isDirectory()) {
          self.packages[file] = new UIPackage(file);
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
        let packageName = parts[3];
        let name = parts[4];
        let subFile = parts[5];

        let file = self.packages[packageName].files[name];

        if (!file) {
          throw new Error('Cannot find ' + this.path);
        }

        if (file.constructor === PolymerElementFile && subFile) {
          file = file[subFile];
        }

        this.type = file.contentType;
        this.body = file.transformed;
        return;
      }

      for (var route in routes) {
        if (this.path === route) {

          //Check cache first
          if (!(isProduction && self.pages[this.path])) {
            self.pages[this.path] = yield self.parse(route);
          }

          this.body = self.pages[this.path];
        }
      }
    }

    yield next;
  }
};

PCR.prototype.parse = function *(route) {
  var self = this;

  var filePath = this.routes[route];
  var html = yield readFile(filePath);

  var watcher = fs.watch(filePath);
  watcher.on('change', function() {
    //Flush cache
    delete self.pages[route];
  });

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
        result += this.packages[ui].toString();
      }
    }

    i++;
  }

  return result;
};

