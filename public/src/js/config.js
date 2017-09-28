'use strict';

//Setting up route
angular.module('insight').config(function($routeProvider) {
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
});

//Setting HTML5 Location Mode
angular.module('insight')
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  })
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
  .run(function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, amMoment, Status, Global) {
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

  });
