'use strict';

//Global service for global variables
angular.module('insight.system')
  .factory('Global',[
    function() {
      var module = {};

      module.info = {};
      return module;
    }
  ])
  .factory('Version',
    function($resource) {
      return $resource(window.apiPrefix + '/version');
  });
