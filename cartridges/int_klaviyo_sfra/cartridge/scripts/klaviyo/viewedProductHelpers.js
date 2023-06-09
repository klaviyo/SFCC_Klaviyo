'use strict';

/* Script Modules */
var fullProductModel = require('*/cartridge/models/product/fullProduct');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

/**
     *
     * KL EVENT TRACKING (SFRA): get a product's current and original ("list") price and return them
     *  in an object in multiple formats to be passed along in various event data objects.
     *
     * This file is relatively simple, but due to differences between SFRA and SiteGen it must be
     *  extracted out to its own file for inclusion in core getData() functions.
     * By utilizing the OOTB SFRA "fullProductModel" model we are able to consistently get the actual current price
     *  regardless of whether it is affected by "sale" prices (entries in sale pricebooks), promos, etc.
     *  However, due to site-specific customization and product / promotions utilization
     *  it is always possible that a specific client may need to adjust or augment the code below.
     * The goal is that "price" will always reflect the price seen by the user on the PDP and that "original price"
     *  will always reflect the full, non-reduced "list" price of the item.
     * Also note that certain types of promos, including "Order Level Discounts," will result in different prices
     *  being seen in on the PDP vs once the product has been added to cart.
     *
     * Values within the returned object:
     *  price: current price as a number, ie 9.99
     *  priceString: current price as a formatted currency string inc. currency symbol, ie "$9.99"
     *  originalPrice: list price as a number, ie 14.99
     *  originalPriceString: list price as formatted currency string inc currency symbol, ie "$14.99"
     *
     * Note that "price" / "originalPrice" in this event are numerical, whereas in other events they are formatted currency strings
     *  This reversal is neccesary to preserve backward-compatibility with current KL customer flows
**/
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
