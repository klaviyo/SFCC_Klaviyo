'use strict';

var server = require('server');
var basketMgr = require('dw/order/BasketMgr');
var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');

server.extend(module.superModule);


server.append('AddProduct', function (req, res, next) {

    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){

        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, currentBasket;

        if (exchangeID) {
            currentBasket = basketMgr.getCurrentBasket()

            if (currentBasket && currentBasket.getProductLineItems().toArray().length) { //TODO: is there a property for isEmpty on basket object?
                dataObj = klaviyoUtils.addedToCartData(currentBasket);
                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.addedToCart);
                // TODO: need to do anything here with the service call result, or handle all errs etc within trackEvent? otherwise no need to assign to a var / return a value
            }

        }

    }

    next();
});


module.exports = server.exports();