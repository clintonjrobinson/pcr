"use strict";

var fs = require('fs');
var readFile = require('./utils').readFile;

module.exports.render = function (filePath, data) {
  var self = this;

  return function *(next) {
    this.body = yield self.parse(filePath, data);

    yield next;
  }
};

module.exports.parse = function *(filePath, data) {
  var self = this;

  var html = yield readFile(filePath);

  var watcher = fs.watch(filePath);
  watcher.on('change', function() {
    //Flush cache
    delete self.pages[filePath];
  });

  if (!self.pages[filePath]) {
    //Split the html based on  {{, }}, {%, %}, {=, =}
    var tokens = html.split(/(\[\[|\]\]|\[%|%\]|\[=|=\])/);

    var expecting = null;
    var result = '';
    var i = 0;

    while (i < tokens.length) {
      let input = tokens[i];
      let token;
      let filter;

      if (expecting && input !== expecting) {
        throw new Error('Expecting ' + expecting + ' but got ' + input);
      } else if (expecting && input === expecting) {
        expecting = null;
        i++;
        continue;
      }


      switch (input) {
        case '[[':
          expecting = ']]';
          token = tokens[++i];

          if (token) {
            if (token.indexOf('ui:') !== -1) filter = 'ui';
            else if (token.indexOf('css:') !== -1) filter = 'css';
            else if (token.indexOf('js:') !== -1) filter = 'js';
            else if (token.indexOf('polymer:') !== -1) filter = 'polymer';
            else if (token.indexOf('msx:') !== -1) filter = 'msx';

            if (filter) {
              let uis = token.split(`${filter}:`)[1].split(',');

              for (let j = 0; j < uis.length; j++) {
                let ui = uis[j].trim();
                result += `<!-- ${filter} package: ${ui} -->\n`;
                result += this.packages[ui].toString(filter);
              }
            }
          }

          break;

        case '[%':
          expecting = '%]';
          token = tokens[++i];
          break;

        case '[=':
          expecting = '=]';
          token = tokens[++i];
          token = token.trim();
          eval('result += ' + token);
          break;

        default:
          result += input;
      }

      i++;
    }

    self.pages[filePath] = result;
  }

  return self.pages[filePath];
};

