"use strict";
var path = require('path');

var File = require('./File');
var JavaScriptFile = require('./JavaScriptFile');
var SCSSFile = require('./SCSSFile');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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
    if (!IS_PRODUCTION || !this._transformed) {
      var tmp = this.raw;

      if (this.css) {
        tmp = tmp.replace(
          /<link rel="stylesheet" href="([A-Z\-_ ]*).(\w+)">/i,
          `<style>${this.css.development}</style>`
        );
      }

      tmp = tmp.replace(
        /<script src="([A-Z\-_ ]*).(\w+)"><\/script>/i,
        `<script src="${this.url}/js" ></script>`
      );

      this._transformed = tmp;
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
    var self = this;
    if (!this._production) {

      var raw = this.raw;


      if (this.css) {
        raw = raw.replace(
          /<link rel="stylesheet" href="([A-Z\-_ ]*).(\w+)">/i,
          `<style>${this.css.production}</style>`
        );
      }

      if (this.js) {
        raw = raw.replace(
          /<script src="([A-Z\-_ ]*).(\w+)"><\/script>/i, function() {
            return `<script>${self.js.production}</script>`;
          }
        );
      }

      this._production = raw;
    }

    return this._production;
  }

  toString(forBundle) {
    return IS_PRODUCTION ? this.production : this.development;
  }

  onLoad() {
    if (!this.css && /<link rel="stylesheet" href="([A-Z\-_ ]*).(\w+)">/gi.test(this.raw)) {
      this.css = new SCSSFile(this.ui, this.name, true);
      this.css.load();
    }

    if (!this.js && /<script src="([A-Z\-_ ]*).(\w+)"><\/script>/gi.test(this.raw)) {
      this.js = new JavaScriptFile(this.ui, this.name, true);
      this.js.load();
    }
  }
}

exports = module.exports = PolymerElementFile;
