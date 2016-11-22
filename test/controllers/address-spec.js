describe('addressController', function() {
  var $rootScope;
  var $scope;
  var $controller;
  var $q;
  var addressController;
  var NotifyService;
  var EnterpriseAPI;

  beforeEach(function() {
    // Include modules to intantiate the controller
    module('insight.system');
    module('insight.socket');
    module('ngResource');
    module(function($provide) {
      $provide.service('$routeParams', function() { return {}; });
    });
    module('insight.address');

    inject(function(_$q_, _$injector_, _$rootScope_, _$controller_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      // Manually pass in the scope and rootscope while instantiating controller
      addressController = $controller('AddressController', {
        '$rootScope': $rootScope,
        '$scope': $scope
      });
      // Trigger the digest cycle in the test browser
      $scope.$digest();
    });
  });

  it('should be instantiated', function() {
    expect(addressController).toBeDefined();
  });

  // TODO: More testing on functions of the controller

});
