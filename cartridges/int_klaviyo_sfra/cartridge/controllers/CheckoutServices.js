'use strict';

var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var KLCheckoutHelpers = require('*/cartridge/scripts/klaviyo/checkoutHelpers');

/***
 * KL EVENT TRACKING: Started Checkout event
 * All methods below append to OOTB SFRA controller routes to attempt to track the Started Checkout event.
 * They rely on extracting the customer's email address from the current basket.  If it is not yet present,
 *  the event is not tracked.  Multiple routes have been appended to with this code as it is not possible
 *  to know when the email address is attached to the current basket due to site-specific customization of
 *  the checkout flow.
 *
 * If a given client / systems integrator is technically capable and knows exactly when their site attaches
 *  the email address to the basket, it would be safe to eliminate some of the route appends below.
 *  Careful debugging to ensure the correct append remains would certainly be required.
 *
 * Refer to the notes at the top of Checkout.js for more information on the Started Checkout event.
***/

server.append('SubmitCustomer', function (req, res, next) {
    var customerEmail = KLCheckoutHelpers.getEmailFromBasket();
    var templateVars = KLCheckoutHelpers.startedCheckoutHelper(false, customerEmail);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


server.append('LoginCustomer', function (req, res, next) {
    var customerEmail = KLCheckoutHelpers.getEmailFromBasket();
    var templateVars = KLCheckoutHelpers.startedCheckoutHelper(false, customerEmail);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


server.append('SubmitPayment', function (req, res, next) {
    var customerEmail = KLCheckoutHelpers.getEmailFromBasket();
    var templateVars = KLCheckoutHelpers.startedCheckoutHelper(false, customerEmail);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


server.append('PlaceOrder', function (req, res, next) {
    var customerEmail = KLCheckoutHelpers.getEmailFromBasket();
    var templateVars = KLCheckoutHelpers.startedCheckoutHelper(false, customerEmail);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


module.exports = server.exports();
