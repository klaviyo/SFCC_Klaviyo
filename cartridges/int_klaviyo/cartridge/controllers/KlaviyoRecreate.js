'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var cartModel = require('*/cartridge/scripts/models/CartModel');
var klaviyoCart = require('*/cartridge/scripts/klaviyo/klaviyoATC');
var res = require("*/cartridge/scripts/util/Response");


/**
 * KlaviyoRecreate-Cart : The KlaviyoRecreate-Cart route rebuilds a cart page based on a query containing an ENCODED array of objects with product IDs, product quanty, the product's selected options within URL / endpoint.
 * A DECODED query would be structured as:  <baseURL>/Cart-Recreate?items=[ {"productID": ProdID, "quantity": QTY, "options": [ {lineItemText, optionID, optionValueID} ]} ] *
 * @param {querystringparameter} - items - JSON containing product Ids, qty, options
 * @param {renders} - isml via the Cart-Show controller
 * @param {serverfunction} - Get
 */
function cart() {
    var logger = Logger.getLogger('Klaviyo', 'Klaviyo.SiteGen KlaviyoRecreate.js');
    try {
        var cart = app.getModel('Cart').goc();
        var items = request.httpParameterMap.items ? JSON.parse(StringUtils.decodeBase64(request.httpParameterMap.items)) : null;
    } catch (error) {
        logger.error('KlaviyoRecreate-Cart failed. Please check the encoded obj for unexpected chars or syntax issues. ERROR: {0} {1}', error.message, error.stack);

        app.getView({
            message: Resource.msg('rebuildcart.message.error.general', 'klaviyo_error', null)
        }).render('klaviyo/klaviyoError')
        return;
    }

    if (!cart || !items || !items.length) {
        logger.error(`KlaviyoRecreate-Cart controller failed to create a cart Obj. The currentBasket is ${cart} and items are ${items}.`);

        app.getView({
            message: Resource.msg('rebuildcart.message.error.general', 'klaviyo_error', null)
        }).render('klaviyo/klaviyoError');
        return;
    }

    var renderInfo = klaviyoCart.addProductToCart(items, cart);

    if (renderInfo.error) {
        app.getView({
            message: Resource.msg('rebuildcart.message.error.general', 'klaviyo_error', null)
        }).render('klaviyo/klaviyoError');
        return;
    }

    if (renderInfo.template === 'checkout/cart/cart') {
        app.getView('Cart', {
            Basket: cart
        }).render(renderInfo.template);
    } else if (renderInfo.format === 'ajax') {
        app.getView('Cart', {
            cart: cart,
            BonusDiscountLineItem: renderInfo.BonusDiscountLineItem
        }).render(renderInfo.template);
    } else {
        response.redirect(URLUtils.url('Cart-Show'));
    }

}


/*
 * Module exports
 */
exports.Cart = guard.ensure(['get'], cart);
