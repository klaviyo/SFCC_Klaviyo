'use strict';

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru();
var Logger = require('../mocks/dw/system/Logger');
var Site = require('../mocks/dw/system/Site');
var StringUtils = require('../mocks/dw/util/StringUtils');
var LocalServiceRegistry = require('../mocks/dw/svc/LocalServiceRegistry');
var URLUtils = require('../mocks/dw/web/URLUtils');
var ProductMgr = require('../mocks/dw/catalog/ProductMgr');
var EmailUtils = require('../mocks/EmailUtils');
var BasketMgr = require('../mocks/dw/order/BasketMgr')
var OrderMgr = require('../mocks/dw/order/OrderMgr');

global.empty = require('../mocks/empty');

global.dw = {
  order: {
    Order: {
      SHIPPING_STATUS_SHIPPED: true
    }
  }
};

describe('klaviyoUtils.js script', function() {
  var klaviyoUtilsFile = proxyquire('../../cartridges/int_klaviyo_core/cartridge/scripts/utils/klaviyo/klaviyoUtils.js', {
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    'dw/util/StringUtils': StringUtils,
    'dw/svc/LocalServiceRegistry': LocalServiceRegistry,
    'dw/web/URLUtils': URLUtils,
    '~/cartridge/scripts/utils/klaviyo/EmailUtils': EmailUtils,
    'dw/order/OrderMgr': OrderMgr,
    'dw/order/BasketMgr': BasketMgr,
    'dw/catalog/ProductMgr': ProductMgr
  });

  var payloadObj = {
    token: 'XXxxXX',
    event: 'Test Event',
    properties: {
      kltest: true
    },
    time : Math.floor(Date.now() / 1000),
    customer_properties: {
      $email: 'kltest@klaviyo.com'
    }
  };
  describe('sendEvent function', function() {
    it('should return a 1 if track call succeeds', function() {
      var trackCallResult = klaviyoUtilsFile.sendEvent(payloadObj.customer_properties.$email, {}, 'Event Name');
      expect(trackCallResult).to.equal(1);
    });
  });
  describe('prepareViewedProductEventData function', function() {
    it('should return viewed product event data with appropriate keys', function() {
      var viewedProductKeys = [
        'event',
        'viewedProductID',
        'viewedProductName',
        'viewedProductPage',
        'viewedProductImage',
        'viewedProductPrice',
        'viewedProductPageURL',
        'viewedProductUPC',
        'viewedProductCategories',
        'viewedProductPrimaryCategory'
      ];
      var viewedProductObj = klaviyoUtilsFile.prepareViewedProductEventData(1, ProductMgr.getProduct());
      expect(Object.keys(viewedProductObj)).to.eql(viewedProductKeys);
    });
  });
  describe('removeDuplicates function', function() {
    it('should return an array of unique values', function() {
      var removeDuplicates = klaviyoUtilsFile.removeDuplicates
      var dupeArray = ['shoes', 'shoes', 'hats', 'hats', 'coats', 'coats'];
      expect(removeDuplicates(dupeArray)).to.eql(['shoes', 'hats', 'coats']);
    });
  });
});
