'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');


/***
 * KL EVENT TRACKING - HTTP Services
 * Service connection is handled via the KlaviyoEventService, configured in Business Manager at Administration >  Operations >  Services
 * Initial setup of the service is handled via importing the provided metadata.xml file.
 * Authentication is handled via the client-specific Klaviyo Private API Key Site Preference (ID: klaviyo_api_key)
 *  at Merchant Tools > Site Preferences > Custom Site Preference Groups > Klaviyo
 *
 * KL SERVER SIDE LOGGING: In order to enabled verbose logging of all calls to the KL API, check the "Communication Log Enabled" box in the
 *  KlaviyoEventService config in BM.  The returned values for the methods below are directly tied to what is outputted to the logs for each
 *  step of a given service call.  Logs will be written to the "service-KlaviyoEventService..." log file (Administration > Site Development > Development Setup > Logs)
***/



var KlaviyoEventService = ServiceRegistry.createService('KlaviyoEventService', {

/**
   * Create the service request
   * - Set request method to be the HTTP GET method
   * - Construct request URL
   *
   * @param {dw.svc.HTTPService} svc - HTTP Service instance
   * @param {Object} params - Additional paramaters
   * @returns {void}
   */
    createRequest: function (svc, args) {

        var key = Site.getCurrent().getCustomPreferenceValue('klaviyo_api_key');
        if(!key || key == '') {
            var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core:  services.js  -  createRequest()');
            logger.error(`KlaviyoEventService failed because of a missing Klaviyo Private API key. Review key & configs for inconsistencies. Klaviyo API Key: ${key}`);
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
        // Underlying SFCC code (Java) will translate "$1" in the request into a reference to the Request object and
        // "$2" into a reference to the Request's value. As a result, we add a space between dollar sign and number.
        // To avoid breaking logged price data. Note: this does not alter the request data that is actually sent to Klaviyo, only
        // what is written to the log files.
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
};
