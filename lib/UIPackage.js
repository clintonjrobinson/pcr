"use strict";
const UI_PATH = './ui';
const CONTENTS_FILE = 'contents.json';

var path = require('path');
var fs = require('fs');
var bower = require('bower');

var JavaScriptFile = require('./File').JavaScriptFile;
var SCSSFile = require('./File').SCSSFile;
var PolymerElementFile = require('./File').PolymerElementFile;
var BowerFile = require('./File').BowerFile;
var readFile = require('./utils').readFile;

class UIPackage {
  constructor(name) {
    this.name = name;
    this.contents = [];
    this.files = {};

    this.load().catch(function(err) {
      console.error(err);
      console.error(err.stack);
    });
  }

  static get UI_PATH() {return UI_PATH};
  static get CONTENTS_FILE()  {return CONTENTS_FILE};

  get path() {
    return path.join(UI_PATH, this.name, CONTENTS_FILE);
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

    if (self.loading) {
      return Promise.reject(new Error('Loading.'));
    }

    self.loading = true;

    return new Promise(function(resolve, reject) {
      readFile(self.path)
        .then(function(contents) {

          self._contents = JSON.parse(contents);
          self.contents = [];
          self.files = {};
          self.bowerFiles = [];

          var promises = [];
          var packages = [];
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
              case '.html':
                file = new PolymerElementFile(self, name);
                break;
              default:
                file = new BowerFile(self, name);
                break;
            }

            self.files[name] = file;
            promises.push(file.load());
            self.contents.push(file);
          }

          var watcher = fs.watch(self.path);
          watcher.on('change', self.load);

          Promise
            .all(promises)
            .then(function () {
              self.loading = false;
              resolve(self);
            })
            .catch(reject)
          ;
        })
        .catch(function(err) {
          self.loading = false;
          reject(err);
        })
      ;
    });
  }
}

exports.UIPackage = UIPackage;
