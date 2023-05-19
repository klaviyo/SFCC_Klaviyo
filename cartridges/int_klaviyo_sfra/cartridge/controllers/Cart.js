'use strict';

var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var addedToCartData = require('*/cartridge/scripts/klaviyo/eventData/addedToCart');

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');


server.append('Show', function (req, res, next) {
    if(klaviyoUtils.klaviyoEnabled && !klaviyoUtils.getKlaviyoExchangeID()){
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }

    next();
});

server.append('AddProduct', function (req, res, next) {

    if(klaviyoUtils.klaviyoEnabled){

        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, currentBasket;
        var isKlDebugOn = request.getHttpReferer().includes('kldebug=true') ? true : false;

        if (exchangeID) {
            currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket && currentBasket.getProductLineItems().toArray().length) {
                dataObj = addedToCartData.getData(currentBasket);
                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.addedToCart, false);
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
