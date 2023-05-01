'use strict';

var server = require('server');
var startedCheckoutHelper = require('*/cartridge/scripts/klaviyo/checkoutHelpers').startedCheckoutHelper;


server.extend(module.superModule);

server.append('Begin', function (req, res, next) {
    var templateVars = startedCheckoutHelper(true);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


module.exports = server.exports();