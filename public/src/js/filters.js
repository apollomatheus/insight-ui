'use strict';

angular.module('insight')
  .filter('startFrom', function() {
    return function(input, start) {
      start = +start; //parse to int
      return input.slice(start);
    }
  })
  .filter('split', function() {
    return function(input, delimiter) {
      var delimiter = delimiter || ',';
      return input.split(delimiter);
    }
  })
  .filter('coinFormatFilter', ['Global', function(Global) {
    return function (value, showCoin, trimValue) {
      if (showCoin) {
        return value + ' ' + (Global.info.testnet ? 'TRMG' : 'RMG');
      }

      if (trimValue) {
        value = value.toFixed(4)
      }

      return value;
    }
  }]);
