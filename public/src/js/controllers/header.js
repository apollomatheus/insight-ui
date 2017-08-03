'use strict';

angular.module('insight.system').controller('HeaderController',
  function($scope, $rootScope, $modal, Global, Block, $location) {
    $scope.global = Global;

    $scope.isTestnet = function() {
      return Global.info.testnet;
    };

    $scope.isActive = function(route) {
      return $location.path().indexOf(route) >= 0;
    };

    $rootScope.currency = {
      factor: 1,
      bitstamp: 0,
      symbol: 'RMG'
    };

    $scope.openScannerModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'scannerModal.html',
        controller: 'ScannerController'
      });
    };

    $rootScope.isCollapsed = true;
  });
