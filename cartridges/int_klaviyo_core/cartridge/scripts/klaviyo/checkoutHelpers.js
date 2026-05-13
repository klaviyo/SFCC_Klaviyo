'use strict';

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var startedCheckoutData = require('*/cartridge/scripts/klaviyo/eventData/startedCheckout');


// beginCheckout set to true if this is being called from the first view / step of checkout.
// otherwise assume this is a continuation of checkout
// customerEmail only passed if this is called from Klaviyo-StartedCheckoutEvent
function startedCheckoutHelper(beginCheckout, customerEmail) {
    var returnObj = {
        klid            : false,
        klDebugData     : false,
        serviceCallData : false
    };

    if (klaviyoUtils.klaviyoEnabled) {
        if (beginCheckout) {
            session.privacy.klaviyoCheckoutTracked = false;
        }

        if (session.privacy.klaviyoCheckoutTracked == false) {
            var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
            var dataObj;
            var serviceCallResult;
            var currentBasket;
            var isKlDebugOn = request.httpParameterMap.kldebug.booleanValue;
            currentBasket = BasketMgr.getCurrentBasket();

            if (customerEmail) {
                if (currentBasket && currentBasket.getProductLineItems().toArray().length) {
                    // Defense-in-depth: trackEvent already swallows exceptions, but the
                    // checkout request path is critical -- wrap the full Klaviyo path
                    // (event-data construction, trackEvent, debug-data prep) so that
                    // any unexpected failure cannot break Checkout-Begin or
                    // CheckoutServices. See IES-228.
                    try {
                        dataObj = startedCheckoutData.getData(currentBasket);
                        serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.startedCheckout, customerEmail);
                        if (isKlDebugOn) {
                            returnObj.klDebugData = klaviyoUtils.prepareDebugData(dataObj);
                            returnObj.serviceCallData = klaviyoUtils.prepareDebugData(serviceCallResult);
                        }
                    } catch (e) {
                        Logger.getLogger('Klaviyo', 'Klaviyo.core checkoutHelpers.js - startedCheckoutHelper()')
                            .error('startedCheckoutHelper Klaviyo path threw an exception: ' + e.message);
                    }
                }

                session.privacy.klaviyoCheckoutTracked = true;
            } else {
                returnObj.klid = klaviyoUtils.getProfileInfo();
            }
        }
    }

    return returnObj;
}


function getEmailFromBasket() {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket && currentBasket.customerEmail) {
        return currentBasket.customerEmail;
    }

    return false;
}


module.exports = {
    startedCheckoutHelper : startedCheckoutHelper,
    getEmailFromBasket    : getEmailFromBasket
};
