module.exports = {
  dist: {
    options: {
      sourceMap: true,
      sourceComments: false
    },
    files: {
      'dist/src/css/sassTarget.css': 'public/src/scss/sassSource.scss'
    }
  }
};
