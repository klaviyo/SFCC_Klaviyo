'use strict';

var Site = require('dw/system/Site');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');

// HTTP Services

var KlaviyoEventService = ServiceRegistry.createService('KlaviyoEventService', {
    /**
   * Create the service request
   * - Set request method to be the HTTP GET method
   * - Construct request URL
   * - Append the request HTTP query string as a URL parameter
   *
   * @param {dw.svc.HTTPService} svc - HTTP Service instance
   * @param {Object} params - Additional paramaters
   * @returns {void}
   */
    createRequest: function (svc, args) {
        // TODO: remove this if its not going to get used
        //var password = svc.configuration.credential.password;

        var key = Site.getCurrent().getCustomPreferenceValue('klaviyo_api_key');
        if(!key || key == '') {
            // TODO: log error - missing Klaviyo Private API Key
            // also test to see what happens to the calling code when this immediately returns / no key set
            return;
        }

        svc.setRequestMethod('POST');
        svc.addHeader('Authorization', 'Klaviyo-API-Key '+key);
        svc.addHeader('Content-type', 'application/json');
        svc.addHeader('Accept', 'application/json');
        svc.addHeader('revision', '2023-02-22');

        return JSON.stringify(args);
    },
    /**
   * JSON parse the response text and return it in configured retData object
   *
   * @param {dw.svc.HTTPService} svc - HTTP Service instance
   * @param {dw.net.HTTPClient} client - HTTPClient class instance of the current service
   * @returns {Object} retData - Service response object
   */
    parseResponse: function (svc, client) {
        return client.text;
    },

    getRequestLogMessage: function () {
        var reqLogMsg = 'sending klaviyo track payload';
        return reqLogMsg;
    },

    getResponseLogMessage: function () {}
});

module.exports = {
    KlaviyoEventService : KlaviyoEventService
}