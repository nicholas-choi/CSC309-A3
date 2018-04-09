/* What about serving up static content, kind of like apache? */
require('./port');

var express = require('express');
var app = express();

// static_files has all of statically returned content
// https://expressjs.com/en/starter/static-files.html
app.use('/',express.static('static-content')); // this directory has files to be returned

app.listen(port, function () {
  console.log('Example app listening on port' + port);
});
