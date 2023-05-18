'use strict';

var server = require('server');
var KLCheckoutHelpers = require('*/cartridge/scripts/klaviyo/checkoutHelpers');

server.extend(module.superModule);


server.append('Begin', function (req, res, next) {
    var customerEmail = KLCheckoutHelpers.getEmailFromBasket();
    var templateVars = KLCheckoutHelpers.startedCheckoutHelper(true, customerEmail);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


module.exports = server.exports();
