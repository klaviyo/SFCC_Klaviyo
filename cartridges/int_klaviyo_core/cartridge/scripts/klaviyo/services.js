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

    getRequestLogMessage: function (request) {
        // underlying SFCC code (Java?) will translate "$1" in the request into a reference to the Request object and
        // "$2" into a reference to the Request's value, so we add a space between dollar sign and number
        // to not break logged data. note this does not alter the request data that is actually sent to Klaviyo.
        request = request.replace(/\$1/g, '$ 1').replace(/\$2/g, '$ 2');
        return request;
    },

    getResponseLogMessage: function (response) {
        try {
            var r = {
                statusCode: response.statusCode,
                statusMessage: response.statusMessage,
                errorText: response.errorText,
                text: response.text
            };
            return JSON.stringify(r);
        } catch(e) {
            var err = 'failure to generate full response log object in KlaviyoEventService.getResponseLogMessage()';
            if(response && response.statusCode) {
                err += ', statusCode: ' + response.statusCode;
            }
            return err;
        }
    }
});

module.exports = {
    KlaviyoEventService : KlaviyoEventService
}