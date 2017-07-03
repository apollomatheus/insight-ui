'use strict';

angular.module('insight.system').controller('HeaderController',
  function($scope, $rootScope, $modal, getSocket, Global, Block, $location) {
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

    var _getBlock = function(hash) {
      Block.get({
        blockHash: hash
      }, function(res) {
        $scope.totalBlocks = res.height;
      });
    };

    var socket = getSocket($scope);
    socket.on('connect', function() {
      socket.emit('subscribe', 'inv');

      socket.on('block', function(block) {
        var blockHash = block.toString();
        _getBlock(blockHash);
      });
    });

    $rootScope.isCollapsed = true;
  });
