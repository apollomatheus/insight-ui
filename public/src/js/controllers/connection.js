'use strict';

angular.module('insight.connection').controller('ConnectionController',
  function($scope, $window, Status, PeerSync) {

    // Set initial values
    $scope.apiOnline = true;
    $scope.serverOnline = true;
    $scope.clienteOnline = true;

    // TODO: @robert ADD clientOnline & serverOnline functionality

    // Check for the  api connection
    $scope.getConnStatus = function() {
      PeerSync.get({},
        function(peer) {
          $scope.apiOnline = peer.connected;
          $scope.host = peer.host;
          $scope.port = peer.port;
        },
        function() {
          $scope.apiOnline = false;
        });
    };

    // Check for the client conneciton
    $window.addEventListener('offline', function() {
      $scope.$apply(function() {
        $scope.clienteOnline = false;
      });
    }, true);

    $window.addEventListener('online', function() {
      $scope.$apply(function() {
        $scope.clienteOnline = true;
      });
    }, true);

  });
