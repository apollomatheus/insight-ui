module.exports = {
  css: {
    options: {
      baseDir: './dist/',
      deleteOriginals: false,
      assets: ['css/**/*.css']
    },
    files: [{
      expand: true,
      cwd: 'dist/',
      src: ['index.html']
    }]
  },

  js: {
    options: {
      baseDir: './dist/',
      deleteOriginals: false,
      assets: ['js/**/*.js']
    },
    files: [{
      expand: true,
      cwd: 'dist/',
      src: ['index.html']
    }]
  }
};