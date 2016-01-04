"use strict";
var uglify = require('uglify-js');
var babel = require('babel-core');

var File = require('./File');
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

  get transformed() {
    if (!this.forPolymerElement) {
      return this._raw;
    }

    if (!this._transformed) {
      try {
        this._transformed = babel.transform(this.raw, {
            sourceMaps: !IS_PRODUCTION ? 'both' : false,
          compact: IS_PRODUCTION,
          presets: ['es2015', "stage-0"],
          plugins: [
            ["transform-es2015-classes"],
            ["external-helpers-2"]
          ]
        }).code;
      } catch (e) {
        console.error(`${this.name} : ${this.path}`);
        console.error(e);
        throw(e);
      }
    }

    return this._transformed;
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
        this._production = uglify.minify(this.transformed, {
            fromString: true,
            compress: {drop_console: true}
          }).code;
      } catch (e) {

        console.error(`${this.name}:${this.path} failed uglification.`);
        console.error(e);
        throw (e);
      }
    }

    return this._production;
  }

  toString(forBundle) {
    if (IS_PRODUCTION) {
      return forBundle
        ? this.production
        : '<script>' + this.production + '</script>'
      ;
    }

    return this.development;
  }
}

exports = module.exports = JavaScriptFile;
