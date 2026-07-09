'use strict';

var URLUtils = require('dw/web/URLUtils');
var sessionAuth = require('*/cartridge/scripts/customerHub/sessionAuth');

function getStorefrontRoutes() {
    return {
        login: URLUtils.url('Login-Show').toString(),
        register: URLUtils.url('Login-Show').toString(),
        logout: URLUtils.url('Login-Logout').toString(),
        profile: URLUtils.url('Account-Show').toString(),
        addresses: URLUtils.url('Address-List').toString()
    };
}

function authenticate(req) {
    return sessionAuth.authenticate({
        getStorefrontRoutes: getStorefrontRoutes,
        getOnsiteClientId: function () {
            return req.querystring.onsite_client_id || null;
        }
    });
}

module.exports = {
    authenticate: authenticate
};
