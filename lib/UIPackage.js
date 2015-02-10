"use strict";
const UI_PATH = './ui';
const CONTENTS_FILE = 'contents.json';

var path = require('path');
var fs = require('fs');

var JavaScriptFile = require('./File').JavaScriptFile;
var SCSSFile = require('./File').SCSSFile;
var PolymerElementFile = require('./File').PolymerElementFile;

var readFile = require('./utils').readFile;

class UIPackage {
  constructor(name) {
    this.name = name;
    this.contents = [];
    this.files = {};

    this.load().catch(function(err) {
      console.error(err);
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

            self.loading = false;

            var watcher = fs.watch(self.path);
            watcher.on('change', function() {
              self.load();
            });

            resolve(self);
          }
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
