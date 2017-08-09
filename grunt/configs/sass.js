module.exports = {
  dist: {
    options: {
      sourceMap: false,
      sourceComments: false
    },
    files: {
      'public/dist/css/main.css': 'public/src/scss/sassSource.scss'
    }
  }
};
