"use strict";
var path = require('path');

var File = require('./File').File;
var JavaScriptFile = require('./JavaScriptFile').JavaScriptFile;
var SCSSFile = require('./SCSSFile').SCSSFile;

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
