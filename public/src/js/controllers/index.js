'use strict';

var TRANSACTION_DISPLAYED = 10;
var BLOCKS_DISPLAYED = 5;

angular.module('insight.system').controller('IndexController',
  function($scope, $location, Global, getSocket, Blocks, AdminInfo) {

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
    
    $scope.trimTxValue = function(value){
      return value.toFixed(4);
    };

    var _getBlocks = function() {
      Blocks.get({
        limit: BLOCKS_DISPLAYED
      }, function(res) {
        $scope.blocks = res.blocks;
        $scope.blocksLength = res.length;
      });
    };

    var socket = getSocket($scope);

    var _startSocket = function() { 
      socket.emit('subscribe', 'inv');
      socket.on('tx', function(tx) {
        $scope.txs.unshift(tx);
        if (parseInt($scope.txs.length, 10) >= parseInt(TRANSACTION_DISPLAYED, 10)) {
          $scope.txs = $scope.txs.splice(0, TRANSACTION_DISPLAYED);
        }
      });

      socket.on('block', function() {
        _getBlocks();
      });
    };

    socket.on('connect', function() {
      _startSocket();
    });



    $scope.humanSince = function(time) {
      var m = moment.unix(time);
      return m.max().fromNow();
    };

    $scope.index = function() {
      _getBlocks();
      _startSocket();
    };

    $scope.txs = [];
    $scope.blocks = [];
    
    $scope.options = {
           chart: {
               type: 'lineChart',
               height: 300,
               margin : {
                   top: 20,
                   right: 20,
                   bottom: 40,
                   left: 55
               },
               showControls: false,
               showLabels: false,
               showLegend: false,
               x: function(d){ return d.x; },
               y: function(d){ return d.y; },
               useInteractiveGuideline: false,
               interactive: false,
               dispatch: {
                   stateChange: function(e){ console.log("stateChange"); },
                   changeState: function(e){ console.log("changeState"); },
                   tooltipShow: function(e){ console.log("tooltipShow"); },
                   tooltipHide: function(e){ console.log("tooltipHide"); }
               },
               xAxis: {
                   axisLabel: 'Time (ms)',
                   showMaxMin: false,
               },
               yAxis: {
                   showMaxMin: false,
                   axisLabel: 'Voltage (v)',
                   tickFormat: function(d){
                       return d3.format('.02f')(d);
                   },
                   axisLabelDistance: -10
               },
               callback: function(chart){
                   console.log("!!! lineChart callback !!!");
               }
           },
           title: {
               enable: false
           },
           subtitle: {
               enable: false
           },
           caption: {
               enable: false
           }
       };

       $scope.data = sinAndCos();

       /*Random Data Generator */
       function sinAndCos() {
           var cos = [];

           //Data is represented as an array of {x,y} pairs.
           for (var i = 0; i < 50; i++) {
               cos.push({x: i, y: .5 * Math.cos(i/10+ 2) + Math.random() / 10});
           }

           return [{
                   values: cos,
                   key: 'Price',
                   color: '#D4AF37' // $$RoyalPurple
               }];
       };
       
  });
