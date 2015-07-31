"use strict";

var chokidar = require('chokidar');

var path = require('path');

var readInFile = require('./../utils').readFile;

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

  watch() {
    var self = this;
    if (IS_PRODUCTION || this.watching) return;

    var watcher = chokidar.watch(this.path);
    this.watching = true;

    watcher.on('change', function() {
      self.readFile.call(self);
    });

    watcher.on('error', function (err) {
      console.error(err);
    });
  }

  readFile() {
    var self = this;
    self.loading = true;

    return new Promise(function(resolve, reject) {
      readInFile(self.path)
        .then(function (contents) {
          self.raw = contents;
          self.loading = false;

          if (self.onLoad) self.onLoad();

          resolve(self);
        })
        .catch(function (err) {
          self.loading = false;
          reject(err);
        })
      ;
    });
  }

  load() {
    if (this.loading) {
      return Promise.reject(new Error('Already loading.'));
    }

    this.watch();
    return this.readFile();
  }


  toString() {
    return IS_PRODUCTION ? this.production : this.development;
  }
}

exports.File = File;
