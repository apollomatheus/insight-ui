'use strict';

angular.module('insight.network').controller('NetworkController',
  function($scope, $location, networks, Status) {
    
    $scope.networks = Object.keys(networks);
    $scope.selectedNetwork = '';
    Status.get({}, function(d) {
      $scope.selectedNetwork = d.info.network;
      $scope.networkOptions = getNetworkOptions();
    });
  
    function getNetworkOptions() {
      var all = $scope.networks.slice(0);
      var selectedIndex = all.indexOf($scope.selectedNetwork);
      if (selectedIndex >= 0) {
        all.splice(selectedIndex, 1);
      }
      return all;
    }
    
    $scope.changeNetwork = function(network) {
      // $location.url(networks[network].url)
    };
});
