'use strict';

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

