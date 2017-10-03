'use strict';

var TRANSACTION_DISPLAYED = 5;
var BLOCKS_DISPLAYED = 5;

angular.module('insight.system').controller('IndexController',
  function($scope, $location, $interval, $timeout, Global, Blocks, LatestBlocks, LatestTransactions, AdminInfo) {

    $scope.totalSupply = null;
    $scope.validatingNodes = null;
    // Reference to error handler
    $scope.blocksPollingConfig = {
      throttling: false
    };

    $scope.txPollingConfig = {
      throttling: false
    };

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

    $scope.handleFetchError = function(err, config, callback) {
      // client cancel request due to timeout, or server timeout
      if(err.status == 0 || err.status === 408 || err.status === 504) {
        return callback();
      }

      // If is an error chill.
      if(!config.throttling) {
        config.throttling = true;
        $timeout(function(){
          config.throttling = false;
          callback();
        }, 3000)
      }
    };

    $scope.updateWithLastBlock = function(block) {
      // If server close the connection we get no block but an empty promise
      if(block && block.height) {
        // Are we too many blocks behind?
        if($scope.blocks.length && ($scope.blocks[0].height + 1) < block.height) {
          return $scope._getBlocks();
        }

        $scope.blocks.unshift(block);
        $scope.blocks = $scope.blocks.splice(0, BLOCKS_DISPLAYED);
      }
    };

    /**
     * Fetch the latest blocks from the API
     * @private
     */
    $scope._getLatestBlock = function() {
      // Get latest blocks from api
      LatestBlocks.get().$promise
      .then($scope.updateWithLastBlock)
      .then($scope._getLatestBlock)
      .catch(function(err) {
        $scope.handleFetchError(err, $scope.blocksPollingConfig, $scope._getLatestBlock);
      });
    };

    $scope._getBlocks = function() {
      Blocks.get({
        limit: BLOCKS_DISPLAYED
      }).$promise
      .then(function (res) {
        $scope.blocks = res.blocks;
      });
    };

    $scope.updateWithLastTx = function(tx) {
      // If server close the connection we get no tx but an empty promise
      if(tx && tx.txid) {
        $scope.txs.unshift(tx);
        $scope.txs = $scope.txs.splice(0, TRANSACTION_DISPLAYED);
      }
    };

    /**
     * Fetch latest transaction from API
     * @private
     */
    $scope._getLatestTransaction = function() {
      // Fetch latest transactions from api
      LatestTransactions.get().$promise
      .then($scope.updateWithLastTx)
      .then($scope._getLatestTransaction)
      .catch(function(err) {
        $scope.handleFetchError(err, $scope.txPollingConfig, $scope._getLatestTransaction);
      });
    };

    $scope.humanSince = function(time) {
      return moment.unix(time).fromNow();
    };

    $scope.txs = [];
    $scope.blocks = [];

    // Long polling
    $scope._getLatestBlock();
    $scope._getLatestTransaction();

    // Start the initial list of blocks
    $scope._getBlocks();
  });
