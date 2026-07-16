'use strict';

var server = require('server');
var customerHubAuth = require('*/cartridge/scripts/customerHub/auth');

/**
 * Customer hub storefront auth endpoint.
 */
server.get('Auth', server.middleware.https, function (req, res, next) {
    var result = customerHubAuth.authenticate(req);
    res.json(result);
    next();
});

module.exports = server.exports();
