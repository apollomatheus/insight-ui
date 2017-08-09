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
    src: ['public/src/js/ios-imagefile-megapixel/megapix-image.js', 'public/lib/qrcode-generator/js/qrcode.js', 'public/src/js/jsqrcode/grid.js', 'public/src/js/jsqrcode/version.js', 'public/src/js/jsqrcode/detector.js', 'public/src/js/jsqrcode/formatinf.js', 'public/src/js/jsqrcode/errorlevel.js', 'public/src/js/jsqrcode/bitmat.js', 'public/src/js/jsqrcode/datablock.js', 'public/src/js/jsqrcode/bmparser.js', 'public/src/js/jsqrcode/datamask.js', 'public/src/js/jsqrcode/rsdecoder.js', 'public/src/js/jsqrcode/gf256poly.js', 'public/src/js/jsqrcode/gf256.js', 'public/src/js/jsqrcode/decoder.js', 'public/src/js/jsqrcode/qrcode.js', 'public/src/js/jsqrcode/findpat.js', 'public/src/js/jsqrcode/alignpat.js', 'public/src/js/jsqrcode/databr.js', 'public/lib/momentjs/min/moment.min.js', 'public/lib/moment/lang/es.js', 'public/lib/zeroclipboard/ZeroClipboard.min.js', 'public/lib/lodash/dist/lodash.min.js'],
    dest: 'public/dist/js/vendors.js'
  },
  angular: {
    src: ['public/lib/angular/angular.min.js', 'public/lib/angular-resource/angular-resource.min.js', 'public/lib/angular-route/angular-route.min.js', 'public/lib/angular-qrcode/qrcode.js', 'public/lib/angular-animate/angular-animate.min.js', 'public/lib/angular-bootstrap/ui-bootstrap.js', 'public/lib/angular-bootstrap/ui-bootstrap-tpls.js', 'public/lib/angular-ui-utils/ui-utils.min.js', 'public/lib/ngprogress/build/ngProgress.min.js', 'public/lib/angular-gettext/dist/angular-gettext.min.js', 'public/lib/angular-moment/angular-moment.min.js'],
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
    src: ['public/lib/bootstrap/dist/css/bootstrap.min.css',  'public/dist/css/**/*.css'],
    dest: 'public/dist/css/main.css'
  }
};

