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
     * NOTE: The Klaviyo-Event route exists to support event tracking on pages whose OOTB SFCC controllers are cached by default.
     * To avoid caching event data, the Klaviyo-Event route is called via remote include in klaviyoFooter.isml.
     * For event tracking on pages whose controllers are not cached OOTB, server.appends to those OOTB controllers should be utilized.
     * Reference Cart.js, Checkout.js, Order.js in the int_klaviyo_sfra cartridge
     *
     * Also note that this route gets called via remote include for Home-Show, Page-Show and Default-Start only to check for identifying users to Klaviyo off the user's SFCC Profile.
**/
server.get('Event', function (req, res, next) {
    if (klaviyoUtils.klaviyoEnabled) {
        var dataObj;
        var serviceCallResult;
        var action;
        var parms;
        var kx = request.httpParameterMap.kx;
        var isKlDebugOn = request.httpParameterMap.kldebug.booleanValue;
        var exchangeID = (!kx.empty) ? kx.stringValue : klaviyoUtils.getKlaviyoExchangeID();

        if (exchangeID) { // we have a klaviyo ID, proceed to track events
            action = request.httpParameterMap.action.stringValue;
            parms = request.httpParameterMap.parms.stringValue;

            if (action != 'false') { // string test intentional, action passed as 'false' for pages that do not need to trigger events (Home, Page, Default)
                switch (action) {
                case klaviyoUtils.EVENT_NAMES.viewedProduct :
                    dataObj = viewedProductData.getData(parms); // parms: product ID
                    break;
                case klaviyoUtils.EVENT_NAMES.viewedCategory :
                    dataObj = viewedCategoryData.getData(parms); // parms: category ID
                    break;
                case klaviyoUtils.EVENT_NAMES.searchedSite :
                    parms = parms.split('|');
                    dataObj = searchedSiteData.getData(parms[0], parms[1]); // parms: search phrase, result count
                    break;
                default:
                }
                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, action, false);
                if (isKlDebugOn) {
                    res.viewData.klDebugData = klaviyoUtils.prepareDebugData(dataObj);
                    res.viewData.serviceCallData = klaviyoUtils.prepareDebugData(serviceCallResult);
                    res.render('klaviyo/klaviyoDebug');
                    next();
                    return;
                }
            }
        } else {
            // no klaviyo ID, check for SFCC profile and ID off that if extant
            res.viewData.klid = klaviyoUtils.getProfileInfo();
        }
    }

    res.render('klaviyo/klaviyoEmpty'); // we don't need to render anything here, but SFRA requires a .render to be called
    next();
});


/* receives AJAX call from email field indicated by custom Site Preference "klaviyo_checkout_email_selector" */
server.post('StartedCheckoutEvent', server.middleware.https, function (req, res, next) {
    var email = StringUtils.decodeBase64(req.httpParameterMap.a);
    KLCheckoutHelpers.startedCheckoutHelper(true, email);

    res.json({ success: true });

    next();
    return;
});

/* called via ajax when the email or sms subscribe checkboxes are clicked.  KLSubscribe session vars picked up in Klaviyo-appended Order-Confirm controller */
server.post('Subscribe', server.middleware.https, function (req, res, next) {
    var email = req.httpParameterMap.e;
    var sms = req.httpParameterMap.s;

    if (!('KLEmailSubscribe' in session.custom)) {
        session.custom.KLEmailSubscribe = false;
    }
    if (!('KLSmsSubscribe' in session.custom)) {
        session.custom.KLSmsSubscribe = false;
    }
    if (!email.empty) {
        session.custom.KLEmailSubscribe = email.booleanValue;
    }
    if (!sms.empty) {
        session.custom.KLSmsSubscribe = sms.booleanValue;
    }

    res.json({ success: true });

    next();
    return;
});


module.exports = server.exports();
