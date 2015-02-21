"use strict";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

var PolymerElementFile = require('./File').PolymerElementFile;

module.exports.paths = function () {
  var self = this;
  var routes = self.routes;

  return function *(next) {
    if (this.method === 'GET') {
      if (/\/pcr\/ui\//.test(this.path)) {
        let parts = this.path.split('/');
        let packageName = parts[3];
        let name = parts[4];
        let subFile = parts[5];

        let file = self.packages[packageName].files[name];

        if (!file) {
          throw new Error('Cannot find ' + this.path);
        }

        if (file.constructor === PolymerElementFile && subFile) {
          file = file[subFile];
        }

        this.type = file.contentType;
        this.body = file.transformed;
        return;
      }

      for (var route in routes) {
        if (this.path === route) {

          //Check cache first
          if (!(IS_PRODUCTION && self.pages[this.path])) {
            self.pages[this.path] = yield self.parse(route);
          }

          this.body = self.pages[this.path];
        }
      }
    }

    yield next;
  }
};

