'use strict';

var server = require('server');
var startedCheckoutHelper = require('*/cartridge/scripts/klaviyo/checkoutHelpers').startedCheckoutHelper;

server.extend(module.superModule);

server.append('SubmitShipping', function (req, res, next) {
    res.viewData.klid = startedCheckoutHelper(false);
    next();
});

module.exports = server.exports();