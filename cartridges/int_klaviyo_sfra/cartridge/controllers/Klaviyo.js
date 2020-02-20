'use strict';

var server = require('server');

// Use the following for CSRF protection: add middleware in routes and hidden field on form

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Logger = require('dw/system/Logger');

/* API Includes */
var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');

/**
 * You have to add the values for Klaviyo Account, Klaviyo API Key in
 * Merchant Tools -> Site Preferences -> Custom Site Preference -> Klaviyo
 * Change the value of Klaviyo Enabled as Yes
 */

server.get(
    'RenderKlaviyo',
    server.middleware.https,
    function (req, res, next) {
        if (!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')) {
            return;
        }
        var logger = Logger.getLogger('renderKlaviyo', 'Klaviyo - Render Klaviyo Controller');
        try {
            var klaviyoDataLayer = klaviyoUtils.buildDataLayer();
            res.render('/klaviyo/klaviyo_tag', {
                klaviyoData: klaviyoDataLayer
            });
            next();
        } catch (e) {
            logger.debug('error rendering klaviyo ' + e.message + ' at ' + e.lineNumber);
        }
    }
);

server.get(
    'RenderKlaviyoAddToCart',
    server.middleware.https,
    function (req, res, next) {
        if (!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')) {
            return;
        }
        var klaviyoDataLayer = klaviyoUtils.buildDataLayer();
        res.render('/klaviyo/klaviyo_tag', {
            klaviyoData: klaviyoDataLayer
        });
        next();
    }
);

server.get(
    'FooterSubscribe',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        res.render('klaviyo/footer_subscribe');

        next();
    }
);

server.post(
    'Subscribe',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var email = req.form.emailsignup;
        var source = req.form.source;
        var statusMessage = null;
        var klaviyoSubscriptionUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoSubscriptionUtils');
        if (klaviyoSubscriptionUtils.subscribeToList(email, source)) {
            statusMessage = 'Successfully subscribed.';
        } else {
            statusMessage = 'Already Subscribed';
        }
        res.render('klaviyo/subscription_status', {
            statusMessage: statusMessage
        });
        next();
    }
);

server.get(
    'ShipmentConfirmation',
    server.middleware.https,
    function (req, res, next) {
        if (!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')) {
            return;
        }

        var orderID = req.querystring.orderID;
        if (!empty(orderID)) {
            klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
            if (klaviyoUtils.sendShipmentConfirmation(orderID)) {
                res.json({
                    status: 'success'
                });
            } else {
                res.json({
                    status: 'failed sending email'
                });
            }
        }

        next();
    }
);

module.exports = server.exports();
