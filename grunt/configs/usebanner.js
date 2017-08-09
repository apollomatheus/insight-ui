module.exports = {
  dist: {
    options: {
      position: 'top',
      banner: '/* @generated */',
      linebreak: true
    },
    files: {
      src: [ 'public/dist/js/**/*.js', 'public/dist/css/**/*.css' ]
    }
  }
}