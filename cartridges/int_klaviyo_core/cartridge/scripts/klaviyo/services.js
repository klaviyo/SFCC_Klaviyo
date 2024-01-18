'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');


// HTTP Services
var KlaviyoEventService = ServiceRegistry.createService('KlaviyoEventService', {

    /**
   * Create the service request
   * - Set request method to be the HTTP POST method
   * - Construct request URL
   * - Append the request HTTP query string as a URL parameter
   *
   * @param {dw.svc.HTTPService} svc - HTTP Service instance
   * @param {Object} args - Additional paramaters
   * @returns {String} - A JSON string of the args
   */
    createRequest: function (svc, args) {
        var key = Site.getCurrent().getCustomPreferenceValue('klaviyo_api_key');
        if (!key || key == '') {
            var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core:  services.js  -  createRequest()');
            logger.error(`KlaviyoEventService failed because of a missing Klaviyo Private API key. Review key & configs for inconsistencies. Klaviyo API Key: ${key}`);
            return;
        }

        svc.setRequestMethod('POST');
        svc.addHeader('Authorization', 'Klaviyo-API-Key ' + key);
        svc.addHeader('Content-type', 'application/json');
        svc.addHeader('Accept', 'application/json');
        svc.addHeader('revision', '2023-02-22');
        // TODO: dynamically pull extension version
        svc.addHeader('X-Klaviyo-User-Agent', 'sfcc-klaviyo/24.1.0');

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
        // "$2" into a reference to the Request's value. As a result, we add a space between dollar sign and number
        // to avoid breaking logged data. Note: this does not alter the request data that is actually sent to Klaviyo.
        request = request.replace(/\$1/g, '$ 1').replace(/\$2/g, '$ 2');
        return request;
    },

    getResponseLogMessage: function (response) {
        try {
            var r = {
                statusCode    : response.statusCode,
                statusMessage : response.statusMessage,
                errorText     : response.errorText,
                text          : response.text
            };

            return JSON.stringify(r);
        } catch (e) {
            var err = 'failure to generate full response log object in KlaviyoEventService.getResponseLogMessage()';
            if (response && response.statusCode) {
                err += ', statusCode: ' + response.statusCode;
            }

            return err;
        }
    }
});


var KlaviyoSubscribeProfilesService = ServiceRegistry.createService('KlaviyoSubscribeProfilesService', {

    /**
   * Create the service request
   * - Set request method to be the HTTP POST method
   * - Construct request URL
   * - Append the request HTTP query string as a URL parameter
   *
   * @param {dw.svc.HTTPService} svc - HTTP Service instance
   * @param {Object} args - Additional paramaters
   * @returns {String} - A JSON string of the args
   */
    createRequest: function (svc, args) {
        var key = Site.getCurrent().getCustomPreferenceValue('klaviyo_api_key');
        if (!key || key == '') {
            var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core:  services.js  -  createRequest()');
            logger.error(`KlaviyoSubscribeProfilesService failed because of a missing Klaviyo Private API key. Review key & configs for inconsistencies. Klaviyo API Key: ${key}`);
            return;
        }

        svc.setRequestMethod('POST');
        svc.addHeader('Authorization', 'Klaviyo-API-Key ' + key);
        svc.addHeader('Content-type', 'application/json');
        svc.addHeader('Accept', 'application/json');
        svc.addHeader('revision', '2023-02-22');
        // TODO: dynamically pull extension version
        svc.addHeader('X-Klaviyo-User-Agent', 'sfcc-klaviyo/24.1.0');

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
        return request;
    },

    getResponseLogMessage: function (response) {
        try {
            var r = {
                statusCode    : response.statusCode,
                statusMessage : response.statusMessage,
                errorText     : response.errorText,
                text          : response.text
            };

            return JSON.stringify(r);
        } catch (e) {
            var err = 'failure to generate full response log object in KlaviyoEventService.getResponseLogMessage()';
            if (response && response.statusCode) {
                err += ', statusCode: ' + response.statusCode;
            }

            return err;
        }
    }
});


module.exports = {
    KlaviyoEventService             : KlaviyoEventService,
    KlaviyoSubscribeProfilesService : KlaviyoSubscribeProfilesService
};
