"use strict";

var fs = require('fs');
var path = require('path');
var sass = require('node-sass');
var autoprefixer = require('autoprefixer');
var uglify = require('uglify-js');
var cleanCss = new (require('clean-css'))({noAdvanced: true});

var readFile = require('./utils').readFile;

var isProduction = process.env.NODE_ENV === 'production';

class File {
  constructor(ui, name, forPolymerElement) {
    this.ui = ui;
    this.name = name;
    this.partialPath = ui._contents[name];
    this.forPolymerElement = forPolymerElement ? true : false;

    /**
     fs.watch(this.path, {persistent: true}, function(event) {
      console.log(event);
    });
     */

    this.load().catch(function (err) {
      console.error(err);
    });
  }

  get contentType() {
    return 'application/html';
  }

  get path() {
    if (this.forPolymerElement) {
      return path.join('./ui/', this.ui.name, this.partialPath, path.basename(this.name, '.html') + this.ext);
    }

    return path.join('./ui/', this.ui.name, this.partialPath);
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
          watcher.on('change', function(){
            self.load();
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
    return isProduction ? this.production : this.development;
  }
}

exports.File = File;

class PolymerElementFile extends File {
  constructor(ui, name) {
    super(ui, name);

    this.url = `/pcr/ui/${this.ui.name}/${this.name}`;
  }

  get contentType() {
    return 'text/html';
  }

  get ext() {
    return '.html';
  }

  get path() {
    return path.join('./ui/', this.ui.name, this.partialPath, this.name);
  }

  get transformed() {
    if (!this._transformed) {
      this._transformed = this.raw
        .replace(
        /<link rel="stylesheet" href="([A-Z\-_ ]*).(\w+)">/i,
        `<link rel="stylesheet" href="${this.url}/css" shim-shadowdom>`
      )
        .replace(
        /<script src="([A-Z\-_ ]*).(\w+)"><\/script>/i,
        `<script src="${this.url}/js" ></script>`
      )
      ;
    }

    return this._transformed;
  }

  get development() {
    if (!this._development) {
      this._development = `<link rel="import" href="/pcr/ui/${this.ui.name}/${this.name}">`;
    }

    return this._development;
  }

  get production() {
    if (!this._production) {
      this._production = this.raw
        .replace(
        /<link rel="stylesheet" href="([A-Z\-_ ]*).(\w+)">/i,
        this.css.production
      )
        .replace(
        /<script src="([A-Z\-_ ]*).(\w+)"><\/script>/i,
        this.js.production
      )
      ;
    }

    return this._production;
  }

  onLoad() {
    if (/<link rel="stylesheet" href="([A-Z\-_ ]*).(\w+)">/gi.test(this.raw)) {
      this.css = new SCSSFile(this.ui, this.name, true);
    }

    if (/<script src="([A-Z\-_ ]*).(\w+)"><\/script>/gi.test(this.raw)) {
      this.js = new JavaScriptFile(this.ui, this.name, true);
    }
  }
}

exports.PolymerElementFile = PolymerElementFile;

class JavaScriptFile extends File {
  constructor(ui, name, forPolymerElement) {
    super(ui, name, forPolymerElement);
  }

  get contentType() {
    return 'application/javascript';
  }

  get ext() {
    return '.js';
  }

  get development() {
    if (!this._development) {
      this._development = `<script src="/pcr/ui/${this.ui.name}/${this.name}"></script>\n`;
    }

    return this._development;
  }

  get production() {
    if (!this._production) {
      this._production = '<script>' + uglify.minify(this.raw, {fromString: true}).code + '</script>';
    }

    return this._production;
  }
}

exports.JavaScriptFile = JavaScriptFile;

class SCSSFile extends File {
  constructor (ui, name, forPolymerElement) {
    super(ui, name, forPolymerElement);
  }

  get contentType() {
    return 'text/css';
  }

  get ext() {
    return '.scss';
  }

  get transformed() {
    if (!this._transformed) {
      var sassy = sass.renderSync({
        data: this.raw
      }).css;

      this._transformed = autoprefixer.process(sassy).css;
    }

    return this._transformed;
  }

  get development() {
    if (!this._development) {
      this._development = `<link rel="stylesheet" type="text/css" href="/pcr/ui/${this.ui.name}/${this.name}">\n`;
    }

    return this._development;
  }

  get production() {
    if (!this._production) {
      this._production = '<style>' + cleanCss.minify(this.transformed).styles + '</style>';
    }

    return this._production;
  }
}

exports.SCSSFile = SCSSFile;