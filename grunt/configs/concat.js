module.exports = {
  options: {
    process: function(src, filepath) {
      if (filepath.substr(filepath.length - 2) === 'js') {
        return '// Source: ' + filepath + '\n' +
          src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
      } else {
        return src;
      }
    }
  },
  vendors: {
    src: ['public/src/js/ios-imagefile-megapixel/megapix-image.js',
      'public/lib/qrcode-generator/js/qrcode.js',
      'public/src/js/jsqrcode/grid.js',
      'public/src/js/jsqrcode/version.js',
      'public/src/js/jsqrcode/detector.js',
      'public/src/js/jsqrcode/formatinf.js',
      'public/src/js/jsqrcode/errorlevel.js',
      'public/src/js/jsqrcode/bitmat.js',
      'public/src/js/jsqrcode/datablock.js',
      'public/src/js/jsqrcode/bmparser.js',
      'public/src/js/jsqrcode/datamask.js',
      'public/src/js/jsqrcode/rsdecoder.js',
      'public/src/js/jsqrcode/gf256poly.js',
      'public/src/js/jsqrcode/gf256.js',
      'public/src/js/jsqrcode/decoder.js',
      'public/src/js/jsqrcode/qrcode.js',
      'public/src/js/jsqrcode/findpat.js',
      'public/src/js/jsqrcode/alignpat.js',
      'public/src/js/jsqrcode/databr.js',
      'node_modules/moment/moment.js',
      'public/lib/zeroclipboard/ZeroClipboard.min.js',
      'node_modules/lodash/lodash.min.js'],
    dest: 'public/dist/js/vendors.js'
  },
  angular: {
    src: [
      'node_modules/angular/angular.js',
      'node_modules/angular-resource/angular-resource.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-qrcode/angular-qrcode.js',
      'node_modules/angular-animate/angular-animate.js',
      'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
      'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
      'node_modules/angular-moment/angular-moment.js',
      'public/lib/ngprogress/build/ngProgress.js'],
    dest: 'public/dist/js/angularjs-all.js'
  },
  raven: {
    src: ['node_modules/raven-js/dist/raven.min.js', 'node_modules/angular-raven/angular-raven.min.js'],
    dest: 'public/dist/js/raven-all.js'
  },
  main: {
    src: ['public/src/js/app.js', 'public/src/js/controllers/*.js', 'public/src/js/services/*.js', 'public/src/js/directives.js', 'public/src/js/filters.js', 'public/src/js/config.js', 'public/src/js/init.js', 'public/dist/js/translations.js'],
    dest: 'public/dist/js/main.js'
  },
  css: {
    src: ['node_modules/bootstrap/dist/css/bootstrap.min.css',  'public/dist/css/**/*.css'],
    dest: 'public/dist/css/main.css'
  }
};

