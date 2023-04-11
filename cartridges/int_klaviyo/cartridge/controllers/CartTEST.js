'use strict';

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var cartModel = require('*/cartridge/scripts/models/CartModel')

/* eslint-disable */
var res = require("*/cartridge/scripts/util/Response");

/* API Includes */
var ISML = require('dw/template/ISML');
var StringUtils = require('dw/util/StringUtils');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');


// var CartModel = AbstractModel.extend({

// ENDPOINT ----->>>>> https://zzqk-005.dx.commercecloud.salesforce.com/on/demandware.store/Sites-SiteGenesis-Site/en_US/CartTEST-AddProduct?pid=microsoft-zune120

function recreate () {
    var httpQueryString = request.httpQueryString;
    var items = JSON.parse(StringUtils.decodeBase64(httpQueryString.substring(httpQueryString.indexOf('=')+1)));
    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    // var cartForm = app.getForm('cart');
    // app.getForm('login').invalidate();
    // cartForm.get('shipments').invalidate();

    var cart = app.getModel('Cart').goc();
    // var renderInfo = cart.addProductToCart();
    var cartGET = cartModel.get();

    for (let i = 0; i < items.length; i++) {
        // let currProduct = items[i];
        var productTEST = ProductMgr.getProduct(items[i].productID);
        var productList = app.getModel('ProductList').get();
        // productList.addProduct(productTEST, items[0].quantity, productTEST.productOptionModel);
        cart.addProductItem(productTEST, items[0].quantity, productTEST.productOptionModel)
    }
        // cart: app.getModel('Cart').get(),

        // product, quantity, productOptionModel
    // productList = app.getModel('ProductList').get();
    // productList.addProduct(product.object, request.httpParameterMap.Quantity.doubleValue, productOptionModel);


    //  app.getView('Cart', {
    //     cart: app.getModel('Cart').get(),
    // }).render('checkout/cart/cart');
    app.getView('Cart', {
        cart: currentBasket,
    }).render('checkout/cart/cart');

    // res.renderJSON({
    //     items: items,
    //     cartInfo: cartForm,
    //     basketInfo: currentBasket
    // });

}

function addProduct() {
    var cart = app.getModel('Cart').goc();
    var renderInfo = cart.addProductToCart();

    /* Klaviyo Added to Cart event tracking */
    var basketMgr = require('dw/order/BasketMgr');
    var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
    var addedToCartData = require('*/cartridge/scripts/klaviyo/eventData/addedToCart');
    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){
        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, currentBasket;
        if (exchangeID) {
            currentBasket = basketMgr.getCurrentBasket()
            if (currentBasket && currentBasket.getProductLineItems().toArray().length) { //TODO: is there a property for isEmpty on basket object?
                dataObj = addedToCartData.getData(currentBasket);
                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.addedToCart);
                // TODO: need to do anything here with the service call result, or handle all errs etc within trackEvent? otherwise no need to assign to a var / return a value
            }
        }
    }
    /* END Klaviyo Added to Cart event tracking */

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

// });


// /*
//  * Module exports
//  */
exports.Recreate = guard.ensure(['get'], recreate);
exports.AddProduct = guard.ensure(['get'], addProduct);

