'use strict';

var server = require('server');
server.extend(module.superModule);

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var orderConfirmationData = require('*/cartridge/scripts/klaviyo/eventData/orderConfirmation');
var Logger = require('dw/system/Logger');


server.append('Confirm', function (req, res, next) {
    if (klaviyoUtils.klaviyoEnabled) {
        // resetting to default state after successful checkout
        req.session.privacyCache.set('klaviyoCheckoutTracked', false);

        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj;
        var currentOrder;

        if (req.form.orderID && req.form.orderToken) {
            currentOrder = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

            if (currentOrder && currentOrder.customerEmail) {
                // check to see if the status is new or created
                if (currentOrder.status == dw.order.Order.ORDER_STATUS_NEW || currentOrder.status == dw.order.Order.ORDER_STATUS_OPEN) {
                    dataObj = orderConfirmationData.getData(currentOrder, exchangeID);
                    klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.orderConfirmation, currentOrder.customerEmail);
                }

                if ('KLEmailSubscribe' in session.custom || 'KLSmsSubscribe' in session.custom) {
                    var email = currentOrder.customerEmail;
                    var phone = currentOrder.defaultShipment.shippingAddress.phone;
                    var e164PhoneRegex = new RegExp(/^\+[1-9]\d{1,14}$/);

                    if (phone) {
                        // NOTE: Klaviyo only accepts phone numbers that include + and the country code at the start (ex for US: +16465551212)
                        // in order to successfully get users subscribed to SMS list you must collect the country code in your order phone number field!
                        phone = '+' + phone.replace(/[^a-z0-9]/gi, '');
                        if (!e164PhoneRegex.test(phone)) {
                            if (session.custom.KLSmsSubscribe) {
                                var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core:  Order-Confirm');
                                logger.error(`SMS Subscription requested by user, but an invalid phone number was provided. Phone number: ${phone}`);
                            }
                            phone = null;
                        }
                    }

                    if (email || phone) {
                        klaviyoUtils.subscribeUser(email, phone);
                    }
                }
            }
        }
    }

    next();
});


module.exports = server.exports();
