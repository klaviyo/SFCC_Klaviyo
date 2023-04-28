'use strict';

var basketMgr = require('dw/order/BasketMgr');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var startedCheckoutData = require('*/cartridge/scripts/klaviyo/eventData/startedCheckout');

// beginCheckout set to true if this is being called from the first view / step of checkout.
// otherwise assume this is a continuation of checkout
function startedCheckoutHelper(beginCheckout) {

    var returnObj = {
        klid: false,
        klDebugData: false,
        serviceCallData: false
    }

    if(klaviyoUtils.klaviyoEnabled){

        if(beginCheckout) {
            session.privacy.klaviyoCheckoutTracked = false;
        }

        if(session.privacy.klaviyoCheckoutTracked == false) {

            var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
            var dataObj, serviceCallResult, currentBasket;
            var isKlDebugOn = request.httpParameterMap.kldebug.booleanValue;

            if (exchangeID) {
                currentBasket = basketMgr.getCurrentBasket()

                if (currentBasket && currentBasket.getProductLineItems().toArray().length) { //TODO: is there a property for isEmpty on basket object?
                    dataObj = startedCheckoutData.getData(currentBasket);
                    serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.startedCheckout);
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


module.exports = {
    startedCheckoutHelper: startedCheckoutHelper
};