'use strict';

/* Script Modules */
var fullProductModel = require('*/cartridge/models/product/fullProduct');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');


// The getProductPrices helper func is necessary to locate the correct 'purchase price' that's visible on the PDP.
// This leverages SFRA logic and expected properties to locate the original price book & promos to capture promotional prices that may be set on a given item. Core SFRA logic is used to locate the correct price.
// It accepts a full product as a parameter and returns a simple object with four properties. Ex: { "price": INT, "priceString": STRING, "originalPrice": INT, "originalPriceString": STRING }
function getProductPrices(product) {
    var options = productHelper.getConfig(product, { pid: product.ID });
    var newProdObj = Object.create(Object.prototype);
    var fullProduct = fullProductModel(newProdObj, options.apiProduct, options);
    var fullPriceValue = fullProduct.price.sales ? fullProduct.price.sales.value : fullProduct.price.min.sales.value;
    var fullPriceFormatted = fullProduct.price.sales ? fullProduct.price.sales.formatted : fullProduct.price.min.sales.formatted;

    return {
        price               : fullPriceValue,
        priceString         : fullPriceFormatted,
        originalPrice       : fullProduct.price.list ? fullProduct.price.list.value : fullPriceValue,
        originalPriceString : fullProduct.price.list ? fullProduct.price.list.formatted : fullPriceFormatted
    };
}


module.exports = {
    getProductPrices: getProductPrices
};
