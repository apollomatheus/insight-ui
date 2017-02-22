'use strict';

angular.module('insight.validators').controller('ValidatorsController',
function($scope, AdminInfo) {
    $scope.validators = [];
    AdminInfo.get({},
    function(result) {
      $scope.validators = result.validators;
    });
});
