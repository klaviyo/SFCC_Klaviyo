'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;
var siteId = klaviyoUtils.siteId;

// prepares data for "Viewed Product" event
function getData(productID) {
    var data;
    try {
        data = {};

        // product in viewData is flat and doesn't have all data required (to whit, categories)
        var product = ProductMgr.getProduct(productID);
        if (!product) {
            throw new Error('Product with ID [' + productID + '] not found');
        }

        // use the configurable setting to see which product id should be used on the event
        var parentProduct = klaviyoUtils.getParentProduct(product);
        data['Product ID'] = parentProduct ? parentProduct.ID : null;

        if (!product.master && 'masterProduct' in product) {
            // this is very unlikely to happen because PDPs are not typically used for variants
            data['Master Product ID'] = product.masterProduct.ID;
        }

        var prices = require('*/cartridge/scripts/klaviyo/viewedProductHelpers.js').getProductPrices(product);

        klaviyoUtils.setSiteIdAndIntegrationInfo(data, siteId);
        data['Product Name'] = product.name;
        data['Product Page URL'] = URLUtils.https('Product-Show', 'pid', product.ID).toString();
        data['Product Image URL'] = product.getImage(KLImageSize).getAbsURL().toString();
        data['Price'] = prices.price;
        data['Price String'] = prices.priceString;
        data['Original Price'] = prices.originalPrice ? prices.originalPrice : prices.price;
        data['Original Price String'] = prices.originalPriceString ? prices.originalPriceString : prices.priceString;
        data['Product UPC'] = product.UPC;
        data['value'] = prices.price;
        data['value_currency'] = session.getCurrency().getCurrencyCode();

        var categories = [];
        var catProduct = (product.variant) ? product.masterProduct : product;
        for (var i = 0, len = catProduct.categoryAssignments.length; i < len; i++) {
            categories.push(catProduct.categoryAssignments[i].category.displayName);
        }
        categories = klaviyoUtils.dedupeArray(categories);

        data['Categories'] = categories;
        data['Primary Category'] = !empty(catProduct.getPrimaryCategory()) ? catProduct.getPrimaryCategory().displayName : '';
    } catch (e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core viewedProduct.js');
        logger.error('viewedProduct.getData() failed to create data object: ' + e.message + ' ' + e.stack);
    }

    return data;
}


module.exports = {
    getData: getData
};
