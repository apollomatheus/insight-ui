module.exports = {
  options: {
    banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n',
    mangle: false
  },
  vendors: {
    src: 'public/dist/js/vendors.js',
    dest: 'public/dist/js/vendors.js'
  },
  angular: {
    src: 'public/dist/js/angularjs-all.js',
    dest: 'public/dist/js/angularjs-all.js'
  },
  main: {
    src: 'public/dist/js/main.js',
    dest: 'public/dist/js/main.min.js'
  }
};
