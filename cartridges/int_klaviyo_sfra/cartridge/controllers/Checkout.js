'use strict';

var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var KLCheckoutHelpers = require('*/cartridge/scripts/klaviyo/checkoutHelpers');

/***
 * KL EVENT TRACKING: Started Checkout event, triggered via appending the OOTB Checkout-Begin controller
 * Utilizes startedCheckout.js > getData() via checkoutHelpers.js > startedCheckoutHelper(...) to
 *  assemble event data and utils.js > trackEvent(...) to transmit it to the KL API
 * Note that checkoutHelpers.js > getEmailFromBasket() is used to extract the order email from the current basket
 *  (if available).  Started Checkout events use customer email and not KL exchangeID for identifying the user.
 * Also note that no client side debugging is possible for this event as SFCC won't accept additional QS parameters
 *  in checkout controllers.  Instead rely on server side logs to debug Started Checkout events.
***/

server.append('Begin', function (req, res, next) {
    var customerEmail = KLCheckoutHelpers.getEmailFromBasket();
    var templateVars = KLCheckoutHelpers.startedCheckoutHelper(true, customerEmail);
    res.viewData.klid = templateVars.klid;
    res.viewData.klDebugData = templateVars.klDebugData;
    res.viewData.serviceCallData = templateVars.serviceCallData;

    next();
});


module.exports = server.exports();
