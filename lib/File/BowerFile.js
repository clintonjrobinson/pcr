"use strict";
//var bower = require('bower');
var path = require('path');
var fs = require('fs');

var File = require('./File').File;
var BOWER_JSON = {
  "name": "",
  "version": "0.0.0",
  "authors": [
    "PCR <pcr@usful.co>"
  ],
  "description": "pcr",
  "moduleType": [
    "es6"
  ],
  "license": "MIT",
  "private": true
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

global.bowers = global.bowers || {};

class BowerFile extends File {
  constructor(ui, name) {
    super(ui, name);

    global.bowers[ui.name] = global.bowers[ui.name] || {};
  }

  get contentType() {
    return 'application/json';
  }

  get ext() {
    return '.json';
  }

  get path() {
    return path.join('./ui/', this.ui.name, this.name);
  }

  get development() {
    if (!this._development) {
      this._development = `<script src="/pcr/ui/${this.ui.name}/${this.name}"></script>\n`;
    }

    return this._development;
  }

  load() {
    var self = this;

    if (self.loading) {
      return Promise.reject(new Error('Already loading.'));
    }

    self.loading = true;
    return new Promise(function(resolve, reject) {
      function list() {
        bower.commands
          .list({}, {cwd: self.path})
          .on('error', function (err) {
            self.loading = false;
            reject(err);
          })
          .on('end', function (list) {
            var deps = {};
            var added = {};
            var chain = [];
            function getDeps(pack, top) {
              if (!pack && !pack.pkgMeta) return;

              //If no main file is specified, it must be the name of the package.
              //console.log();
              //if (!deps[pack.pkgMeta.name]) {
              //}

              if (!top && !added[pack.pkgMeta.name] && pack.pkgMeta.main) {
                chain.push(pack.pkgMeta.name + '/' + (pack.pkgMeta.main || pack.pkgMeta.name + '.html'));

                added[pack.pkgMeta.name] = true;
              }

              for (let dep in pack.pkgMeta.dependencies) {
                deps[dep] = deps[dep] ? (deps[dep]+1) : 1;
              }

              for (let dep in pack.dependencies) {
                getDeps(pack.dependencies[dep]);
              }
            }

            //Get the number of times a package is depended. The most depended must be loaded first.
            getDeps(list, true);

            console.log(chain);
            console.log(deps);

            resolve(list);
          })
        ;
      }

      function clean() {
        bower.commands.cache
          .clean({cwd:self.path})
          .on('end', install)
        ;
      }

      function install() {
        bower.commands
          .install([self.package], {save:true, forceLatest:true}, {cwd: self.path})
          .on('error', function(err) {
            self.loading = false;
            reject(err);
          })
          .on('end', function() {
            setTimeout(list, 500);
          })
        ;
      }

      fs.mkdir(self.path, function(err, stat) {
        //Ignore errors?
        fs.stat(path.join(self.path, 'bower.json'), function(err, stat) {
          if (!err) return install();

          var obj = JSON.parse(JSON.stringify(BOWER_JSON));
          obj.name = self.ui.name + '-' + self.name;

          fs.writeFile(path.join(self.path, 'bower.json'), JSON.stringify(obj), 'utf8', function (err, file) {
            if (err) {
              self.loading = false;
              return reject(err);
            }

            install();
          });
        });
      });

    });
  }
}
exports.BowerFile = BowerFile;
