'use strict';

var server = require('server');
var OrderMgr = require('dw/order/OrderMgr');
var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');


server.extend(module.superModule);


server.append('Confirm', function (req, res, next) {

    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){

        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, currentOrder;

        if (exchangeID && req.form.orderID && req.form.orderToken) {
            currentOrder = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
            // check to see if the status is new or created
            if (currentOrder.status == dw.order.Order.ORDER_STATUS_NEW || currentOrder.status == dw.order.Order.ORDER_STATUS_OPEN) {
                klaviyoUtils.orderConfirmationData(currentOrder, exchangeID);
                // trackEvent is called within prepareOrderConfirmationEvent - TODO: reassess this completely to move trackEvent call(s) up to this level
            }

        }

    }

    next();
});


module.exports = server.exports();