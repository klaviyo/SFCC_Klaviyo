'use strict';

var server = require('server');
server.extend(module.superModule);

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var orderConfirmationData = require('*/cartridge/scripts/klaviyo/eventData/orderConfirmation');

/**
     * KL EVENT TRACKING: Order Confirmation event, triggered via appending the OOTB Order-Confirm controller
     * Utilizes orderConfirmation.js > getData() to assemble event data and utils.js > trackEvent(...) to transmit it to the KL API
     * Order Confirmation events use customer email and not KL exchangeID for identifying the user.
     * Also note that no client side debugging is possible for this event as SFCC won't accept additional QS parameters
     *  in the Order-Confirm controller.  Instead rely on server side logs to debug Order Confirmation events.
**/
server.append('Confirm', function (req, res, next) {
    if (klaviyoUtils.klaviyoEnabled) {
        // KL EVENT TRACKING: Started Checkout event
        // Resets session variable 'klaviyoCheckoutTracked' to default state (false) after successful checkout.
        // This allows for tracking the Started Checkout event again if the user re-enters checkout while
        // their session is still active
        req.session.privacyCache.set('klaviyoCheckoutTracked', false);

        // KL IDENTIFY: try to get the exchangeID from the KL cookie
        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj;
        var currentOrder;

        if (req.form.orderID && req.form.orderToken) {
            currentOrder = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

            if (currentOrder && currentOrder.customerEmail) {
                // Verify that the order status is "New" or "Created"
                if (currentOrder.status == dw.order.Order.ORDER_STATUS_NEW || currentOrder.status == dw.order.Order.ORDER_STATUS_OPEN) {
                    // KL EVENT TRACKING: assemble event data
                    dataObj = orderConfirmationData.getData(currentOrder, exchangeID);
                    // KL EVENT TRACKING: send event data to KL API via services.js > trackEvent(...)
                    klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.orderConfirmation, currentOrder.customerEmail);
                }

                if ('KLEmailSubscribe' in session.custom || 'KLSmsSubscribe' in session.custom) {
                    var email = session.custom.KLEmailSubscribe ? currentOrder.customerEmail : false;
                    var phone = session.custom.KLSmsSubscribe ? currentOrder.defaultShipment.shippingAddress.phone : false;
                    var e164PhoneRegex = new RegExp(/^\+[1-9]\d{1,14}$/);
                    if (phone) {
                        // NOTE: Klaviyo only accepts phone numbers that include + and the country code at the start (ex for US: +16465551212)
                        // in order to successfully get users subscribed to SMS list you must collect the country code in your order phone number field!
                        phone = '+' + phone.replace(/[^a-z0-9]/gi, '');
                        if (!e164PhoneRegex.test(phone)) {
                            phone = false;
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
