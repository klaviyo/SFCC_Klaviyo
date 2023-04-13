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


// ENDPOINT ----->>>>> https://zzqk-005.dx.commercecloud.salesforce.com/on/demandware.store/Sites-SiteGenesis-Site/en_US/KlaviyoRecreate-Cart?pid=microsoft-zune120
// ENDPOINT (with quantity) ----->>>>>> https://zzqk-005.dx.commercecloud.salesforce.com/on/demandware.store/Sites-SiteGenesis-Site/en_US/KlaviyoRecreate-Cart?pid=microsoft-zune120&Quantity=3
// ENDPOINT (with decoded product & quantity) ----->>>>> https://zzqk-005.dx.commercecloud.salesforce.com/on/demandware.store/Sites-SiteGenesis-Site/en_US/KlaviyoRecreate-Cart?items=W3sicHJvZHVjdElEIjoibWljcm9zb2Z0LXp1bmUxMjAiLCJxdWFudGl0eSI6MTN9XQ==
// ENDPOINT (with decoded reg product and one bundled product) ------>>>>>> https://zzqk-005.dx.commercecloud.salesforce.com/on/demandware.store/Sites-SiteGenesis-Site/en_US/KlaviyoRecreate-Cart?items=W3sicHJvZHVjdElEIjoibWljcm9zb2Z0LXp1bmUxMjAiLCJxdWFudGl0eSI6MTN9LHsicHJvZHVjdElEIjoic29ueS1wczMtYnVuZGxlIiwicXVhbnRpdHkiOjF9XQ==

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


// Controller currently located at KlaviyoRecreate-Cart route. This captures a query string containing decoded Products, decodes them and adds
// each product to cart. Finally, this controller renders the Cart page via Cart-Show upon successful conclusion.
function cart() {
    var cart = app.getModel('Cart').goc();
    var test = request.httpParameterMap;
    var items = JSON.parse(StringUtils.decodeBase64(request.httpParameterMap.items));

    var renderInfo = _addProductToCart(items, cart)

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



function _addProductToCart(decodedItems, cartObj) {
    var productList = decodedItems.length ? decodedItems : null;
    var cart = cartObj;

    if (cart.object.allProductLineItems) {
        for (let i = 0; i < cart.object.allProductLineItems.length; i++) {
            let currItem = cart.object.allProductLineItems[i];
            cart.removeProductLineItem(cart.object.allProductLineItems[i]);
        }
    }

    var params = request.httpParameterMap;
    var format = params.hasOwnProperty('format') && params.format.stringValue ? params.format.stringValue.toLowerCase() : '';
    var newBonusDiscountLineItem;
    var Product = app.getModel('Product');
    var productOptionModel;
    var productToAdd;
    var template = 'checkout/cart/minicart';

    // Edit details of a gift registry
    if (params.source && params.source.stringValue === 'giftregistry' && params.cartAction && params.cartAction.stringValue === 'update') {
        ProductList.replaceProductListItem();
        return {
            source: 'giftregistry'
        };
    }

    if (params.source && params.source.stringValue === 'wishlist' && params.cartAction && params.cartAction.stringValue === 'update') {
        app.getController('Wishlist').ReplaceProductListItem();
        return;
    } else {
        var previousBonusDiscountLineItems = cart.getBonusDiscountLineItems();
        for (let i = 0; i < productList.length; i++) {
            productToAdd = Product.get(productList[i].productID);
            if (productToAdd.object.isProductSet()) {
                // var childPids = params.childPids.stringValue.split(','); // comma delimited list of product ids
                // var childQtys = params.childQtys.stringValue.split(','); // product quantity list or each products.
                // var counter = 0;

                // for (var i = 0; i < childPids.length; i++) {
                //     var childProduct = Product.get(childPids[i]);

                //     if (childProduct.object && !childProduct.isProductSet()) {
                //         var childProductOptionModel = childProduct.updateOptionSelection(params);
                //         cart.addProductItem(childProduct.object, parseInt(childQtys[counter]), childProductOptionModel);
                //     }
                //     counter++;
                // }
            } else {
                for (let i = 0; i < productList.length; i++){
                    productOptionModel = _updateOptions(productList[i], productToAdd.object);
                    cart.addProductItem(productToAdd.object, productList[i].quantity, productOptionModel);
                }
            }

            // When adding a new product to the cart, check to see if it has triggered a new bonus discount line item.
            newBonusDiscountLineItem = cart.getNewBonusDiscountLineItem(previousBonusDiscountLineItems);
        }
    }

    return {
        format: format,
        template: template,
        BonusDiscountLineItem: newBonusDiscountLineItem
    };
};


function _updateOptions(params, product) {
    var optionModel = product.getOptionModel();

    for (var i = 0; i < params.options.length; i++) {
        var optionID      = params.options[i].optionID;
        var optionValueID = params.options[i].optionValueID;

        if (optionValueID) {
            var option = optionModel.getOption(optionID);

            if (option && optionValueID) {
                var optionValue = optionModel.getOptionValue(option, optionValueID);
                if (optionValue) {
                    optionModel.setSelectedOptionValue(option, optionValue);
                }
            }
        }
    }
    return optionModel;
}


// /*
//  * Module exports
//  */
exports.AddProduct = guard.ensure(['get'], addProduct);
exports.Cart = guard.ensure(['get'], cart);

