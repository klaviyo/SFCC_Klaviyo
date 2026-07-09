'use strict';

var guard = require('*/cartridge/scripts/guard');
var responseUtils = require('*/cartridge/scripts/util/Response');
var customerHubAuth = require('*/cartridge/scripts/customerHub/auth');

/**
 * Customer hub storefront auth endpoint.
 */
function Auth() {
    var result = customerHubAuth.authenticate();
    responseUtils.renderJSON(result);
}

exports.Auth = guard.ensure(['get'], Auth);
