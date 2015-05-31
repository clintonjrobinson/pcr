"use strict";
var uglify = require('uglify-js');

var File = require('./File').File;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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
      try {
        this._production = '<script>' + uglify.minify(this.raw, {fromString: true}).code + '</script>';
      } catch (e) {

        console.error(`${this.name}:${this.path} failed uglification.`);
        console.error(e);
        throw (e);
      }
    }

    return this._production;
  }
}

exports.JavaScriptFile = JavaScriptFile;
