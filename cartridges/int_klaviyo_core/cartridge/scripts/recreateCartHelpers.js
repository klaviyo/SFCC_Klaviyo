'use strict';

/* Script Modules */
var app = require('*/cartridge/scripts/app');

/* API Includes */
var Logger = require('dw/system/Logger');


function addProductToCart(decodedItems, cartObj) {
    try {
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

        if (params.source && params.source.stringValue === 'wishlist' && params.cartAction && params.cartAction.stringValue === 'update') {
            app.getController('Wishlist').ReplaceProductListItem();
            return;
        } else {
            var previousBonusDiscountLineItems = cart.getBonusDiscountLineItems();
            for (let i = 0; i < productList.length; i++) {
                productToAdd = Product.get(productList[i].productID);
                productOptionModel = productToAdd ? _updateOptions(productList[i], productToAdd.object) : null;
                cart.addProductItem(productToAdd.object, productList[i].quantity, productOptionModel);
                newBonusDiscountLineItem = cart.getNewBonusDiscountLineItem(previousBonusDiscountLineItems);
            }
        }

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

/*
 * Module exports
 */
module.exports = {
    addProductToCart : addProductToCart,
}
