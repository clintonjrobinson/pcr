"use strict";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

var PolymerElementFile = require('./File').PolymerElementFile;

const FILE_TYPES = {
  'css': "text/css",
  'js': "application/javascript",
  'msx': "application/javascript",
  'polymer': "application/html"
};

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

        if (name === 'bundle') {
          // pcr/ui/mobile-mithril/bundle/css
          //bundle dat file.

          this.type = FILE_TYPES[subFile];
          this.body = self.packages[packageName].toString(subFile, true);
          yield next;
          return;
        }

        let file = self.packages[packageName].files[name];

        if (!file) {
          throw new Error('Cannot find ' + this.path);
        }

        if (file.constructor === PolymerElementFile && subFile) {
          file = file[subFile];
        }

        this.type = file.contentType;
        this.body = file.transformed;

        yield next;
        return;
      }

      for (var route in routes) {
        if (this.path === route) {

          //Check cache first
          if (!(IS_PRODUCTION && self.pages[self.routes[route]])) {
            yield self.parse(self.routes[route]);
          }

          this.body = self.pages[self.routes[route]];
        }
      }
    }

    yield next;
  }
};

