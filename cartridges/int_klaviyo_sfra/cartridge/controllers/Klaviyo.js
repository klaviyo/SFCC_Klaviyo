'use strict';

var server = require('server');

/* API Includes */
var StringUtils = require('dw/util/StringUtils');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var viewedProductData = require('*/cartridge/scripts/klaviyo/eventData/viewedProduct');
var viewedCategoryData = require('*/cartridge/scripts/klaviyo/eventData/viewedCategory');
var searchedSiteData = require('*/cartridge/scripts/klaviyo/eventData/searchedSite');
var KLCheckoutHelpers = require('*/cartridge/scripts/klaviyo/checkoutHelpers');


/**
     *
     * KL EVENT TRACKING:
     * The Klaviyo-Event route exists to support event tracking on pages whose OOTB SFCC controllers are cached by default.
     * To avoid caching event data, the Klaviyo-Event route is called via remote include in klaviyoFooter.isml.
     * For event tracking on pages whose controllers are not cached OOTB, server.appends to those OOTB controllers are utilized.
     * Reference Cart.js, Checkout.js, Order.js, etc in the int_klaviyo_sfra cartridge
     *
     * KL IDENTIFY:
     * Klaviyo-Event uses a combination of checking for the kx parameter and klaviyoUtils.getKlaviyoExchangeID() to determine if we currently have
     * a Klaviyo Identity ($exchange_id) to use for event tracking.
     *
     * If we do not have an exchange_id, no event data will be tracked. The code will, however, go on to check to see if we have a logged in
     * customer (SFCC profile) via klaviyoUtils.getProfileInfo(). When a customer is logged-in, the code sets profile data in the pdict (BASE64 encoded JSON string) so
     * client-side JS can use profile data to identify the user to Klaviyo for all subsequent page views.  At time of creation, no server-side method is available to
     * identify the user via the KL APIs and get back a usable exchange_id - whih is why we are limited to client-side identification approaches.
     *
     * Note: this route gets called via remote include for Home-Show, Page-Show and Default-Start only to check for identifying users to Klaviyo off the user's SFCC Profile.
     *
     * KL CLIENT-SIDE DEBUGGING:
     * If kldebug is passed as true, Klaviyo-Event will write the event data and service call results to viewData properties (pdict variables) so
     * client-side JS in klaviyoDebug.isml can write them out the JS console for debugging.
     *
**/
server.get('Event', function (req, res, next) {
    if (klaviyoUtils.klaviyoEnabled) {
        var dataObj;
        var serviceCallResult;
        var action;
        var parms;
        var kx = request.httpParameterMap.kx; // KL IDENTIFY
        var isKlDebugOn = request.httpParameterMap.kldebug.booleanValue; // KL CLIENT-SIDE DEBUGGING
        var exchangeID = (!kx.empty) ? kx.stringValue : klaviyoUtils.getKlaviyoExchangeID(); // KL IDENTIFY

        if (exchangeID) { // we have a klaviyo ID, proceed to track events
            // KL EVENT TRACKING:
            action = request.httpParameterMap.action.stringValue;
            parms = request.httpParameterMap.parms.stringValue;

            if (action != 'false') { // string test intentional, action passed as 'false' for pages that do not need to trigger events (Home, Page, Default)
                switch (action) {
                case klaviyoUtils.EVENT_NAMES.viewedProduct :
                    // KL EVENT TRACKING: Viewed Product event
                    dataObj = viewedProductData.getData(parms); // parms: product ID
                    break;
                case klaviyoUtils.EVENT_NAMES.viewedCategory :
                    // KL EVENT TRACKING: Viewed Category event
                    dataObj = viewedCategoryData.getData(parms); // parms: category ID
                    break;
                case klaviyoUtils.EVENT_NAMES.searchedSite :
                    // KL EVENT TRACKING: Searched Site event
                    parms = parms.split('|');
                    dataObj = searchedSiteData.getData(parms[0], parms[1]); // parms: search phrase, result count
                    break;
                }
                // KL EVENT TRACKING: fire service call to KL Track Event API
                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, action, false);
                // KL CLIENT-SIDE DEBUGGING:
                if (isKlDebugOn) {
                    res.viewData.klDebugData = klaviyoUtils.prepareDebugData(dataObj);
                    res.viewData.serviceCallData = klaviyoUtils.prepareDebugData(serviceCallResult);
                    res.render('klaviyo/klaviyoDebug');
                    next();
                    return;
                }
            }
        } else {
            // KL IDENTIFY: no klaviyo ID, check for SFCC profile and ID off that if extant
            res.viewData.klid = klaviyoUtils.getProfileInfo();
        }
    }

    // We don't need to render anything here, but SFRA requires a .render to be called
    res.render('klaviyo/klaviyoEmpty');
    next();
});


/**
     *
     * KL EVENT TRACKING:
     * receives AJAX call from email field indicated by custom Site Preference "klaviyo_checkout_email_selector"
     * triggers Started Checkout event via KLCheckoutHelpers.startedCheckoutHelper()
     *
**/
server.post('StartedCheckoutEvent', server.middleware.https, function (req, res, next) {
    var email = StringUtils.decodeBase64(req.httpParameterMap.a);
    KLCheckoutHelpers.startedCheckoutHelper(true, email);

    res.json({ success: true });

    next();
    return;
});


module.exports = server.exports();
