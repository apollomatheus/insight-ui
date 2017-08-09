module.exports = {
  css: {
    options: {
      baseDir: './public/dist/',
      deleteOriginals: false,
      assets: ['css/**/*.css']
    },
    files: [{
      expand: true,
      cwd: 'public/dist/',
      src: ['index.html']
    }]
  },

  js: {
    options: {
      baseDir: './public/dist/',
      deleteOriginals: false,
      assets: ['js/**/*.js', 'js/**/*.min.js']
    },
    files: [{
      expand: true,
      cwd: 'public/dist/',
      src: ['index.html']
    }]
  }
};