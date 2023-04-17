'use strict';

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var cartModel = require('*/cartridge/scripts/models/CartModel');
var recreateHelpers = require('*/cartridge/scripts/recreateCartHelpers');
var res = require("*/cartridge/scripts/util/Response");

/* API Includes */
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');


/**
 * KlaviyoRecreate-Cart : The KlaviyoRecreate-Cart route rebuilds a cart page based on a query containing an ENCODED array of objects with product IDs, product quanty, the product's selected options within URL / endpoint.
 * A DECODED query would be structured as:  <baseURL>/Cart-Recreate?items=[ {"productID": ProdID, "quantity": QTY, "options": [ {lineItemText, optionID, optionValueID} ]} ] *
 * @param {querystringparameter} - items - JSON containing product Ids, qty, options
 * @param {renders} - isml via the Cart-Show controller
 * @param {serverfunction} - Get
 */
function cart() {
    try {
        var cart = app.getModel('Cart').goc();
        var items = request.httpParameterMap.items ? JSON.parse(StringUtils.decodeBase64(request.httpParameterMap.items)) : null;
    } catch (error) {
        var test = error;
        res.renderJSON({
            success: false,
            error: true,
            errorMessage: `ERROR - ${error.message}. Please check encoded URL Object and the Cart Model reference.`
        });
        return;
    }

    if (cart && items.length) {
        var renderInfo = recreateHelpers.addProductToCart(items, cart)

        if (renderInfo.error) {
            res.renderJSON({
                success: renderInfo.success,
                error: renderInfo.error,
                errorMessage: renderInfo.errorMessage
            })
            return;
        }

        if (renderInfo.source === 'giftregistry') {
            app.getView().render('account/giftregistry/refreshgiftregistry');
        } else if (renderInfo.template === 'checkout/cart/cart') {
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

    if (!cart) {
        res.renderJSON({
            success: false,
            error: true,
            errorMessage: `The Cart is: ${cart}. Please check the Cart obj to ensure there is a value.`
        })
        return;
    }
}


/*
 * Module exports
 */
exports.Cart = guard.ensure(['get'], cart);
