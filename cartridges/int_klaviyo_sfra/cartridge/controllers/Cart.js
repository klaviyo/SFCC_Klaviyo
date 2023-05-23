'use strict';

var server = require('server');
server.extend(module.superModule);

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var addedToCartData = require('*/cartridge/scripts/klaviyo/eventData/addedToCart');

// KL IDENTIFY: if we don't have a KL exchange ID, check to see if we have a logged in SFCC user/profile and ID off of that.
server.append('Show', function (req, res, next) {
    if(klaviyoUtils.klaviyoEnabled && !klaviyoUtils.getKlaviyoExchangeID()){
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }

    next();
});

/***
 * KL EVENT TRACKING: Added to Cart event, triggered via appending the OOTB Cart-AddProduct controller
 * Utilizes addedToCart.js > getData() to assemble event data and
 *  utils.js > trackEvent(...) to transmit it to the KL API
 ***/
server.append('AddProduct', function (req, res, next) {

    if(klaviyoUtils.klaviyoEnabled){

        // KL IDENTIFY: try to get the exchangeID from the KL cookie
        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, currentBasket;
        // KL CLIENT SIDE DEBUGGING: if kldebug=true is in the querystring output event & service data to the JS console.
        var isKlDebugOn = request.getHttpReferer().includes('kldebug=true') ? true : false;

        if (exchangeID) {
            currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket && currentBasket.getProductLineItems().toArray().length) {
                // KL EVENT TRACKING: assemble event data
                dataObj = addedToCartData.getData(currentBasket);
                // KL EVENT TRACKING: send event data to KL API via services.js > trackEvent(...)
                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.addedToCart, false);
                // KL CLIENT SIDE DEBUG:
                if (isKlDebugOn) {
                    res.json({
                        klDebugData : klaviyoUtils.prepareDebugData(dataObj),
                        serviceCallData : klaviyoUtils.prepareDebugData(serviceCallResult)
                    });
                }
            }
        }
    }

    next();
});


module.exports = server.exports();
