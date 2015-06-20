"use strict";

var fs = require('fs');
var path = require('path');

var readFile = require('./../utils').readFile;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

class File {
  constructor(ui, name, forPolymerElement) {
    this.ui = ui;
    this.name = name;
    this.partialPath = this.package = ui._contents[name];
    this.forPolymerElement = forPolymerElement || false;
    this.watching = false;
  }

  get contentType() {
    return 'application/html';
  }

  get path() {
    return this.forPolymerElement
      ? path.join('./ui/', this.ui.name, this.partialPath, path.basename(this.name, '.html') + this.ext)
      : path.join('./ui/', this.ui.name, this.partialPath)
    ;
  }

  get raw() {
    return this._raw;
  }

  set raw(value) {
    this._raw = value;
    this._transformed = null;
    this._development = null;
    this._production = null;
  }

  get transformed() {
    return this.raw;
  }

  get development() {
    return this.raw;
  }

  get production() {
    return this.raw;
  }

  load() {
    var self = this;

    if (self.loading) {
      return Promise.reject(new Error('Already loading.'));
    }

    self.loading = true;

    return new Promise(function(resolve, reject) {
      readFile(self.path)
        .then(function(contents) {
          self.raw = contents;
          //Setup a watcher for file changes.
          var watcher = fs.watch(self.path);
          watcher.on('change', function(e, filename) {

            if (e === 'change') {
              watcher.close();
              self.load.apply(self);
            }
          });

          watcher.on('error', function(err) {
          });

          if (self.onLoad) {
            self.onLoad();
          }

          self.loading = false;
          resolve(self);
        })
        .catch(function(err) {
          self.loading = false;
          reject(err);
        })
      ;
    });
  }

  toString() {
    return IS_PRODUCTION ? this.production : this.development;
  }
}

exports.File = File;
