"use strict";
var sass = require('node-sass');
var path = require('path');
var autoprefixer = require('autoprefixer');
var cleanCss = new (require('clean-css'))({noAdvanced: true});

var File = require('./File').File;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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
        data: this.raw,
        includePaths: [path.dirname(this.path)]
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