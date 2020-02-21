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
var OrderMgr = require('../mocks/dw/order/OrderMgr');

global.empty = require('../mocks/empty');

global.dw = {
    order: {
        Order: {
            SHIPPING_STATUS_SHIPPED: true
        }
    }
};

describe('KlaviyoUtils.js script', function () {
    var klaviyoUtilsFile = proxyquire('../../KlaviyoUtils.js', { 'dw/system/Logger': Logger, 'dw/system/Site': Site, 'dw/util/StringUtils': StringUtils, 'dw/svc/LocalServiceRegistry': LocalServiceRegistry, 'dw/web/URLUtils': URLUtils, '~/cartridge/scripts/utils/klaviyo/EmailUtils': EmailUtils, 'dw/order/OrderMgr': OrderMgr });

    var payloadObj = {
        token      : 'XXxxXX',
        event      : 'Test Event',
        properties : {
            kltest: true
        },
        time                : Math.floor(Date.now() / 1000),
        customer_properties : {
            $email: 'kltest@klaviyo.com'
        }
    };
    describe('klaviyoTrackEvent function', function () {
        it('should return a 1 if track call succeeds', function () {
            var trackCallResult = klaviyoUtilsFile.klaviyoTrackEvent(payloadObj.customer_properties.$email, {}, 'Event Name');
            expect(trackCallResult).to.equal(1);
        });
    });
    describe('preparePayload function', function () {
        var payloadObjBase64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
        it('should return a base64 string of Klaviyo formatted data', function () {
            var preparedPayload = klaviyoUtilsFile.preparePayload(payloadObj.customer_properties.$email, payloadObj.properties, payloadObj.event);
            expect(preparedPayload).to.eql(payloadObjBase64);
        });
    });
    describe('prepareViewedProductEventData function', function () {
        it('should return viewed product event data with appropriate keys', function () {
            var viewedProductKeys = [
                'event',
                'viewedProductID',
                'viewedProductName',
                'viewedProductPage',
                'viewedProductPageURL',
                'viewedProductUPC',
                'viewedProductCategories',
                'viewedProductPrimaryCategory',
                'viewedProductImage',
                'viewedProductPrice'
            ];
            var viewedProductObj = klaviyoUtilsFile.prepareViewedProductEventData(1, ProductMgr.getProduct());
            expect(Object.keys(viewedProductObj)).to.eql(viewedProductKeys);
        });
    });
    describe('removeDuplicates function', function () {
        it('should return an array of unique values', function () {
            var removeDuplicates = klaviyoUtilsFile.removeDuplicates;
            var dupeArray = ['shoes', 'shoes', 'hats', 'hats', 'coats', 'coats'];
            expect(removeDuplicates(dupeArray)).to.eql(['shoes', 'hats', 'coats']);
        });
    });
    describe('sendMailForShipmentConfirmation function', function () {
        it('should return true if sendOrderEmail is successful', function () {
            var sendMailResult = klaviyoUtilsFile.sendMailForShipmentConfirmation(1);
            expect(sendMailResult).to.eq(true);
        });
    });
});
