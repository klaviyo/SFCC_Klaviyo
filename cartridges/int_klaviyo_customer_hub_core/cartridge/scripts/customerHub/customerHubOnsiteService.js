'use strict';

var ServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * HTTP service for exchanging an authenticated storefront session for an onsite auth token.
 */
var KlaviyoCustomerHubOnsiteService = ServiceRegistry.createService('KlaviyoCustomerHubOnsiteService', {
    createRequest: function (svc, payload) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        return JSON.stringify(payload);
    },

    parseResponse: function (svc, client) {
        if (client.statusCode >= 400) {
            throw new Error(client.text || client.statusMessage || ('HTTP ' + client.statusCode));
        }
        return client.text;
    },

    getRequestLogMessage: function (request) {
        return request;
    },

    getResponseLogMessage: function (response) {
        try {
            return JSON.stringify({
                statusCode: response.statusCode,
                statusMessage: response.statusMessage,
                errorText: response.errorText,
                text: response.text
            });
        } catch (e) {
            return 'CustomerHubOnsiteService response log failed';
        }
    }
});

function exchangeSessionForCustomerHubOnsiteToken(payload) {
    var result = KlaviyoCustomerHubOnsiteService.call(payload);

    if (!result) {
        return { ok: false, sendFailed: true, errorText: 'service_call_returned_null' };
    }

    if (!result.ok) {
        var isUnavailable = result.status === 'SERVICE_UNAVAILABLE';
        return {
            ok: false,
            sendFailed: isUnavailable,
            statusCode: result.error || null,
            errorText: result.errorMessage || String(result.error)
        };
    }

    try {
        return { ok: true, data: JSON.parse(result.object) };
    } catch (error) {
        return { ok: false, errorText: 'invalid_json' };
    }
}

module.exports = {
    exchangeSessionForCustomerHubOnsiteToken: exchangeSessionForCustomerHubOnsiteToken
};
