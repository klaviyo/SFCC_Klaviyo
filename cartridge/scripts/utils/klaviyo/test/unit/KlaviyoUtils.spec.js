'use strict';

var expect = require('chai').expect;

var klaviyoUtilsFile = require('../../KlaviyoUtils.js');

describe('KlaviyoUtils.js script', function() {
  var payloadObj = {
    event: 'Test Event',
    properties: {
      kltest: true
    },
    customer_properties: {
      $email: 'kltest@gmail.com'
    }
  };
  describe('preparePayload', function() {
    var payloadObjBase64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    it('should return a base64 string of Klaviyo formatted data', function () {
      var preparedPayload = klaviyoUtilsFile.preparePayload(payloadObj.customer_properties.$email, payloadObj.properties, payloadObj.event);
      expect(preparedPayload).to.equal(payloadObjBase64);
    });
  });
  describe('prepareViewedProductEventData', function() {
    it('should have an "event" key with "Viewed Product" as the value', function() {
      var viewedProductEvent = klaviyoUtilsFile.prepareViewedProductEventData()
      expect(viewedProductEvent.event).to.equal('Viewed Product')
    });
  });
  describe('removeDuplicates', function() {
    it('should return an array of unique values', function() {
      var dupeArray = [1, 1, true, true, 'hi', 'hi'];
      var uniqueValues = {};
      var removeDuplicates = klaviyoUtilsFile.removeDuplicates
      for (var i = 0; i < dupeArray.length; i++) {
        uniqueValues[dupeArray[i]] = true;
      }
      expect(removeDuplicates(dupeArray).length).to.equal(Object.keys(uniqueValues).length);
    });
  });
});
