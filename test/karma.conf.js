// Karma configuration
// Generated on Wed Nov 16 2016 12:10:41 GMT-0800 (PST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
    // Vendor Files
      "public/dist/js/vendors.js",
      "public/dist/js/angularjs-all.js",
      // Mocks module loading in the test file
      "node_modules/angular-mocks/angular-mocks.js",
      "node_modules/angular-resource/angular-resource.js",
      // Needed to instantiate websocket functionality in tests
      "node_modules/socket.io-client/dist/socket.io.min.js",
      "node_modules/karma/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js",
      // Our Library code
      "public/src/js/*.js",
      "public/src/js/**/*.js",
      // Our tests
      "test/*.js",
      "test/**/*.js"
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'public/src/js/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['coverage', 'dots'],

    coverageReporter: {
      reporters: [
        { type: 'html', dir: 'coverage/' },
        { type: 'text-summary' },
        { type: 'cobertura', subdir: '.', file: 'cobertura-coverage.xml' }
      ]
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}
