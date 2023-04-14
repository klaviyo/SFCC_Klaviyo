'use strict';

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var cartModel = require('*/cartridge/scripts/models/CartModel');
var recreateHelpers = require('*/cartridge/scripts/recreateCartHelpers');

/* eslint-disable */
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
    var cart = app.getModel('Cart').goc();
    var test = request.httpParameterMap;
    var items = JSON.parse(StringUtils.decodeBase64(request.httpParameterMap.items));
    var renderInfo = recreateHelpers.addProductToCart(items, cart)

    // TODO: Check each of these line-by-line after finalizing the _addProductToCart function
    // The following occurs only AFTER AN ITEM HAS BEEN ADDED TO CART....(original code required obj stored in renderInfo from cart.addProductToCart())
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


/*
 * Module exports
 */
exports.Cart = guard.ensure(['get'], cart);
