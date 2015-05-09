"use strict";
var fs = require('fs');
var readFile = require('./utils').readFile;

module.exports.render = function (filePath) {
  var self = this;

  return function *(next) {
    this.body = yield self.parse(filePath);

    yield next;
  }
};

module.exports.parse = function *(filePath) {
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
          break;
        case '[%':
          expecting = '%]';
          token = tokens[++i];
          break;
        case '[=':
          expecting = '=]';
          token = tokens[++i];
          break;
        default:
          result += input;
      }

      if (token && token.indexOf('ui:') !== -1) {
        var uis = token.split('ui:')[1].split(',');

        for (let j = 0; j < uis.length; j++) {
          let ui = uis[j].trim();
          result += `<!-- ui package: ${ui} -->\n`;
          result += this.packages[ui].toString();
        }
      }

      i++;
    }

    self.pages[filePath] = result;
  }

  return self.pages[filePath];
};

