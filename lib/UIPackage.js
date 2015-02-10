"use strict";

var JavaScriptFile = require('./File').JavaScriptFile;
var SCSSFile = require('./File').SCSSFile;
var PolymerElementFile = require('./File').PolymerElementFile;
var readFile = require('./utils').readFile;

class UIPackage {
  constructor(name) {
    this.name = name;
    this.contents = [];
    this.files = {};

    this.load();
  }

  toString() {
    var ret = '';

    for (var i=0; i<this.contents.length; i++) {
      ret += this.contents[i].toString();
    }

    return ret;
  }

  load () {
    var self = this;

    return new Promise(function(resolve, reject) {
      readFile(path.join('./ui', self.name, 'contents.json'))
        .then(function(contents) {

          self._contents = JSON.parse(contents);

          for (var name in self._contents) {
            var file;

            switch (path.extname(name)) {
              case '.js':
                file = new JavaScriptFile(self, name);
                break;
              case '.css':
              case '.scss':
                file = new SCSSFile(self, name);
                break;
              case '.json':
                //TODO: Bower file?
                break;
              case '.html':
                file = new PolymerElementFile(self, name);
                break;
            }

            self.files[name] = file;
            self.contents.push(file);
          }
        })
        .catch(reject)
      ;
    });
  }
}

exports.UIPackage = UIPackage;
