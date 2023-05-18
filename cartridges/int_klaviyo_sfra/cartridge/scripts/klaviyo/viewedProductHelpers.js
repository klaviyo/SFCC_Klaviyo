'use strict';

var fullProductModel = require('*/cartridge/models/product/fullProduct');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');


function getProductPrices(product) {
    var options = productHelper.getConfig(product, { pid: product.ID });
    var newProdObj = Object.create(Object.prototype);
    var fullProduct = fullProductModel(newProdObj, options.apiProduct, options);

    return {
        price : fullProduct.price.sales.value,
        priceString : fullProduct.price.sales.formatted,
        originalPrice : fullProduct.price.list ? fullProduct.price.list.value : fullProduct.price.sales.value,
        originalPriceString : fullProduct.price.list ? fullProduct.price.list.formatted : fullProduct.price.sales.formatted
    }
}


/*
 * Module exports
 */
module.exports = {
    getProductPrices : getProductPrices
}