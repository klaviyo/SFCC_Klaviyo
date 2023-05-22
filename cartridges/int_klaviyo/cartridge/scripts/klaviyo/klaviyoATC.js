'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var recreateHelpers = require('*/cartridge/scripts/klaviyo/recreateCartHelpers');


// KL RECREATE CART (SiteGen)
// This function mimics addProductToCart method SiteGen uses as part of its Add To Cart logic.
// addProductToCart() starts by decoding and preparing the data, then clearing a cart object so items can be added to it using the
// same logical flow as the OOTB 'Add To Cart' logic that gets triggered when a customer clicks the 'Add to Cart' button on a PDP
function addProductToCart(decodedItems, cartObj) {
    try {
        var productList = decodedItems.length ? decodedItems : null;
        var cart = cartObj;

        if (cart.object.allProductLineItems.length) {
            recreateHelpers.clearCart(cart.object);
        }

        var params = request.httpParameterMap;
        var format = params.hasOwnProperty('format') && params.format.stringValue ? params.format.stringValue.toLowerCase() : '';
        var newBonusDiscountLineItem;
        var Product = app.getModel('Product');
        var productOptionModel;
        var productToAdd;
        var template = 'checkout/cart/minicart';

        for (let i = 0; i < productList.length; i++) {
            productToAdd = Product.get(productList[i].productID);
            // Once full product is captured using the Product.get() function, we need to use the updateOptions() function in recreateHelpers.js to handle getting
            // the available product options and choosing the correct one that was previously selected by the customer when the recreate cart link was built.
            productOptionModel = productToAdd ? recreateHelpers.updateOptions(productList[i], productToAdd.object) : null;

            // After product data has been decoded & processed using core SFCC logical flows - it is passed to OOTB SiteGen Add To Cart logic (the same logic that handles 'Add to Cart' on the PDP)
            cart.addProductItem(productToAdd.object, productList[i].quantity, productOptionModel);
        }

        // After an item is added to the cart using the addProductItem method on the Cart Model, we return a simple object with expected values that will be used in SiteGen templates (Ex: minicart template)
        return {
            format: format,
            template: template,
            BonusDiscountLineItem: newBonusDiscountLineItem
        };
    } catch (error) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.SiteGen recreateCartHelpers.js');
        logger.error('addProductToCart() failed. ERROR at: {0} {1}', error.message, error.stack)

        return {
            success: false,
            error: true,
            errorMessage: `ERROR - Please check the encoded obj for any unexpected chars or syntax issues. ${error.message}`,
        };
    }
};

/*
 * Module exports
 */
module.exports = {
    addProductToCart : addProductToCart,
}
