var browserify = require('browserify')
  , shim = require('browserify-shim');

shim(browserify(), {
  // jQuery attaches itself to the window as '$' so we assign the exports accordingly
  jquery: { path: './js/vendor/jquery.js', exports: '$' }
})
.require(require.resolve('./js/entry.js'), { entry: true })
.bundle(function (err, src) {
  if (err) return console.error(err);

  fs.writeFileSync(builtFile, src);
});