module.exports = {
  options: {
    banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n',
    mangle: false
  },
  vendors: {
    src: 'dist/js/vendors.js',
    dest: 'dist/js/vendors.min.js'
  },
  angular: {
    src: 'dist/js/angularjs-all.js',
    dest: 'dist/js/angularjs-all.min.js'
  },
  main: {
    src: 'dist/js/main.js',
    dest: 'dist/js/main.min.js'
  }
};
