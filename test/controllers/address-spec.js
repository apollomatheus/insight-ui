describe('addressController', function() {
  var $rootScope;
  var $scope;
  var $controller;
  var $q;
  var addressController;
  var NotifyService;
  var EnterpriseAPI;
  var $httpBackend;
  var socket;
  // TODO: Barath - This variable gets set inline in index.html. We need to move it out so that it can be loaded in tests and avoid future CSP issues
  window.apiPrefix = "/api";

  beforeEach(function() {
    // Include modules to intantiate the controller
    module('insight.system');
    module('insight.socket');
    module('insight.notify');
    module('ngResource');
    module(function($provide) {
      $provide.service('$routeParams', function() { return {"addrStr":"1ERSHV5douNTHuCnJj7uSJDtPvEKX2NZvZ"}; });
    });
    module('insight.address');

    inject(function(_$q_, _$injector_, _$rootScope_, _$controller_, _$httpBackend_, _getSocket_,_NotifyService_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      $httpBackend = _$httpBackend_;
      NotifyService = _NotifyService_;
      // Manually pass in the scope and rootscope while instantiating controller
      addressController = $controller('AddressController', {
        '$rootScope': $rootScope,
        '$scope': $scope
      });
      // Trigger the digest cycle in the test browser
      $scope.$digest();
      socket = _getSocket_($scope);

      spyOn(NotifyService, 'error');
    });
  });

  it('should be instantiated along with expected variables on scope', function() {
    expect(addressController).toBeDefined();
    expect($scope.params).toBeDefined();
    expect($scope.findOne).toBeDefined();
  });

  it('Fine one address success case', function() {
    $httpBackend.whenGET(window.apiPrefix + '/addr/1ERSHV5douNTHuCnJj7uSJDtPvEKX2NZvZ/?noTxList=1').respond(addressAPI.getAddress.success.status, addressAPI.getAddress.success.data);
    $scope.findOne();
    $httpBackend.flush();
    expect($rootScope.titleDetail).toEqual("1ERSHV5...");
    expect($scope.address).toEqual(addressAPI.getAddress.success.data);
  });

  it('Fine one address invalid address failure case', function() {
    $httpBackend.whenGET(window.apiPrefix + '/addr/1ERSHV5douNTHuCnJj7uSJDtPvEKX2NZvZ/?noTxList=1').respond(addressAPI.getAddress.invalidFail.status, addressAPI.getAddress.invalidFail.data);
    $scope.findOne();
    $httpBackend.flush();

    expect(NotifyService.error).toHaveBeenCalledWith("Invalid Address: 1ERSHV5douNTHuCnJj7uSJDtPvEKX2NZvZ");
  });

  it('Fine one address backend failure case', function() {
    $httpBackend.whenGET(window.apiPrefix + '/addr/1ERSHV5douNTHuCnJj7uSJDtPvEKX2NZvZ/?noTxList=1').respond(addressAPI.getAddress.backendFail.status, addressAPI.getAddress.backendFail.data);
    $scope.findOne();
    $httpBackend.flush();
    expect(NotifyService.error).toHaveBeenCalledWith('Backend Error. Some backend failure');
  });

  it('Fine one address random failure case', function() {
    $httpBackend.whenGET(window.apiPrefix + '/addr/1ERSHV5douNTHuCnJj7uSJDtPvEKX2NZvZ/?noTxList=1').respond(addressAPI.getAddress.randomFail.status, addressAPI.getAddress.randomFail.data);
    $scope.findOne();
    $httpBackend.flush();
    expect(NotifyService.error).toHaveBeenCalledWith('Address Not Found');
  });

  // TODO: Barath - figure out socket.io testing

});
