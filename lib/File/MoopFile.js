"use strict";
var path = require('path');
var File = require('./File');
var uglify = require('uglify-js');
var babel = require('babel-core');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

class MoopFile extends File {
  constructor (ui, name) {
    super(ui, name);
  }

  get contentType() {
    return 'application/javascript';
  }

  get ext() {
    return '.js';
  }

  get transformed() {
    if (!this._transformed) {
      try {
         let transformed = babel.transform(this.raw, {
          sourceMaps: !IS_PRODUCTION,
          compact: IS_PRODUCTION,
          presets: ['es2015', 'react', 'stage-0'],
          plugins: [
            ["transform-react-jsx", {"pragma": "mp"}],
            ["transform-es2015-classes"],
            ["external-helpers-2"]
          ]
        });

        this._transformed = transformed.code + `\n//# sourceMappingURL=/pcr/ui/${this.ui.name}/${this.name}/map`;
        this._map = transformed.map;
      } catch (e) {
        console.error(`${this.name} : ${this.path}`);
        console.error(e);
        throw(e);
      }
    }

    return this._transformed;
  }

  get map() {
    return this._map;
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


exports = module.exports = MoopFile;