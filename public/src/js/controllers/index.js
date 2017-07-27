'use strict';

var TRANSACTION_DISPLAYED = 5;
var BLOCKS_DISPLAYED = 5;

angular.module('insight.system').controller('IndexController',
  function($scope, $location, $interval, Global, LatestBlocks, LatestTransactions, AdminInfo) {

    $scope.totalSupply = null;
    $scope.validatingNodes = null;
    AdminInfo.get({}, function(data){
      $scope.totalSupply = data.totalsupply;
      $scope.validatingNodes = data.validatekeys.length;
    });

    $scope.global = Global;

    $scope.goTo = function(path){
      $location.path(path);
    };

    $scope.preventDefault = function(e){
      return e.stopPropagation();
    };

    /**
     * We are going to update the UI only when new blocks are found.
     * @param blocks
     * @returns {boolean}
     */
    $scope.isGreaterThanCurrentBlockHeight = function(blocks) {

      if(!blocks || !blocks.length) {
        return false;
      }

      if(!$scope.blocks || !$scope.blocks.length) {
        return true;
      }

      if(_.maxBy(blocks, 'height').height > _.maxBy($scope.blocks, 'height').height) {
        return true;
      }

      return false;
    }

    /**
     * Fetch the latest blocks from the API
     * @private
     */
    var _getBlocks = function() {
      var updateBlocks = function(res) {
        if($scope.isGreaterThanCurrentBlockHeight(res.blocks)) {
          $scope.blocks = res.blocks;
          $scope.blocksLength = res.length;
        }
      };
      // Fetch latest blocks from api
      LatestBlocks.get({
        limit: BLOCKS_DISPLAYED
      }, updateBlocks);
    };

    /**
     * Compares the 2 list of transactions and checks if the first one has a transaction that does
     * not exist in the second one
     * @param txs
     * @param txsToCompare
     * @returns {boolean}
     */
    $scope.isTxIdsDifferent = function (txs, txsToCompare) {
      if(!txs) {
        return false;
      }

      if(!txsToCompare.length) {
        return true;
      }

      return _.find(txs, function (tx) {
        return !_.some(txsToCompare, { 'txid': tx.txid })
      });
    };

    /**
     * Fetch latest transactions from API
     * @private
     */
    var _getTransactions = function() {
      var updateTxs = function(res) {
        if($scope.isTxIdsDifferent(res, $scope.txs)) {
          $scope.txs = res;
        }
      };
      // Fetch latest blocks from api
      LatestTransactions.get({
        limit: TRANSACTION_DISPLAYED
      }, updateTxs);
    };

    $scope.humanSince = function(time) {
      var m = moment.unix(time);
      return m.max().fromNow();
    };

    $scope.index = function() {
      _getBlocks();
      _getTransactions();
    };

    $scope.txs = [];
    $scope.blocks = [];

    var killBlocksPolling = $interval(_getBlocks, 3000);
    var killTxPolling = $interval(_getTransactions, 500);

    $scope.$on('$destroy', function() {
      $interval.cancel(killBlocksPolling);
      $interval.cancel(killTxPolling);
    });
       
  });
