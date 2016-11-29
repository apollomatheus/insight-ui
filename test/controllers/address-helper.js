(function(global) {

  var mockAddressData = {
    "addrStr":"1ERSHV5douNTHuCnJj7uSJDtPvEKX2NZvZ",
    "balance":117.31868634,
    "balanceSat":11731868634,
    "totalReceived":2032.40466576,
    "totalReceivedSat":203240466576,
    "totalSent":1915.08597942,
    "totalSentSat":191508597942,
    "unconfirmedBalance":0,
    "unconfirmedBalanceSat":0,
    "unconfirmedTxApperances":0,
    "txApperances":239
  }
  // Mocks for spec Address calls
  global.addressAPI = {
    getAddress: {
      success: {
        status: 200,
        data: mockAddressData
      },
      invalidFail: {
        status: 400,
        data: "email not verified"
      },
      backendFail: {
        status: 503,
        data: "Some backend failure"
      },
      randomFail: {
        status: 500,
        data: "Not sure why this failed"
      }
    }
  };
})(window);