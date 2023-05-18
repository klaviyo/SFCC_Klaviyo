'use strict';

var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;


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

        var prices = require('*/cartridge/scripts/klaviyo/viewedProductHelpers.js').getProductPrices(product);

        // copied & adjusted from kl_core klaviyoUtils prepareViewedProductEventData
        data['Product ID'] = product.ID;
        data['Product Name'] = product.name;
        data['Product Page URL'] = URLUtils.https('Product-Show', 'pid', product.ID).toString();
        data['Product Image URL'] = product.getImage(KLImageSize).getAbsURL().toString();
        data['Price'] = prices.price;
        data['Price String'] = prices.priceString;
        data['Original Price'] = prices.originalPrice ? prices.originalPrice : prices.price;
        data['Original Price String'] = prices.originalPriceString ? prices.originalPriceString : prices.priceString;

        // verify what klav really wants here, UPC rarely used by SFCC clients
        data['Product UPC'] = product.UPC;

        if(!product.master && 'masterProduct' in product) {
            data['Master Product ID'] = product.masterProduct.ID;
        }

        var categories = [];
        var catProduct = (product.variant) ? product.masterProduct : product; // from orig klav code, always use master for finding cats
        for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
            categories.push(catProduct.categoryAssignments[i].category.displayName);
        }
        categories = klaviyoUtils.dedupeArray(categories);

        data['Categories'] = categories;
        data['Primary Category'] = !empty(catProduct.getPrimaryCategory()) ? catProduct.getPrimaryCategory().displayName : '';

    } catch(e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core viewedProduct.js');
        logger.error('viewedProduct.getData() failed to create data object: '+e.message+' '+ e.stack );
    }
    return data;
}


module.exports = {
    getData : getData
}