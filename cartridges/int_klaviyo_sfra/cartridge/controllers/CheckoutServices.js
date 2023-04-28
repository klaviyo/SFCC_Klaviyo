'use strict';

var server = require('server');
var startedCheckoutHelper = require('*/cartridge/scripts/klaviyo/checkoutHelpers').startedCheckoutHelper;



server.extend(module.superModule);


server.append('SubmitCustomer', function (req, res, next) {
    var templateVars = startedCheckoutHelper(false);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;
    next();
});

server.append('LoginCustomer', function (req, res, next) {
    var templateVars = startedCheckoutHelper(false);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});

server.append('SubmitPayment', function (req, res, next) {
    var templateVars = startedCheckoutHelper(false);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});

server.append('PlaceOrder', function (req, res, next) {
    var templateVars = startedCheckoutHelper(false);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


module.exports = server.exports();