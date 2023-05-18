'use strict';

var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var orderConfirmationData = require('*/cartridge/scripts/klaviyo/eventData/orderConfirmation');

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');


server.append('Confirm', function (req, res, next) {

    if(klaviyoUtils.klaviyoEnabled){

        // resetting to default state after successful checkout
        req.session.privacyCache.set('klaviyoCheckoutTracked', false);

        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, currentOrder;

        if(req.form.orderID && req.form.orderToken) {
            currentOrder = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

            if (currentOrder && currentOrder.customerEmail) {
                // check to see if the status is new or created
                if (currentOrder.status == dw.order.Order.ORDER_STATUS_NEW || currentOrder.status == dw.order.Order.ORDER_STATUS_OPEN) {
                    dataObj = orderConfirmationData.getData(currentOrder, exchangeID);
                    serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.orderConfirmation, currentOrder.customerEmail);
                }
            }
        }
    }

    next();
});


module.exports = server.exports();
