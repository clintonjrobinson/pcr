"use strict";
var bower = require('bower');
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
            function getDeps(pack) {
              if (!pack && !pack.pkgMeta) return;

              //If no main file is specified, it must be the name of the package.
              //console.log(pack.pkgMeta.main || pack.pkgMeta.name);

              for (let dep in pack.pkgMeta.dependencies) {
                deps[dep] = deps[dep] ? (deps[dep]+1) : 1;
              }

              for (let dep in pack.dependencies) {
                getDeps(pack.dependencies[dep]);
              }
            }

            //Get the number of times a package is depended. The most depended must be loaded first.
            getDeps(list);

            console.log(deps);

            resolve(list);
          })
        ;
      }

      function install() {
        bower.commands
          .install([self.package], {save:true, forceLatest:true}, {cwd: self.path})
          .on('error', function(err) {
            self.loading = false;
            reject(err);
          })
          .on('end', list)
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
