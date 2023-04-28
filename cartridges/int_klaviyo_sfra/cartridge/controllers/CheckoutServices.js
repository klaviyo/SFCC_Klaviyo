'use strict';

var server = require('server');
var startedCheckoutHelper = require('*/cartridge/scripts/klaviyo/checkoutHelpers').startedCheckoutHelper;



server.extend(module.superModule);


server.append('SubmitCustomer', function (req, res, next) {
    res.viewData.klid = startedCheckoutHelper(false);
    next();
});

server.append('LoginCustomer', function (req, res, next) {
    res.viewData.klid = startedCheckoutHelper(false);
    next();
});

server.append('SubmitPayment', function (req, res, next) {
    res.viewData.klid = startedCheckoutHelper(false);
    next();
});

server.append('PlaceOrder', function (req, res, next) {
    res.viewData.klid = startedCheckoutHelper(false);
    next();
});


module.exports = server.exports();