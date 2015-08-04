"use strict";
var sass = require('node-sass');
var path = require('path');
var postcss = require('postcss');
var cleanCss = new (require('clean-css'))({noAdvanced: true});

var processor = postcss([require('autoprefixer')]);

var File = require('./File').File;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

class SCSSFile extends File {
  constructor (ui, name, forPolymerElement) {
    super(ui, name, forPolymerElement);
  }

  get contentType() {
    return this.forPolymerElement ? 'text/html' : 'text/css';
  }

  get ext() {
    return '.scss';
  }

  get transformed() {
    if (!this._transformed) {

      try {
        var sassy = sass.renderSync({
          data: this.raw,
          includePaths: [path.dirname(this.path)]
        }).css;

        this._transformed = processor.process(sassy).css;
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
      if (this.forPolymerElement) {
        this._development = this.transformed;
      } else {
        this._development = `<link rel="stylesheet" type="text/css" href="/pcr/ui/${this.ui.name}/${this.name}">\n`;
      }
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