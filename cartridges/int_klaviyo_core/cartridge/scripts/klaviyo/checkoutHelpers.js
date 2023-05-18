'use strict';


/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var startedCheckoutData = require('*/cartridge/scripts/klaviyo/eventData/startedCheckout');

/* API Includes */
var basketMgr = require('dw/order/BasketMgr');


// beginCheckout set to true if this is being called from the first view / step of checkout.
// otherwise assume this is a continuation of checkout
// customerEmail only passed if this is called from Klaviyo-StartedCheckoutEvent
function startedCheckoutHelper(beginCheckout, customerEmail) {

    var returnObj = {
        klid: false,
        klDebugData: false,
        serviceCallData: false
    }

    if(klaviyoUtils.klaviyoEnabled){

        if(beginCheckout) {
            session.privacy.klaviyoCheckoutTracked = false;
        }

        var klaviyoCheckoutTracked = session.privacy.klaviyoCheckoutTracked;

        if(session.privacy.klaviyoCheckoutTracked == false) {

            var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
            var dataObj, serviceCallResult, currentBasket;
            var isKlDebugOn = request.httpParameterMap.kldebug.booleanValue;

            currentBasket = basketMgr.getCurrentBasket();

            if ( customerEmail ) {

                if (currentBasket && currentBasket.getProductLineItems().toArray().length) { //TODO: is there a property for isEmpty on basket object?
                    dataObj = startedCheckoutData.getData(currentBasket);
                    serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.startedCheckout, customerEmail);
                    if (isKlDebugOn) {
                        returnObj.klDebugData = klaviyoUtils.prepareDebugData(dataObj);
                        returnObj.serviceCallData = klaviyoUtils.prepareDebugData(serviceCallResult);
                    }
                }

                session.privacy.klaviyoCheckoutTracked = true;

            } else {
                // TODO: return this value so it can be added to pdict in sitegen template call, and add return false at the bottom of this function
                returnObj.klid = klaviyoUtils.getProfileInfo();
            }

        }

    }

    return returnObj;
};


function getEmailFromBasket() {
    var currentBasket = basketMgr.getCurrentBasket();
    if(currentBasket && currentBasket.customerEmail) {
        return currentBasket.customerEmail;
    }
    // if(currentBasket && currentBasket.customer && currentBasket.customer.profile && currentBasket.customer.profile.email) {
    //     return currentBasket.customer.profile.email;
    // }
    return false;
}


module.exports = {
    startedCheckoutHelper: startedCheckoutHelper,
    getEmailFromBasket: getEmailFromBasket
};
