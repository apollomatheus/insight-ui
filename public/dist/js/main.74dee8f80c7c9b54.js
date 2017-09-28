/* @generated */
// Source: public/src/js/app.js
var defaultCurrency = localStorage.getItem('insight-currency') || 'RMG';

angular.module('insight',[
  'ngAnimate',
  'ngResource',
  'ngRoute',
  'ngProgress',
  'ui.bootstrap',
  'monospaced.qrcode',
  'angularMoment',
  'insight.system',
  'insight.socket',
  'insight.blocks',
  'insight.transactions',
  'insight.address',
  'insight.search',
  'insight.status',
  'insight.notify',
  'insight.connection',
  'insight.currency',
  'insight.messages',
  'insight.network',
  'insight.validators',
  'ngRaven'
]);

angular.module('insight.system', []);
angular.module('insight.socket', []);
angular.module('insight.blocks', []);
angular.module('insight.transactions', []);
angular.module('insight.address', []);
angular.module('insight.search', []);
angular.module('insight.status', []);
angular.module('insight.connection', []);
angular.module('insight.currency', []);
angular.module('insight.messages', []);
angular.module('insight.network', []);
angular.module('insight.validators', []);
angular.module('insight.notify', []);


// Source: public/src/js/controllers/address.js
angular.module('insight.address').controller('AddressController',
  ['$scope', '$rootScope', '$routeParams', '$location', 'Address', 'getSocket', 'NotifyService', function($scope, $rootScope, $routeParams, $location, Address, getSocket, NotifyService) {

    var socket = getSocket($scope);
    var addrStr = $routeParams.addrStr;

    var _startSocket = function() {
      socket.on('bitcoind/addresstxid', function(data) {
        if (data.address === addrStr) {
          $rootScope.$broadcast('tx', data.txid);
          var base = document.querySelector('base');
          var beep = new Audio(base.href + '/sound/transaction.mp3');
          beep.play();
        }
      });
      socket.emit('subscribe', 'bitcoind/addresstxid', [addrStr]);
    };

    var _stopSocket = function () {
      socket.emit('unsubscribe', 'bitcoind/addresstxid', [addrStr]);
    };

    socket.on('connect', function() {
      _startSocket();
    });

    $scope.$on('$destroy', function(){
      _stopSocket();
    });

    $scope.params = $routeParams;

    $scope.findOne = function() {
      $rootScope.currentAddr = $routeParams.addrStr;
      _startSocket();

      Address.get({
          addrStr: $routeParams.addrStr
        },
        function(address) {
          $rootScope.titleDetail = address.addrStr.substring(0, 7) + '...';
          $scope.address = address;
        },
        function(e) {
          if (e.status === 400) {
            NotifyService.error('Invalid Address: ' + $routeParams.addrStr);
          } else if (e.status === 503) {
            NotifyService.error('Backend Error. ' + e.data);
          } else {
            NotifyService.error('Address Not Found');
          }
          $location.path('/');
        });
    };

  }]);

// Source: public/src/js/controllers/blocks.js
angular.module('insight.blocks').controller('BlocksController',
  ['$scope', '$rootScope', '$routeParams', '$location', 'Global', 'Block', 'Blocks', 'BlockByHeight', 'NotifyService', function($scope, $rootScope, $routeParams, $location, Global, Block, Blocks, BlockByHeight, NotifyService) {
  $scope.global = Global;
  $scope.loading = false;
  
  $scope.goTo = function(path){
    $location.path(path);
  };

  if ($routeParams.blockHeight) {
    BlockByHeight.get({
      blockHeight: $routeParams.blockHeight
    }, function(hash) {
      $location.path('/block/' + hash.blockHash);
    }, function() {
      NotifyService.error('Bad Request');
      $location.path('/');
    });
  }

  //Datepicker
  var _formatTimestamp = function (date) {
    var yyyy = date.getUTCFullYear().toString();
    var mm = (date.getUTCMonth() + 1).toString(); // getMonth() is zero-based
    var dd  = date.getUTCDate().toString();

    return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); //padding
  };

  $scope.$watch('dt', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      $location.path('/blocks-date/' + _formatTimestamp(newValue));
    }
  });

  $scope.openCalendar = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.humanSince = function(time) {
    var m = moment.unix(time).startOf('day');
    var b = moment().startOf('day');
    return m.max().from(b);
  };


  $scope.list = function() {
    $scope.loading = true;

    if ($routeParams.blockDate) {
      $scope.detail = 'On ' + $routeParams.blockDate;
    }

    if ($routeParams.startTimestamp) {
      var d=new Date($routeParams.startTimestamp*1000);
      var m=d.getMinutes();
      if (m<10) m = '0' + m;
      $scope.before = ' before ' + d.getHours() + ':' + m;
    }

    $rootScope.titleDetail = $scope.detail;

    Blocks.get({
      blockDate: $routeParams.blockDate,
      startTimestamp: $routeParams.startTimestamp
    }, function(res) {
      $scope.loading = false;
      $scope.blocks = res.blocks;
      $scope.pagination = res.pagination;
    });
  };

  $scope.findOne = function() {
    $scope.loading = true;

    Block.get({
      blockHash: $routeParams.blockHash
    }, function(block) {
      $rootScope.titleDetail = block.height;
      $rootScope.flashMessage = null;
      $scope.loading = false;
      $scope.block = block;
    }, function(e) {
      if (e.status === 400) {
        NotifyService.error('Invalid Transaction ID: ' + $routeParams.txId);
      }
      else if (e.status === 503) {
        NotifyService.error('Backend Error. ' + e.data);
      }
      else {
        NotifyService.error('Block Not Found');
      }
      $location.path('/');
    });
  };

  $scope.params = $routeParams;

}]);

// Source: public/src/js/controllers/connection.js
angular.module('insight.connection').controller('ConnectionController',
  ['$scope', '$window', 'Status', 'PeerSync', function($scope, $window, Status, PeerSync) {

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

  }]);

// Source: public/src/js/controllers/currency.js
angular.module('insight.currency').controller('CurrencyController',
  ['$scope', '$rootScope', 'Currency', function($scope, $rootScope, Currency) {
    $rootScope.currency.symbol = defaultCurrency;

    var _roundFloat = function(x, n) {
      if(!parseInt(n, 10) || !parseFloat(x)) n = 0;

      return Math.round(x * Math.pow(10, n)) / Math.pow(10, n);
    };

    $rootScope.currency.getConvertion = function(value) {
      value = value * 1; // Convert to number

      if (!isNaN(value) && typeof value !== 'undefined' && value !== null) {
        if (value === 0.00000000) return '0 ' + this.symbol; // fix value to show

        var response;

        if (this.symbol === 'USD') {
          response = _roundFloat((value * this.factor), 2);
        } else if (this.symbol === 'mBTC') {
          this.factor = 1000;
          response = _roundFloat((value * this.factor), 5);
        } else if (this.symbol === 'bits') {
          this.factor = 1000000;
          response = _roundFloat((value * this.factor), 2);
        } else {
          this.factor = 1;
          response = value;
        }
        // prevent sci notation
        if (response < 1e-7) response=response.toFixed(8);
        return response + ' ' + this.symbol;
      }

      return 'value error';
    };

    $scope.setCurrency = function(currency) {
      $rootScope.currency.symbol = currency;
      localStorage.setItem('insight-currency', currency);

      if (currency === 'USD') {
        Currency.get({}, function(res) {
          $rootScope.currency.factor = $rootScope.currency.bitstamp = res.data.bitstamp;
        });
      } else if (currency === 'mBTC') {
        $rootScope.currency.factor = 1000;
      } else if (currency === 'bits') {
        $rootScope.currency.factor = 1000000;
      } else {
        $rootScope.currency.factor = 1;
      }
    };

    // Get initial value
    Currency.get({}, function(res) {
      $rootScope.currency.factor = $rootScope.currency.bitstamp = res.data.bitstamp;
    });

  }]);

// Source: public/src/js/controllers/footer.js
angular.module('insight.system').controller('FooterController',
  ['$scope', 'Version', function($scope, Version) {

    var _getVersion = function() {
      Version.get({},
        function(res) {
          $scope.version = res.version;
        });
    };

    $scope.version = _getVersion();
  }]);

// Source: public/src/js/controllers/header.js
angular.module('insight.system').controller('HeaderController',
  ['$scope', '$rootScope', '$uibModal', 'Global', 'Block', '$location', function($scope, $rootScope, $uibModal, Global, Block, $location) {
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
      $uibModal.open({
        templateUrl: 'scannerModal.html',
        controller: 'ScannerController'
      });
    };

    $rootScope.isCollapsed = true;
  }]);

// Source: public/src/js/controllers/index.js
var TRANSACTION_DISPLAYED = 5;
var BLOCKS_DISPLAYED = 5;

angular.module('insight.system').controller('IndexController',
  ['$scope', '$location', '$interval', '$timeout', 'Global', 'Blocks', 'LatestBlocks', 'LatestTransactions', 'AdminInfo', function($scope, $location, $interval, $timeout, Global, Blocks, LatestBlocks, LatestTransactions, AdminInfo) {

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
      var m = moment.unix(time);
      return m.max().fromNow();
    };

    $scope.txs = [];
    $scope.blocks = [];

    // Long polling
    $scope._getLatestBlock();
    $scope._getLatestTransaction();

    // Start the initial list of blocks
    $scope._getBlocks();
  }]);

// Source: public/src/js/controllers/network.js
angular.module('insight.network').controller('NetworkController',
  ['$scope', '$location', 'networks', 'Status', function($scope, $location, networks, Status) {
    
    $scope.networks = Object.keys(networks);
    $scope.selectedNetwork = '';
    Status.get({}, function(d) {
      $scope.selectedNetwork = d.info.network === 'livenet' ? 'mainnet' : d.info.network;
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
}]);

// Source: public/src/js/controllers/scanner.js
angular.module('insight.system').controller('ScannerController',
  ['$scope', '$rootScope', '$uibModalInstance', 'Global', 'NotifyService', function($scope, $rootScope, $uibModalInstance, Global, NotifyService) {
    $scope.global = Global;

    // Detect mobile devices
    var isMobile = {
      Android: function() {
          return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function() {
          return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function() {
          return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function() {
          return navigator.userAgent.match(/Opera Mini/i);
      },
      Windows: function() {
          return navigator.userAgent.match(/IEMobile/i);
      },
      any: function() {
          return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
      }
    };

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    $scope.isMobile = isMobile.any();
    $scope.scannerLoading = false;

    var $searchInput = angular.element(document.getElementById('search')),
        cameraInput,
        video,
        canvas,
        $video,
        context,
        localMediaStream;

    var _scan = function(evt) {
      if ($scope.isMobile) {
        $scope.scannerLoading = true;
        var files = evt.target.files;

        if (files.length === 1 && files[0].type.indexOf('image/') === 0) {
          var file = files[0];

          var reader = new FileReader();
          reader.onload = (function(theFile) {
            return function(e) {
              var mpImg = new MegaPixImage(file);
              mpImg.render(canvas, { maxWidth: 200, maxHeight: 200, orientation: 6 });

              setTimeout(function() {
                qrcode.width = canvas.width;
                qrcode.height = canvas.height;
                qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);

                try {
                  //alert(JSON.stringify(qrcode.process(context)));
                  qrcode.decode();
                } catch (e) {
                  alert(e);
                }
              }, 1500);
            };
          })(file);

          // Read  in the file as a data URL
          reader.readAsDataURL(file);
        }
      } else {
        if (localMediaStream) {
          context.drawImage(video, 0, 0, 300, 225);

          try {
            qrcode.decode();
          } catch(e) {
            //qrcodeError(e);
          }
        }

        setTimeout(_scan, 500);
      }
    };

    var _successCallback = function(stream) {
      video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      localMediaStream = stream;
      video.play();
      setTimeout(_scan, 1000);
    };

    var _stopTracks = function() {

      if(localMediaStream && localMediaStream.getTracks) {
        localMediaStream.getTracks()[0].stop();
      }

      if (localMediaStream && localMediaStream.stop){
        localMediaStream.stop();
      }
    };

    var _scanStop = function() {
      $scope.scannerLoading = false;
      $uibModalInstance.close();
      if (!$scope.isMobile) {
        _stopTracks();
        localMediaStream = null;
        video.src = '';
      }
    };

    var _videoError = function(err) {
      NotifyService.info('Camera feature no longer works on insecure origins. To use this feature, you should consider switching your application to a secure origin, such as HTTPS.');
      _scanStop();
    };

    qrcode.callback = function(data) {
      _scanStop();

      var str = (data.indexOf('bitcoin:') === 0) ? data.substring(8) : data; 
      console.log('QR code detected: ' + str);
      $searchInput
        .val(str)
        .triggerHandler('change')
        .triggerHandler('submit');
    };

    $scope.cancel = function() {
      _scanStop();
    };

    $uibModalInstance.opened.then(function() {
      $rootScope.isCollapsed = true;

      // Start the scanner
      setTimeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if ($scope.isMobile) {
          cameraInput = document.getElementById('qrcode-camera');
          cameraInput.addEventListener('change', _scan, false);
        } else {
          video = document.getElementById('qrcode-scanner-video');
          $video = angular.element(video);
          canvas.width = 300;
          canvas.height = 225;
          context.clearRect(0, 0, 300, 225);

          navigator.getUserMedia({video: true}, _successCallback, _videoError);
        }
      }, 500);
    });
}]);

// Source: public/src/js/controllers/search.js
angular.module('insight.search').controller('SearchController',
  ['$scope', '$routeParams', '$location', '$timeout', 'Global', 'Block', 'Transaction', 'Address', 'BlockByHeight', function($scope, $routeParams, $location, $timeout, Global, Block, Transaction, Address, BlockByHeight) {
  $scope.global = Global;
  $scope.loading = false;

  var _badQuery = function() {
    $scope.badQuery = true;

    $timeout(function() {
      $scope.badQuery = false;
    }, 2000);
  };

  var _resetSearch = function() {
    $scope.q = '';
    $scope.loading = false;
  };

  $scope.search = function() {
    var q = $scope.q;
    $scope.badQuery = false;
    $scope.loading = true;

    Block.get({
      blockHash: q
    }, function() {
      _resetSearch();
      $location.path('block/' + q);
    }, function() { //block not found, search on TX
      Transaction.get({
        txId: q
      }, function() {
        _resetSearch();
        $location.path('tx/' + q);
      }, function() { //tx not found, search on Address
        Address.get({
          addrStr: q
        }, function() {
          _resetSearch();
          $location.path('address/' + q);
        }, function() { // block by height not found
          if (isFinite(q)) { // ensure that q is a finite number. A logical height value.
            BlockByHeight.get({
              blockHeight: q
            }, function(hash) {
              _resetSearch();
              $location.path('/block/' + hash.blockHash);
            }, function() { //not found, fail :(
              $scope.loading = false;
              _badQuery();
            });
          }
          else {
            $scope.loading = false;
            _badQuery();
          }
        });
      });
    });
  };

}]);

// Source: public/src/js/controllers/transactions.js
angular.module('insight.transactions').controller('transactionsController',
['$scope', '$rootScope', '$routeParams', '$location', 'Global', 'Transaction', 'TransactionsByBlock', 'TransactionsByAddress', 'NotifyService', function($scope, $rootScope, $routeParams, $location, Global, Transaction, TransactionsByBlock, TransactionsByAddress, NotifyService) {
  $scope.global = Global;
  $scope.loading = false;
  $scope.loadedBy = null;

  $scope.adminInfo = {
    'issue_thread_transactions': {
      displayName: 'Issuance Transaction',
      type: 'issue_thread_transactions'
    },

    'provision_transactions': {
      displayName: 'Provision Transactions',
      type: 'provisioning_transactions'
    },

    'root_thread': {
      displayName: 'Root Thread',
      type: 'root_thread'
    },

    'issue_rmg': {
      displayName: 'Issue RMG',
      type: 'issue_rmg'
    },
    'destroy_rmg': {
      displayName: 'Destroy RMG',
      type: 'destroy_rmg'
    },

    'issue_key_add': {
      displayName: 'Add Issuer Key',
      type: 'issue_key_add'
    },
    'issue_key_revoke': {
      displayName: 'Revoke Issuer key',
      type: 'issue_key_revoke'
    },

    'provision_key_add': {
      displayName: 'Add Provisioner Key',
      type: 'provision_key_add'
    },
    'provision_key_revoke': {
      displayName: 'Revoke Provisioner Key',
      type: 'provision_key_revoke'
    },

    'validate_key_add': {
      displayName: 'Add Validator Key',
      type: 'validate_key_add'
    },
    'validate_key_revoke': {
      displayName: 'Revoke Validator Key',
      type: 'validate_key_revoke'
    },

    'asp_key_add': {
      displayName: 'Add ASP Key',
      type: 'asp_key_add'
    },
    'asp_key_revoke': {
      displayName: 'Revoke ASP Key',
      type: 'asp_key_revoke'
    }
  };

  var pageNum = 0;
  var pagesTotal = 1;
  var COIN = 100000000;

  var _aggregateItems = function(items) {
    if (!items) return [];

    var l = items.length;

    var ret = [];
    var tmp = {};
    var u = 0;

    for(var i=0; i < l; i++) {

      var notAddr = false;
      // non standard input
      if (items[i].scriptSig && !items[i].addr) {
        items[i].addr = 'Non standard';
        items[i].notAddr = true;
        notAddr = true;
      }

      // non standard output
      if (items[i].scriptPubKey && !items[i].scriptPubKey.addresses) {
        items[i].scriptPubKey.addresses = ['Non standard'];
        items[i].notAddr = true;
        notAddr = true;
      }

      // multiple addr at output
      if (items[i].scriptPubKey && items[i].scriptPubKey.addresses.length > 1) {
        items[i].addr = items[i].scriptPubKey.addresses.join(',');
        ret.push(items[i]);
        continue;
      }

      var addr = items[i].addr || (items[i].scriptPubKey && items[i].scriptPubKey.addresses[0]);

      if (!tmp[addr]) {
        tmp[addr] = {};
        tmp[addr].valueSat = 0;
        tmp[addr].count = 0;
        tmp[addr].addr = addr;
        tmp[addr].items = [];
      }
      tmp[addr].isSpent = items[i].spentTxId;

      tmp[addr].doubleSpentTxID = tmp[addr].doubleSpentTxID   || items[i].doubleSpentTxID;
      tmp[addr].doubleSpentIndex = tmp[addr].doubleSpentIndex || items[i].doubleSpentIndex;
      tmp[addr].dbError = tmp[addr].dbError || items[i].dbError;
      tmp[addr].valueSat += Math.round(items[i].value * COIN);
      tmp[addr].items.push(items[i]);
      tmp[addr].notAddr = notAddr;

      if (items[i].unconfirmedInput)
        tmp[addr].unconfirmedInput = true;

      tmp[addr].count++;
    }

    angular.forEach(tmp, function(v) {
      v.value    = v.value || parseInt(v.valueSat) / COIN;
      ret.push(v);
    });
    return ret;
  };

  var _processTX = function(tx) {
    tx.vinSimple = _aggregateItems(tx.vin);
    tx.voutSimple = _aggregateItems(tx.vout);
  };

  var _paginate = function(data) {
    $scope.loading = false;

    pagesTotal = data.pagesTotal;
    pageNum += 1;

    data.txs.forEach(function(tx) {
      _processTX(tx);
      $scope.txs.push(tx);
    });
  };

  var _byBlock = function() {
    TransactionsByBlock.get({
      block: $routeParams.blockHash,
      pageNum: pageNum
    }, function(data) {
      _paginate(data);
    });
  };

  var _byAddress = function () {
    TransactionsByAddress.get({
      address: $routeParams.addrStr,
      pageNum: pageNum
    }, function(data) {
      _paginate(data);
    });
  };

  var _findTx = function(txid) {
    Transaction.get({
      txId: txid
    }, function(tx) {
      $rootScope.titleDetail = tx.txid.substring(0,7) + '...';

      $scope.tx = tx;
      _processTX(tx);
      $scope.txs.unshift(tx);
    }, function(e) {
      if (e.status === 400) {
        NotifyService.error('Invalid Transaction ID: ' + $routeParams.txId);
      }
      else if (e.status === 503) {
        NotifyService.error('Backend Error. ' + e.data);
      }
      else {
        NotifyService.error('Transaction Not Found');
      }

      $location.path('/');
    });
  };

  $scope.isFundsOperation = function() {
    return  $scope.tx.adminInfo.type === $scope.adminInfo.issue_rmg.type ||
        $scope.tx.adminInfo.type === $scope.adminInfo.destroy_rmg.type;
  };

  $scope.isAddingOrRemovingKeys = function() {
    return $scope.tx.adminInfo.type === $scope.adminInfo.issue_key_add.type ||
      $scope.tx.adminInfo.type === $scope.adminInfo.issue_key_revoke.type;
  };

  // Filter outputs, to show only the ones that has a value on it
  // Issuance tx's
  $scope.outputHasValue = function() {
    return function(item){
      return item.value > 0;
    }
  };

  $scope.findThis = function() {
    _findTx($routeParams.txId);
  };

  //Initial load
  $scope.load = function(from) {
    $scope.loadedBy = from;
    $scope.loadMore();
  };

  //Load more transactions for pagination
  $scope.loadMore = function() {
    if (pageNum < pagesTotal && !$scope.loading) {
      $scope.loading = true;

      if ($scope.loadedBy === 'address') {
        _byAddress();
      }
      else {
        _byBlock();
      }
    }
  };

  // Highlighted txout
  if ($routeParams.v_type == '>' || $routeParams.v_type == '<') {
    $scope.from_vin = $routeParams.v_type == '<' ? true : false;
    $scope.from_vout = $routeParams.v_type == '>' ? true : false;
    $scope.v_index = parseInt($routeParams.v_index);
    $scope.itemsExpanded = true;
  }
  
  //Init without txs
  $scope.txs = [];

  $scope.$on('tx', function(event, txid) {
    _findTx(txid);
  });

}]);

angular.module('insight.transactions').controller('SendRawTransactionController',
  ['$scope', '$http', function($scope, $http) {
  $scope.transaction = '';
  $scope.status = 'ready';  // ready|loading|sent|error
  $scope.txid = '';
  $scope.error = null;

  $scope.formValid = function() {
    return !!$scope.transaction;
  };
  $scope.send = function() {
    var postData = {
      rawtx: $scope.transaction
    };
    $scope.status = 'loading';
    $http.post(window.apiPrefix + '/tx/send', postData)
      .then(function(data, status, headers, config) {
        if(typeof(data.txid) != 'string') {
          // API returned 200 but the format is not known
          $scope.status = 'error';
          $scope.error = 'The transaction was sent but no transaction id was got back';
          return;
        }

        $scope.status = 'sent';
        $scope.txid = data.txid;
      })
      .catch(function(error) {
        $scope.status = 'error';
        if(error) {
          $scope.error = error;
        } else {
          $scope.error = "No error message given (connection error?)"
        }
      });
  };
}]);

angular.module('insight.transactions').controller('DecodeRawTransactionController',
  ['$scope', '$http', function($scope, $http) {
  $scope.transaction = '';
  $scope.decodedTx = null;
  $scope.status = 'ready';  // ready|loading|decode|error
  $scope.error = null;

  $scope.formValid = function() {
    return !!$scope.transaction;
  };

  $scope.clean = function() {
    $scope.decodedTx = null;
  };
  $scope.decode = function() {
    var postData = {
      rawtx: $scope.transaction
    };
    $scope.status = 'loading';
    $http.post(window.apiPrefix + '/tx/decodeRawTx', postData)
      .then(function(data, status, headers, config) {
        $scope.status = 'ready';
        $scope.decodedTx = JSON.stringify(data, null, 2);
      })
      .catch(function(err) {
        $scope.status = 'error';
        if(err) {
          $scope.error = err;
        } else {
          $scope.error = "No error message given (connection error?)"
        }
      });
  };
}]);

// Source: public/src/js/controllers/validators.js
angular.module('insight.validators').controller('ValidatorsController',
['$scope', 'AdminInfo', function($scope, AdminInfo) {
    $scope.validators = [];
    AdminInfo.get({},
    function(result) {
      $scope.validators = result.validators;
    });
}]);

// Source: public/src/js/services/address.js
angular.module('insight.address').factory('Address',
  ['$resource', function($resource) {
  return $resource(window.apiPrefix + '/addr/:addrStr/?noTxList=1', {
    addrStr: '@addStr'
  }, {
    get: {
      method: 'GET',
      interceptor: {
        response: function (res) {
          return res.data;
        },
        responseError: function (res) {
          if (res.status === 404) {
            return res;
          }
        }
      }
    }
  });
}]);

 
// Source: public/src/js/services/blocks.js
angular.module('insight.blocks')
  .factory('Block',
    ['$resource', function($resource) {
    return $resource(window.apiPrefix + '/block/:blockHash', {
      blockHash: '@blockHash'
    }, {
      get: {
        method: 'GET',
        interceptor: {
          response: function (res) {
            return res.data;
          },
          responseError: function (res) {
            if (res.status === 404) {
              return res;
            }
          }
        }
      }
    });
  }])
  .factory('Blocks',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/blocks');
  }])
  .factory('LatestBlocks',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/blocks/latest', {}, { get:  { method:'GET', timeout: 45000 } });
    }])
  .factory('BlockByHeight',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/block-index/:blockHeight');
  }]);

// Source: public/src/js/services/currency.js
angular.module('insight.currency').factory('Currency',
  ['$resource', function($resource) {
    return $resource(window.apiPrefix + '/currency');
}]);

// Source: public/src/js/services/global.js
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
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/version');
  }]);

// Source: public/src/js/services/notifyService.js
angular.module('insight.notify')
.factory('NotifyService', ['$timeout', '$http', '$compile', '$templateCache', '$rootScope', function($timeout, $http, $compile, $templateCache, $rootScope){

  var templates = {
    info: 'views/notifications/notification-info.html',
    error: 'views/notifications/notification-error.html',
    success: 'views/notifications/notification-success.html'
  };
  var startTop = 75;
  var verticalSpacing = 15;
  var duration = 5000;
  var defaultType = 'info';
  var position = 'center';
  var container = document.body;

  // local instance of the message elements
  var messageElements = [];

  // Notifier Constructor
  var Notifier = function() {};

  Notifier.prototype.notify = function(args) {
    if (typeof args !== 'object'){
      args = {message:args};
    }

    // set up the locals
    args.type = args.type || defaultType;
    args.position = args.position || position;
    args.container = args.container || container;
    args.classes = args.classes || '';
    args.duration = args.duration || duration;

    // set up the scope for the template
    var scope = args.scope ? args.scope.$new() : $rootScope.$new();
    scope.$message = args.message;
    scope.$classes = args.classes;
    try {
      $http.get(templates[args.type], {cache: $templateCache})
        .then(function(response){
          // compile the template with the new scope
          var templateElement = $compile(response.data)(scope);
          // bind to the end of the opacity transition event, and when the
          // element is invisible, remove it from the messages array and view
          templateElement.bind('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd', function(e){
            if (e.propertyName === 'opacity' ||
              (e.originalEvent && e.originalEvent.propertyName === 'opacity')){
              templateElement.remove();
              messageElements.splice(messageElements.indexOf(templateElement),1);
              layoutMessages();
            }
          });

          angular.element(args.container).append(templateElement);
          messageElements.push(templateElement);

          if (args.position === 'center'){
            $timeout(function(){
              templateElement.css('margin-left','-' + (templateElement[0].offsetWidth /2) + 'px');
            });
          }

          scope.$close = function(){
            // at end of transition, message is removed
            templateElement.css('opacity', 0).attr('data-closing', 'true');
            // reflow the messages and clean up the old scope
            layoutMessages();
            scope.$destroy();
          };

          function layoutMessages(){
            var currentY = startTop;
            for(var i = messageElements.length - 1; i >= 0; i --){
              var shadowHeight = 10;
              var element = messageElements[i];
              var height = element[0].offsetHeight;
              var top = currentY + height + shadowHeight;
              if (element.attr('data-closing')){
                top += 20;
              } else {
                currentY += height + verticalSpacing;
              }
              element.css('top', top + 'px').css('margin-top','-' + (height+shadowHeight) + 'px').css('visibility','visible');
            }
          }

          $timeout(function(){
            layoutMessages();
          });

          if (args.duration > 0){
            $timeout(function(){
              scope.$close();
            }, args.duration);
          }
        }, function(data){
          throw new Error('Template specified for cgNotify ('+args.type+') could not be loaded. ' + data);
        });
    } catch(error) {
      console.log('Error loading the notification template: ', error.message);
    }

    var retVal = {};

    retVal.close = function(){
      if (scope.$close){
        scope.$close();
      }
    };

    Object.defineProperty(retVal,'message',{
      get: function(){
        return scope.$message;
      },
      set: function(val){
        scope.$message = val;
      }
    });

    return retVal;

  };

  Notifier.prototype.config = function(args) {
    startTop = !angular.isUndefined(args.startTop) ? args.startTop : startTop;
    verticalSpacing = !angular.isUndefined(args.verticalSpacing) ? args.verticalSpacing : verticalSpacing;
    duration = !angular.isUndefined(args.duration) ? args.duration : duration;
    defaultType = args.type ? args.type : defaultType;
    position = !angular.isUndefined(args.position) ? args.position : position;
    container = args.container ? args.container : container;
  };

  Notifier.prototype.closeAll = function() {
    for(var i = messageElements.length - 1; i >= 0; i --){
      var element = messageElements[i];
      element.css('opacity',0);
    }
  };

  return {
    notify: function(args) {
      return new Notifier().notify(args);
    },
    success: function(msg, duration) {
      var params = { type: 'success', message: msg, duration: duration };
      return this.notify(params);
    },
    successHandler: function(msg) {
      var args = { type: 'success', message: msg };
      var self = this;
      return function() {
        return self.notify(args);
      };
    },
    error: _.debounce(function(msg) {
      var params = { type: 'error', message: _.capitalize(msg) };
      return this.notify(params);
    }, 1000),
    errorHandler: function(error) {
      var args = { type: 'error', message: _.capitalize(error.error) };
      return new Notifier().notify(args);
    },
    info: function(msg) {
      var params = { type: 'info', message: msg };
      return this.notify(params);
    },
    closeAll: function() {
      return new Notifier().closeAll();
    }
  };
}]);

// Source: public/src/js/services/socket.js
var ScopedSocket = function(socket, $rootScope) {
  this.socket = socket;
  this.$rootScope = $rootScope;
  this.listeners = [];
};

ScopedSocket.prototype.removeAllListeners = function(opts) {
  if (!opts) opts = {};
  for (var i = 0; i < this.listeners.length; i++) {
    var details = this.listeners[i];
    if (opts.skipConnect && details.event === 'connect') {
      continue;
    }
    this.socket.removeListener(details.event, details.fn);
  }
  this.listeners = [];
};

ScopedSocket.prototype.on = function(event, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;

  var wrapped_callback = function() {
    var args = arguments;
    $rootScope.$apply(function() {
      callback.apply(socket, args);
    });
  };
  socket.on(event, wrapped_callback);

  this.listeners.push({
    event: event,
    fn: wrapped_callback
  });
};

ScopedSocket.prototype.emit = function(event, data, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;
  var args = Array.prototype.slice.call(arguments);

  args.push(function() {
    var args = arguments;
    $rootScope.$apply(function() {
      if (callback) {
        callback.apply(socket, args);
      }
    });
  });

  socket.emit.apply(socket, args);
};

angular.module('insight.socket').factory('getSocket',
  ['$rootScope', function($rootScope) {
    var socket = io.connect(null, {
      'reconnect': true,
      'reconnection delay': 500,
    });
    return function(scope) {
      var scopedSocket = new ScopedSocket(socket, $rootScope);
      scope.$on('$destroy', function() {
        scopedSocket.removeAllListeners();
      });
      socket.on('connect', function() {
        scopedSocket.removeAllListeners({
          skipConnect: true
        });
      });
      return scopedSocket;
    };
  }]);

// Source: public/src/js/services/status.js
angular.module('insight.status')
  .factory('Status',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/status', {
        q: '@q'
      });
    }])
  .factory('Sync',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/sync');
    }])
  .factory('PeerSync',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/peer');
    }])
  .factory('AdminInfo',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/adminInfo');
    }]);

// Source: public/src/js/services/transactions.js

angular.module('insight.transactions')
  .factory('Transaction',
    ['$resource', function($resource) {
    return $resource(window.apiPrefix + '/tx/:txId', {
      txId: '@txId'
    }, {
      get: {
        method: 'GET',
        interceptor: {
          response: function (res) {
            return res.data;
          },
          responseError: function (res) {
            if (res.status === 404) {
              return res;
            }
          }
        }
      }
    });
  }])
  .factory('TransactionsByBlock',
    ['$resource', function($resource) {
    return $resource(window.apiPrefix + '/txs', {
      block: '@block'
    });
  }])
  .factory('TransactionsByAddress',
    ['$resource', function($resource) {
    return $resource(window.apiPrefix + '/txs', {
      address: '@address'
    });
  }])
  .factory('Transactions',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/txs');
  }])
  .factory('LatestTransactions',
    ['$resource', function($resource) {
      return $resource(window.apiPrefix + '/txs/latest', {}, { get:  { method:'GET', timeout: 45000 } });
  }]);

// Source: public/src/js/directives.js
var ZeroClipboard = window.ZeroClipboard;

angular.module('insight')
  .directive('scroll', ['$window', function ($window) {
    return function(scope, element, attrs) {
      angular.element($window).bind('scroll', function() {
        if (this.pageYOffset >= 200) {
          scope.secondaryNavbar = true;
        } else {
          scope.secondaryNavbar = false;
        }
        scope.$apply();
      });
    };
  }])
  .directive('whenScrolled', ['$window', function($window) {
    return {
      restric: 'A',
      link: function(scope, elm, attr) {
        var pageHeight, clientHeight, scrollPos;
        $window = angular.element($window);

        var handler = function() {
          pageHeight = window.document.documentElement.scrollHeight;
          clientHeight = window.document.documentElement.clientHeight;
          scrollPos = window.pageYOffset;

          if (pageHeight - (scrollPos + clientHeight) === 0) {
            scope.$apply(attr.whenScrolled);
          }
        };

        $window.on('scroll', handler);

        scope.$on('$destroy', function() {
          return $window.off('scroll', handler);
        });
      }
    };
  }])
  .directive('clipCopy', function() {
    ZeroClipboard.config({
      moviePath: '/lib/zeroclipboard/ZeroClipboard.swf',
      trustedDomains: ['*'],
      allowScriptAccess: 'always',
      forceHandCursor: true
    });

    return {
      restric: 'A',
      scope: { clipCopy: '=clipCopy' },
      template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">Copied!</div></div>',
      link: function(scope, elm) {
        var clip = new ZeroClipboard(elm);

        clip.on('load', function(client) {
          var onMousedown = function(client) {
            client.setText(scope.clipCopy);
          };

          client.on('mousedown', onMousedown);

          scope.$on('$destroy', function() {
            client.off('mousedown', onMousedown);
          });
        });

        clip.on('noFlash wrongflash', function() {
          return elm.remove();
        });
      }
    };
  })
  .directive('focus', ['$timeout', function ($timeout) {
    return {
      scope: {
        trigger: '@focus'
      },
      link: function (scope, element) {
        scope.$watch('trigger', function (value) {
          if (value === "true") {
            $timeout(function () {
              element[0].focus();
            });
          }
        });
      }
    };
  }])
  .directive('loadingDots', function(){
    return {
      restrict: 'AE',
      replace: true,
      template: '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>'
    };
  })
  /* There is an issue where we can't debug, this is a try to see if fixes the issue,
    this has to be a temp fix rather than a long one. We should refactor to angular 1.6 and everything
    should be fine, but for now, let's try to unblock the issue
  */
  .directive('includeHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/header.html'
    }
  })
  .directive('includeFooter', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/footer.html'
    }
  })
  .directive('includeConnection', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/connection.html'
    }
  })
  .directive('includeTxDetail', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/transaction/txDetail.html'
    }
  })
  .directive('includeIssuanceTxDetail', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/transaction/issuance/txDetail.html'
    }
  })
  .directive('includeKeysTxDetail', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/transaction/addOrRemoveKeys/txDetail.html'
    }
  })
  .directive('includeBlockList', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/transaction/blockList.html'
    }
  })
  .directive('includeSearch', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/search.html'
    }
  })
  .directive('includeAddressList', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/transaction/addressList.html'
    }
  });





// Source: public/src/js/filters.js
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

// Source: public/src/js/config.js
//Setting up route
angular.module('insight').config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/block/:blockHash', {
      templateUrl: 'views/block.html',
      title: 'RMG Block '
    }).
    when('/tx/:txId/:v_type?/:v_index?', {
      templateUrl: 'views/transaction.html',
      title: 'RMG Transaction '
    }).
    when('/', {
      templateUrl: 'views/landing.html',
      title: 'Home'
    }).
    when('/address/:addrStr', {
      templateUrl: 'views/address.html',
      title: 'RMG Address '
    }).
    when('/about', {
      templateUrl: 'views/about.html',
      title: 'About'
    }).
    when('/tools', {
      templateUrl: 'views/tools.html',
      title: 'Tools'
    }).
    when('/validators', {
      templateUrl: 'views/validators.html',
      title: 'Validators'
    })
    .otherwise({
      templateUrl: 'views/404.html',
      title: 'Error'
    });
}]);

//Setting HTML5 Location Mode
angular.module('insight')
  .config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  }])
  .constant("networks", {
       "mainnet": {
         "url": "//localhost:3001/insight"
       },
       "testnet": {
         "url": "//localhost:3001/insight"
       }
   })
  .config(['RavenProvider',
    function(RavenProvider) {
      Raven.config('https://da5bfb722ec544ccb9fa29a0d1f6ca67@sentry.io/204716', {}).install();
    }
  ])
  .run(['$rootScope', '$route', '$location', '$routeParams', '$anchorScroll', 'ngProgress', 'amMoment', 'Status', 'Global', function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, amMoment, Status, Global) {
    $rootScope.$on('$routeChangeStart', function() {
      ngProgress.start();
    });

    $rootScope.$on('$routeChangeSuccess', function() {
      ngProgress.complete();

      //Change page title, based on Route information
      $rootScope.titleDetail = '';
      $rootScope.title = $route.current.title;
      $rootScope.isCollapsed = true;
      $rootScope.currentAddr = null;

      $location.hash($routeParams.scrollTo);
      $anchorScroll();
    });

    Status.get({ getInfo: true },
    function(res) {
      Global.info = res.info;
    });

  }]);

// Source: public/src/js/init.js
angular.element(document).ready(function() {
  // Init the app
  // angular.bootstrap(document, ['insight']);
});
