'use strict';

module.exports = function(grunt) {

  //Load NPM tasks
  var tasks = {scope: ['devDependencies', 'dependencies' ]};
  var options = {config: { src: "grunt/configs/*.js" }};
  var configs = require('load-grunt-configs')(grunt, options);
  require('load-grunt-tasks')(grunt, tasks);

  grunt.initConfig(configs);

  //Making grunt default to force in order not to break the project.
  grunt.option('force', true);

  //Default task(s).
  grunt.registerTask('default', ['watch']);

  //Update .pot file
  grunt.registerTask('translate', ['nggettext_extract']);

  //Compile task (concat + minify)
  grunt.registerTask('compile', ['clean', 'nggettext_compile', 'sass', 'concat', 'ngAnnotate', 'uglify', 'cssmin', 'copy', 'cacheBust']);

  grunt.registerTask('powermode', ['clean', 'nggettext_compile', 'sass', 'concat', 'ngAnnotate', 'uglify', 'cssmin', 'copy', 'watch']);
};
