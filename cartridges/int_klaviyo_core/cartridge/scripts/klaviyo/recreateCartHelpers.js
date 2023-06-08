'use strict';

/* API Includes */
var PromotionMgr = require('dw/campaign/PromotionMgr');


// The clearCart function is necessary iterate through all items in the cart to clear it and ensure a clean slate
// (Note: ensures consistency with price, product items and shipping when refreshing the page or loading the page for the first time)
function clearCart(cartObj) {
    for (var i = cartObj.allProductLineItems.length - 1; i >= 0; i--) {
        cartObj.removeProductLineItem(cartObj.allProductLineItems[i]);
    }

    cartObj.updateTotals();
    PromotionMgr.applyDiscounts(cartObj);
}


// The updateOptions func is necessary to update Update Product Options so they're properly accounted for when adding items to the cart.
// (Ex: 'Extended Warranty: 3 Year Warranty' - product warranties, etc.)
function updateOptions(params, product) {
    var optionModel = product.getOptionModel();

    for (var i = 0; i < params.options.length; i++) {
        var optionID = params.options[i]['Option ID'];
        var optionValueID = params.options[i]['Option Value ID'];

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


module.exports = {
    clearCart     : clearCart,
    updateOptions : updateOptions
};
