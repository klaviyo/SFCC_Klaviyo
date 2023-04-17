'use strict';

/* Script Modules */
var app = require('*/cartridge/scripts/app');

function addProductToCart(decodedItems, cartObj) {
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
            try {
                productToAdd = Product.get(productList[i].productID);
            } catch (error) {
                return {
                    success: false,
                    error: true,
                    errorMessage: `ERROR - Please check the encoded obj for any unexpected chars or syntax issues. ${error.message}`
                };
            }
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
