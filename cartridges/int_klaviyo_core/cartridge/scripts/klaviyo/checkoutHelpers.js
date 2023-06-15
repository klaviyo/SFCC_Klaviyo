'use strict';

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var startedCheckoutData = require('*/cartridge/scripts/klaviyo/eventData/startedCheckout');


/**
     * KL EVENT TRACKING: helper for sending Started Checkout event
     * This helper function is called from multiple controllers that attempt to track the Started Checkout event.
     * It is anologous to other controllers that send event data to Klaviyo, with the exception that it sets
     *  and relies on the 'klaviyoCheckoutTracked' session variable to know if this Started Checkout event
     *  has already been sent.
     *
     * The beginCheckout parameter is passed as true if this is being called from the first view / step of checkout.
     *  Otherwise assume this is a continuation of checkout.
     *
     * Not that this event (as well as Order Confirmation) uses the email address associated with the order instead
     *  of exchangeID to associate the event with this user.
**/
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
            var exchangeID = klaviyoUtils.getKlaviyoExchangeID();// KL IDENTIFY
            var dataObj;
            var serviceCallResult;
            var currentBasket;
            var isKlDebugOn = request.httpParameterMap.kldebug.booleanValue;// KL CLIENT SIDE DEBUGGING
            currentBasket = BasketMgr.getCurrentBasket();

            if (customerEmail) {
                if (currentBasket && currentBasket.getProductLineItems().toArray().length) {
                    // KL EVENT TRACKING: assemble event data
                    dataObj = startedCheckoutData.getData(currentBasket);
                    // KL EVENT TRACKING: send event data to KL API via services.js > trackEvent(...)
                    serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.startedCheckout, customerEmail);
                    // KL CLIENT SIDE DEBUG:
                    if (isKlDebugOn) {
                        returnObj.klDebugData = klaviyoUtils.prepareDebugData(dataObj);
                        returnObj.serviceCallData = klaviyoUtils.prepareDebugData(serviceCallResult);
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

/**
     * KL EVENT TRACKING: helper function to determine if an email address is attached to the current basket.
     * returns email address if found.
     * returns false if no email attached to current basket
**/
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
