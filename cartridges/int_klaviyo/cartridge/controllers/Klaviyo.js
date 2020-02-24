'use strict';

/* Script Modules */
var guard = require('*/cartridge/scripts/guard');
var r = require('*/cartridge/scripts/util/Response');
var Logger = require('dw/system/Logger');
/* API Includes */
var ISML = require('dw/template/ISML');


/**
 * Controller that will send the necessary data required for klaviyo to track the user event's
 * such as checkout,order confirmation,searching etc and renders the renders the klaviyoTag isml file
 *
 * @module controllers/Klaviyo
*/


var RenderKlaviyo = function () {
    if (!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')) {
        return;
    }
    var logger = Logger.getLogger('renderKlaviyo', 'Klaviyo - Render Klaviyo Controller');
    try {
        var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
        var klaviyoTags = require('*/cartridge/scripts/utils/klaviyo/klaviyoOnSiteTags.js').klaviyoOnSiteTags;

        var klaviyoDataLayer = klaviyoUtils.buildDataLayer();
        var sendToDom = klaviyoTags(klaviyoDataLayer);

        ISML.renderTemplate('klaviyo/klaviyoTag', {
            klaviyoData: sendToDom
        });
    } catch (e) {
        logger.debug('error rendering klaviyo ' + e.message + ' at ' + e.lineNumber);
    }
};

/**
 * Controller that will send the necessary data  to klaviyo when an add to cart event happens
 * @module controllers/Klaviyo
*/


var RenderKlaviyoAddToCart = function () {
    if (!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')) {
        return;
    }
    var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');

    var klaviyoDataLayer = klaviyoUtils.buildCartDataLayer();

    ISML.renderTemplate('klaviyo/klaviyoTag', {
        klaviyoData: klaviyoDataLayer
    });
};


/**
 *end point for testing shipping confirmation event
 *
*/

function sendKlaviyoShipmentEmail() {
    var parameterMap = request.httpParameterMap;
    var orderID = null;
    if (!empty(parameterMap)) {
        orderID = parameterMap.orderID.stringValue;
    }
    if (orderID) {
        var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
        if (klaviyoUtils.sendMailForShipmentConfirmation(orderID)) {
            r.renderJSON({ status: 'success' });
        } else {
            r.renderJSON({ status: 'failed sending email' });
        }
    }
}

/** Handles the form submission for subscription.
 * @see {@link module:controllers/Klaviyo~Subscribe} */
exports.sendKlaviyoShipmentEmail = guard.ensure(['get'], sendKlaviyoShipmentEmail);
exports.RenderKlaviyo = guard.ensure(['get'], RenderKlaviyo);
exports.RenderKlaviyoAddToCart = guard.ensure(['get'], RenderKlaviyoAddToCart);
