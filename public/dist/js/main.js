/* @generated */
// Source: public/src/js/app.js
var defaultLanguage = localStorage.getItem('insight-language') || 'en';
var defaultCurrency = localStorage.getItem('insight-currency') || 'RMG';

angular.module('insight',[
  'ngAnimate',
  'ngResource',
  'ngRoute',
  'ngProgress',
  'ui.bootstrap',
  'ui.route',
  'monospaced.qrcode',
  'gettext',
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
  ['$scope', '$route', '$templateCache', 'gettextCatalog', 'amMoment', 'Version', function($scope, $route, $templateCache, gettextCatalog, amMoment,  Version) {

    $scope.defaultLanguage = defaultLanguage;

    var _getVersion = function() {
      Version.get({},
        function(res) {
          $scope.version = res.version;
        });
    };

    $scope.version = _getVersion();

    $scope.availableLanguages = [{
      name: 'Deutsch',
      isoCode: 'de_DE',
    }, {
      name: 'English',
      isoCode: 'en',
    }, {
      name: 'Spanish',
      isoCode: 'es',
    }, {
      name: 'Japanese',
      isoCode: 'ja',
    }];

    $scope.setLanguage = function(isoCode) {
      gettextCatalog.currentLanguage = $scope.defaultLanguage = defaultLanguage = isoCode;
      amMoment.changeLocale(isoCode);
      localStorage.setItem('insight-language', isoCode);
      var currentPageTemplate = $route.current.templateUrl;
      $templateCache.remove(currentPageTemplate);
      $route.reload();
    };

  }]);

// Source: public/src/js/controllers/header.js
angular.module('insight.system').controller('HeaderController',
  ['$scope', '$rootScope', '$modal', 'Global', 'Block', '$location', function($scope, $rootScope, $modal, Global, Block, $location) {
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
  ['$scope', '$rootScope', '$modalInstance', 'Global', 'NotifyService', function($scope, $rootScope, $modalInstance, Global, NotifyService) {
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
      $modalInstance.close();
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

    $modalInstance.opened.then(function() {
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
      .success(function(data, status, headers, config) {
        if(typeof(data.txid) != 'string') {
          // API returned 200 but the format is not known
          $scope.status = 'error';
          $scope.error = 'The transaction was sent but no transaction id was got back';
          return;
        }

        $scope.status = 'sent';
        $scope.txid = data.txid;
      })
      .error(function(data, status, headers, config) {
        $scope.status = 'error';
        if(data) {
          $scope.error = data;
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
      .success(function(data, status, headers, config) {
        $scope.status = 'ready';
        $scope.decodedTx = JSON.stringify(data, null, 2);
      })
      .error(function(data, status, headers, config) {
        $scope.status = 'error';
        if(data) {
          $scope.error = data;
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
  .run(['$rootScope', '$route', '$location', '$routeParams', '$anchorScroll', 'ngProgress', 'gettextCatalog', 'amMoment', 'Status', 'Global', function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, gettextCatalog, amMoment, Status, Global) {
    gettextCatalog.currentLanguage = defaultLanguage;
    amMoment.changeLocale(defaultLanguage);
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

// Source: public/dist/js/translations.js
angular.module('insight').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
    gettextCatalog.setStrings('de_DE', {"(Input unconfirmed)":"(Eingabe unbestätigt)","404 Page not found :(":"404 Seite nicht gefunden :(","<strong>insight</strong>  is an <a href=\"http://live.insight.is/\" target=\"_blank\">open-source Bitcoin blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by bitcoind RPC.  Check out the <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">source code</a>.":"<strong>insight</strong> ist ein <a href=\"http://live.insight.is/\" target=\"_blank\">Open Source Bitcoin Blockchain Explorer</a> mit vollständigen REST und Websocket APIs um eigene Wallets oder Applikationen zu implementieren. Hierbei werden fortschrittlichere Abfragen der Blockchain ermöglicht, bei denen die RPC des Bitcoind nicht mehr ausreichen. Der aktuelle <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">Quellcode</a> ist auf Github zu finden.","<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">github issue tracker</a>.":"<strong>insight</strong> befindet sich aktuell noch in der Entwicklung. Bitte sende alle gefundenen Fehler (Bugs) und Feedback zur weiteren Verbesserung an unseren <a href=\"https://github.com/bitpay/insight-ui/issues\" target=\"_blank\">Github Issue Tracker</a>.","About":"Über insight","Address":"Adresse","Age":"Alter","Application Status":"Programmstatus","Best Block":"Bester Block","Bitcoin node information":"Bitcoin-Node Info","Block":"Block","Block Reward":"Belohnung","Blocks":"Blöcke","Bytes Serialized":"Serialisierte Bytes","Can't connect to bitcoind to get live updates from the p2p network. (Tried connecting to bitcoind at {{host}}:{{port}} and failed.)":"Es ist nicht möglich mit Bitcoind zu verbinden um live Aktualisierungen vom P2P Netzwerk zu erhalten. (Verbindungsversuch zu bitcoind an {{host}}:{{port}} ist fehlgeschlagen.)","Can't connect to insight server. Attempting to reconnect...":"Keine Verbindung zum insight-Server möglich. Es wird versucht die Verbindung neu aufzubauen...","Can't connect to internet. Please, check your connection.":"Keine Verbindung zum Internet möglich, bitte Zugangsdaten prüfen.","Complete":"Vollständig","Confirmations":"Bestätigungen","Conn":"Verbindungen","Connections to other nodes":"Verbindungen zu Nodes","Current Blockchain Tip (insight)":"Aktueller Blockchain Tip (insight)","Current Sync Status":"Aktueller Status","Details":"Details","Difficulty":"Schwierigkeit","Double spent attempt detected. From tx:":"Es wurde ein \"double Spend\" Versuch erkannt.Von tx:","Error!":"Fehler!","Fee":"Gebühr","Final Balance":"Schlussbilanz","Finish Date":"Fertigstellung","Go to home":"Zur Startseite","Hash Serialized":"Hash Serialisiert","Height":"Höhe","Included in Block":"Eingefügt in Block","Incoherence in levelDB detected:":"Es wurde eine Zusammenhangslosigkeit in der LevelDB festgestellt:","Info Errors":"Fehlerbeschreibung","Initial Block Chain Height":"Ursprüngliche Blockchain Höhe","Input":"Eingänge","Last Block":"Letzter Block","Last Block Hash (Bitcoind)":"Letzter Hash (Bitcoind)","Latest Blocks":"Letzte Blöcke","Latest Transactions":"Letzte Transaktionen","Loading Address Information":"Lade Adressinformationen","Loading Block Information":"Lade Blockinformation","Loading Selected Date...":"Lade gewähltes Datum...","Loading Transaction Details":"Lade Transaktionsdetails","Loading Transactions...":"Lade Transaktionen...","Loading...":"Lade...","Mined Time":"Block gefunden (Mining)","Mined by":"Gefunden von","Mining Difficulty":"Schwierigkeitgrad","Next Block":"Nächster Block","No Inputs (Newly Generated Coins)":"Keine Eingänge (Neu generierte Coins)","No blocks yet.":"Keine Blöcke bisher.","No matching records found!":"Keine passenden Einträge gefunden!","No. Transactions":"Anzahl Transaktionen","Number Of Transactions":"Anzahl der Transaktionen","Output":"Ausgänge","Powered by":"Powered by","Previous Block":"Letzter Block","Protocol version":"Protokollversion","Proxy setting":"Proxyeinstellung","Received Time":"Eingangszeitpunkt","Redirecting...":"Umleitung...","Search for block, address  and transactions":"Suche Block, Transaktion oder Adresse","See all blocks":"Alle Blöcke anzeigen","Show Transaction Output data":"Zeige Abgänge","Show all":"Zeige Alles","Show input":"Zeige Eingänge","Show less":"Weniger anzeigen","Show more":"Mehr anzeigen","Size":"Größe","Size (bytes)":"Größe (bytes)","Skipped Blocks (previously synced)":"Verworfene Blöcke (bereits syncronisiert)","Start Date":"Startdatum","Status":"Status","Summary":"Zusammenfassung","Summary <small>confirmed</small>":"Zusammenfassung <small>bestätigt</small>","Sync Progress":"Fortschritt","Sync Status":"Syncronisation","Sync Type":"Art der Syncronisation","Synced Blocks":"Syncronisierte Blöcke","Testnet":"Testnet aktiv","There are no transactions involving this address.":"Es gibt keine Transaktionen zu dieser Adressse","Time Offset":"Zeitoffset zu UTC","Timestamp":"Zeitstempel","Today":"Heute","Total Amount":"Gesamtsumme","Total Received":"Insgesamt empfangen","Total Sent":"Insgesamt gesendet","Transaction":"Transaktion","Transaction Output Set Information":"Transaktions Abgänge","Transaction Outputs":"Abgänge","Transactions":"Transaktionen","Type":"Typ","Unconfirmed":"Unbestätigt","Unconfirmed Transaction!":"Unbestätigte Transaktion!","Unconfirmed Txs Balance":"Unbestätigtes Guthaben","Value Out":"Wert","Version":"Version","Waiting for blocks...":"Warte auf Blöcke...","Waiting for transactions...":"Warte auf Transaktionen...","by date.":"nach Datum.","first seen at":"zuerst gesehen am","mined":"gefunden","mined on:":"vom:","Waiting for blocks":"Warte auf Blöcke"});
    gettextCatalog.setStrings('es', {"(Input unconfirmed)":"(Entrada sin confirmar)","404 Page not found :(":"404 Página no encontrada :(","<strong>insight</strong>  is an <a href=\"http://live.insight.is/\" target=\"_blank\">open-source Bitcoin blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by bitcoind RPC.  Check out the <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">source code</a>.":"<strong>insight</strong>  es un <a href=\"http://live.insight.is/\" target=\"_blank\">explorador de bloques de Bitcoin open-source</a> con un completo conjunto de REST y APIs de websockets que pueden ser usadas para escribir monederos de Bitcoins y otras aplicaciones que requieran consultar un explorador de bloques.  Obtén el código en <a href=\"http://github.com/bitpay/insight\" target=\"_blank\">el repositorio abierto de Github</a>.","<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">github issue tracker</a>.":"<strong>insight</strong> esta en desarrollo aún, por ello agradecemos que nos reporten errores o sugerencias para mejorar el software. <a href=\"https://github.com/bitpay/insight-ui/issues\" target=\"_blank\">Github issue tracker</a>.","About":"Acerca de","Address":"Dirección","Age":"Edad","Application Status":"Estado de la Aplicación","Best Block":"Mejor Bloque","Bitcoin node information":"Información del nodo Bitcoin","Block":"Bloque","Block Reward":"Bloque Recompensa","Blocks":"Bloques","Bytes Serialized":"Bytes Serializados","Can't connect to bitcoind to get live updates from the p2p network. (Tried connecting to bitcoind at {{host}}:{{port}} and failed.)":"No se pudo conectar a bitcoind para obtener actualizaciones en vivo de la red p2p. (Se intentó conectar a bitcoind de {{host}}:{{port}} y falló.)","Can't connect to insight server. Attempting to reconnect...":"No se pudo conectar al servidor insight. Intentando re-conectar...","Can't connect to internet. Please, check your connection.":"No se pudo conectar a Internet. Por favor, verifique su conexión.","Complete":"Completado","Confirmations":"Confirmaciones","Conn":"Con","Connections to other nodes":"Conexiones a otros nodos","Current Blockchain Tip (insight)":"Actual Blockchain Tip (insight)","Current Sync Status":"Actual Estado de Sincronización","Details":"Detalles","Difficulty":"Dificultad","Double spent attempt detected. From tx:":"Intento de doble gasto detectado. De la transacción:","Error!":"¡Error!","Fee":"Tasa","Final Balance":"Balance Final","Finish Date":"Fecha Final","Go to home":"Volver al Inicio","Hash Serialized":"Hash Serializado","Height":"Altura","Included in Block":"Incluido en el Bloque","Incoherence in levelDB detected:":"Detectada una incoherencia en levelDB:","Info Errors":"Errores de Información","Initial Block Chain Height":"Altura de la Cadena en Bloque Inicial","Input":"Entrada","Last Block":"Último Bloque","Last Block Hash (Bitcoind)":"Último Bloque Hash (Bitcoind)","Latest Blocks":"Últimos Bloques","Latest Transactions":"Últimas Transacciones","Loading Address Information":"Cargando Información de la Dirección","Loading Block Information":"Cargando Información del Bloque","Loading Selected Date...":"Cargando Fecha Seleccionada...","Loading Transaction Details":"Cargando Detalles de la Transacción","Loading Transactions...":"Cargando Transacciones...","Loading...":"Cargando...","Mined Time":"Hora de Minado","Mined by":"Minado por","Mining Difficulty":"Dificultad de Minado","Next Block":"Próximo Bloque","No Inputs (Newly Generated Coins)":"Sin Entradas (Monedas Recién Generadas)","No blocks yet.":"No hay bloques aún.","No matching records found!":"¡No se encontraron registros coincidentes!","No. Transactions":"Nro. de Transacciones","Number Of Transactions":"Número de Transacciones","Output":"Salida","Powered by":"Funciona con","Previous Block":"Bloque Anterior","Protocol version":"Versión del protocolo","Proxy setting":"Opción de proxy","Received Time":"Hora de Recibido","Redirecting...":"Redireccionando...","Search for block, address  and transactions":"Buscar bloques, transacciones o direcciones","See all blocks":"Ver todos los bloques","Show Transaction Output data":"Mostrar dato de Salida de la Transacción","Show all":"Mostrar todos","Show input":"Mostrar entrada","Show less":"Ver menos","Show more":"Ver más","Size":"Tamaño","Size (bytes)":"Tamaño (bytes)","Skipped Blocks (previously synced)":"Bloques Saltados (previamente sincronizado)","Start Date":"Fecha de Inicio","Status":"Estado","Summary":"Resumen","Summary <small>confirmed</small>":"Resumen <small>confirmados</small>","Sync Progress":"Proceso de Sincronización","Sync Status":"Estado de Sincronización","Sync Type":"Tipo de Sincronización","Synced Blocks":"Bloques Sincornizados","Testnet":"Red de prueba","There are no transactions involving this address.":"No hay transacciones para esta dirección","Time Offset":"Desplazamiento de hora","Timestamp":"Fecha y hora","Today":"Hoy","Total Amount":"Cantidad Total","Total Received":"Total Recibido","Total Sent":"Total Enviado","Transaction":"Transacción","Transaction Output Set Information":"Información del Conjunto de Salida de la Transacción","Transaction Outputs":"Salidas de la Transacción","Transactions":"Transacciones","Type":"Tipo","Unconfirmed":"Sin confirmar","Unconfirmed Transaction!":"¡Transacción sin confirmar!","Unconfirmed Txs Balance":"Balance sin confirmar","Value Out":"Valor de Salida","Version":"Versión","Waiting for blocks...":"Esperando bloques...","Waiting for transactions...":"Esperando transacciones...","by date.":"por fecha.","first seen at":"Visto a","mined":"minado","mined on:":"minado el:","Waiting for blocks":"Esperando bloques"});
    gettextCatalog.setStrings('ja', {"(Input unconfirmed)":"(入力は未検証です)","404 Page not found :(":"404 ページがみつかりません (´・ω・`)","<strong>insight</strong>  is an <a href=\"http://live.insight.is/\" target=\"_blank\">open-source Bitcoin blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by bitcoind RPC.  Check out the <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">source code</a>.":"<strong>insight</strong>は、bitcoind RPCの提供するものよりも詳細なブロックチェインへの問い合わせを必要とするウェブウォレットやその他のアプリを書くのに使える、完全なRESTおよびwebsocket APIを備えた<a href=\"http://live.insight.is/\" target=\"_blank\">オープンソースのビットコインブロックエクスプローラ</a>です。<a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">ソースコード</a>を確認","<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">github issue tracker</a>.":"<strong>insight</strong>は現在開発中です。<a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">githubのissueトラッカ</a>にてバグの報告や改善案の提案をお願いします。","About":"はじめに","Address":"アドレス","Age":"生成後経過時間","An error occured in the verification process.":"検証過程でエラーが発生しました。","An error occured:<br>{{error}}":"エラーが発生しました:<br>{{error}}","Application Status":"アプリケーションの状態","Best Block":"最良ブロック","Bitcoin comes with a way of signing arbitrary messages.":"Bitcoinには任意のメッセージを署名する昨日が備わっています。","Bitcoin node information":"Bitcoinノード情報","Block":"ブロック","Block Reward":"ブロック報酬","Blocks":"ブロック","Broadcast Raw Transaction":"生のトランザクションを配信","Bytes Serialized":"シリアライズ後の容量 (バイト)","Can't connect to bitcoind to get live updates from the p2p network. (Tried connecting to bitcoind at {{host}}:{{port}} and failed.)":"P2Pネットワークからライブ情報を取得するためにbitcoindへ接続することができませんでした。({{host}}:{{port}} への接続を試みましたが、失敗しました。)","Can't connect to insight server. Attempting to reconnect...":"insight サーバに接続できません。再接続しています...","Can't connect to internet. Please, check your connection.":"インターネットに接続できません。コネクションを確認してください。","Complete":"完了","Confirmations":"検証数","Conn":"接続数","Connections to other nodes":"他ノードへの接続","Current Blockchain Tip (insight)":"現在のブロックチェインのTip (insight)","Current Sync Status":"現在の同期状況","Details":"詳細","Difficulty":"難易度","Double spent attempt detected. From tx:":"二重支払い攻撃をこのトランザクションから検知しました：","Error message:":"エラーメッセージ:","Error!":"エラー！","Fee":"手数料","Final Balance":"最終残高","Finish Date":"終了日時","Go to home":"ホームへ","Hash Serialized":"シリアライズデータのハッシュ値","Height":"ブロック高","Included in Block":"取り込まれたブロック","Incoherence in levelDB detected:":"levelDBの破損を検知しました:","Info Errors":"エラー情報","Initial Block Chain Height":"起動時のブロック高","Input":"入力","Last Block":"直前のブロック","Last Block Hash (Bitcoind)":"直前のブロックのハッシュ値 (Bitcoind)","Latest Blocks":"最新のブロック","Latest Transactions":"最新のトランザクション","Loading Address Information":"アドレス情報を読み込んでいます","Loading Block Information":"ブロック情報を読み込んでいます","Loading Selected Date...":"選択されたデータを読み込んでいます...","Loading Transaction Details":"トランザクションの詳細を読み込んでいます","Loading Transactions...":"トランザクションを読み込んでいます...","Loading...":"ロード中...","Message":"メッセージ","Mined Time":"採掘時刻","Mined by":"採掘者","Mining Difficulty":"採掘難易度","Next Block":"次のブロック","No Inputs (Newly Generated Coins)":"入力なし (新しく生成されたコイン)","No blocks yet.":"ブロックはありません。","No matching records found!":"一致するレコードはありません！","No. Transactions":"トランザクション数","Number Of Transactions":"トランザクション数","Output":"出力","Powered by":"Powered by","Previous Block":"前のブロック","Protocol version":"プロトコルバージョン","Proxy setting":"プロキシ設定","Raw transaction data":"トランザクションの生データ","Raw transaction data must be a valid hexadecimal string.":"生のトランザクションデータは有効な16進数でなければいけません。","Received Time":"受信時刻","Redirecting...":"リダイレクトしています...","Search for block, address  and transactions":"ブロック、トランザクション、アドレスを検索","See all blocks":"すべてのブロックをみる","Send transaction":"トランザクションを送信","Show Transaction Output data":"トランザクションの出力データをみる","Show all":"すべて表示","Show input":"入力を表示","Show less":"隠す","Show more":"表示する","Signature":"署名","Size":"サイズ","Size (bytes)":"サイズ (バイト)","Skipped Blocks (previously synced)":"スキップされたブロック (同期済み)","Start Date":"開始日時","Status":"ステータス","Summary":"概要","Summary <small>confirmed</small>":"サマリ <small>検証済み</small>","Sync Progress":"同期の進捗状況","Sync Status":"同期ステータス","Sync Type":"同期タイプ","Synced Blocks":"同期されたブロック数","Testnet":"テストネット","The message failed to verify.":"メッセージの検証に失敗しました。","The message is verifiably from {{verification.address}}.":"メッセージは{{verification.address}}により検証されました。","There are no transactions involving this address.":"このアドレスに対するトランザクションはありません。","This form can be used to broadcast a raw transaction in hex format over\n        the Bitcoin network.":"このフォームでは、16進数フォーマットの生のトランザクションをBitcoinネットワーク上に配信することができます。","This form can be used to verify that a message comes from\n        a specific Bitcoin address.":"このフォームでは、メッセージが特定のBitcoinアドレスから来たかどうかを検証することができます。","Time Offset":"時間オフセット","Timestamp":"タイムスタンプ","Today":"今日","Total Amount":"Bitcoin総量","Total Received":"総入金額","Total Sent":"総送金額","Transaction":"トランザクション","Transaction Output Set Information":"トランザクションの出力セット情報","Transaction Outputs":"トランザクションの出力","Transaction succesfully broadcast.<br>Transaction id: {{txid}}":"トランザクションの配信に成功しました。<br>トランザクションID: {{txid}}","Transactions":"トランザクション","Type":"タイプ","Unconfirmed":"未検証","Unconfirmed Transaction!":"未検証のトランザクションです！","Unconfirmed Txs Balance":"未検証トランザクションの残高","Value Out":"出力値","Verify":"検証","Verify signed message":"署名済みメッセージを検証","Version":"バージョン","Waiting for blocks...":"ブロックを待っています...","Waiting for transactions...":"トランザクションを待っています...","by date.":"日毎。","first seen at":"最初に発見された日時","mined":"採掘された","mined on:":"採掘日時:","(Mainchain)":"(メインチェーン)","(Orphaned)":"(孤立したブロック)","Bits":"Bits","Block #{{block.height}}":"ブロック #{{block.height}}","BlockHash":"ブロックのハッシュ値","Blocks <br> mined on:":"ブロック <br> 採掘日","Coinbase":"コインベース","Hash":"ハッシュ値","LockTime":"ロック時間","Merkle Root":"Merkleルート","Nonce":"Nonce","Ooops!":"おぉっと！","Output is spent":"出力は使用済みです","Output is unspent":"出力は未使用です","Scan":"スキャン","Show/Hide items details":"アイテムの詳細を表示または隠す","Waiting for blocks":"ブロックを待っています","by date. {{detail}} {{before}}":"日時順 {{detail}} {{before}}","scriptSig":"scriptSig","{{tx.confirmations}} Confirmations":"{{tx.confirmations}} 検証","<span class=\"glyphicon glyphicon-warning-sign\"></span> (Orphaned)":"<span class=\"glyphicon glyphicon-warning-sign\"></span> (孤立したブロック)","<span class=\"glyphicon glyphicon-warning-sign\"></span> Incoherence in levelDB detected: {{vin.dbError}}":"<span class=\"glyphicon glyphicon-warning-sign\"></span> Incoherence in levelDB detected: {{vin.dbError}}","Waiting for blocks <span class=\"loader-gif\"></span>":"ブロックを待っています <span class=\"loader-gif\"></span>"});
/* jshint +W100 */
}]);