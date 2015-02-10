"use strict";

var fs = require('fs');

function readFile (filePath, type) {
  type = type || 'utf8';

  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, function (err, buffer) {
      err
        ? reject(err)
        : resolve(buffer.toString(type))
      ;
    })
  });
}

exports.readFile = readFile;