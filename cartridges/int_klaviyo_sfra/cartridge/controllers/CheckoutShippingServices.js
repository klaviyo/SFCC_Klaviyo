'use strict';

var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var KLCheckoutHelpers = require('*/cartridge/scripts/klaviyo/checkoutHelpers');


server.append('SubmitShipping', function (req, res, next) {
    var customerEmail = KLCheckoutHelpers.getEmailFromBasket();
    var templateVars = KLCheckoutHelpers.startedCheckoutHelper(false, customerEmail);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


module.exports = server.exports();
