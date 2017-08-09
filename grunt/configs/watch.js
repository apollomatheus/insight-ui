module.exports = {
  main: {
    files: ['public/src/js/**/*.js'],
    tasks: ['clean:main', 'clean:index', 'copy:index', 'concat:main', 'uglify:main', 'cacheBust'],
  },
  scss: {
    files: ['public/src/scss/**/*.scss'],
    tasks: ['clean:css', 'clean:index', 'copy:index', 'sass', 'concat:css', 'cssmin',  'clean:index', 'copy:html', 'cacheBust'],
  },
  html: {
    files: ['public/views/**/*.html'],
    tasks: ['clean:index', 'copy:index', 'cacheBust'],
  }
};
