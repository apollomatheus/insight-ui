module.exports = {
  main: {
    files: ['public/src/js/**/*.js'],
    tasks: ['clean:main', 'clean:index', 'copy:html', 'concat:main', 'uglify:main', 'cacheBust'],
  },
  scss: {
    files: ['public/src/scss/**/*.scss'],
    tasks: ['clean:css', 'clean:index', 'copy:html', 'sass', 'concat:css', 'cssmin',  'clean:index', 'copy:html', 'cacheBust'],
  },
  html: {
    files: ['public/views/**/*.html'],
    tasks: ['clean:index', 'copy:html', 'cacheBust'],
  }
};
