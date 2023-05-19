'use strict';

/* Script Modules */
var fullProductModel = require('*/cartridge/models/product/fullProduct');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');


function getProductPrices(product) {
    var options = productHelper.getConfig(product, { pid: product.ID });
    var newProdObj = Object.create(Object.prototype);
    var fullProduct = fullProductModel(newProdObj, options.apiProduct, options);
    var fullPriceValue = fullProduct.price.sales ? fullProduct.price.sales.value : fullProduct.price.min.sales.value;
    var fullPriceFormatted = fullProduct.price.sales ? fullProduct.price.sales.formatted : fullProduct.price.min.sales.formatted;

    return {
        price : fullPriceValue,
        priceString : fullPriceFormatted,
        originalPrice : fullProduct.price.list ? fullProduct.price.list.value : fullPriceValue,
        originalPriceString : fullProduct.price.list ? fullProduct.price.list.formatted : fullPriceFormatted
    }
}


module.exports = {
    getProductPrices : getProductPrices
};
