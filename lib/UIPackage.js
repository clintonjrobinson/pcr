"use strict";

const UI_PATH = './ui';
const CONTENTS_FILE = 'contents.json';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

var path = require('path');
var fs = require('fs');
//var bower = require('bower');

var JavaScriptFile = require('./File').JavaScriptFile;
var MoopFile = require('./File').MoopFile;
var MithrilFile = require('./File').MithrilFile;
var SCSSFile = require('./File').SCSSFile;
var PolymerElementFile = require('./File').PolymerElementFile;
var readFile = require('./utils').readFile;

class UIPackage {
  constructor(name) {
    this.name = name;
    this.contents = [];
    this.files = {};

    this.load().catch(function(err) {
      console.error(err);
      console.error(err.stack);
    });
  }

  static get UI_PATH() {return UI_PATH};
  static get CONTENTS_FILE()  {return CONTENTS_FILE};

  get path() {
    return path.join(UI_PATH, this.name, CONTENTS_FILE);
  }

  toString(filter, forBundle) {
    var ret = '';

    //If we are in production mode, and there is a filter applied, we are generating a bundle of resources.
    if (IS_PRODUCTION && !forBundle && filter !== 'ui') {
      switch (filter) {
        case 'css':
          return `<link charset="utf-8" rel="stylesheet" type="text/css" href="/pcr/ui/${this.name}/bundle/css">\n`;
        case 'js':
          return `<script charset="utf-8" src="/pcr/ui/${this.name}/bundle/js"></script>\n`;
        case 'msx':
          return `<script charset="utf-8"  src="/pcr/ui/${this.name}/bundle/msx"></script>\n`;
        case 'mpx':
          return `<script charset="utf-8" src="/pcr/ui/${this.name}/bundle/mpx"></script>\n`;
        case 'polymer':
          return `<link charset="utf-8" rel="import" href="/pcr/ui/${this.name}/bundle/polymer">`;
      }
    }

    for (let file of this.contents) {
      let match = filter ? false : true;

      switch (filter) {
        case 'css':
          match = (file.constructor === SCSSFile);
          break;

        case 'js':
          match = (file.constructor === JavaScriptFile || file.constructor === MithrilFile || file.constructor === MoopFile);
          break;

        case 'mpx':
          match = (file.constructor === MoopFile);
          break;

        case 'msx':
          match = (file.constructor === MithrilFile);
          break;

        case 'polymer':
          match = (file.constructor === PolymerElementFile);
          break;

        default:
          match = true;
      }

      if (match) ret += file.toString(forBundle);
    }

    return ret;
  }

  load () {
    var self = this;

    console.log('UIPackage loading', self);

    if (self.loading) {
      return Promise.reject(new Error('Loading.'));
    }

    self.loading = true;

    return new Promise(function(resolve, reject) {
      readFile(self.path)
        .then(function(contents) {

          self._contents = JSON.parse(contents);
          self.contents = [];
          self.files = {};

          var promises = [];

          for (var name in self._contents) {
            var file;

            switch (path.extname(name)) {
              case '.js':
                file = new JavaScriptFile(self, name);
                break;
              case '.msx':
                file = new MithrilFile(self, name);
                break;
              case '.mpx':
                file = new MoopFile(self, name);
                break;
              case '.css':
              case '.scss':
                file = new SCSSFile(self, name);
                break;
              case '.html':
                file = new PolymerElementFile(self, name);
                break;
              default:
                break;
            }

            self.files[name] = file;
            promises.push(file.load());
            self.contents.push(file);
          }

          var watcher = fs.watch(self.path);
          watcher.on('change', self.load);

          Promise
            .all(promises)
            .then(function () {
              self.loading = false;
              resolve(self);
            })
            .catch(reject)
          ;
        })
        .catch(function(err) {
          self.loading = false;
          console.error(`Error loading UI Package ${self.name}`);
          reject(err);
        })
      ;
    });
  }
}

exports.UIPackage = UIPackage;
