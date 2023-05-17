'use strict';

var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;
var StringUtils = require('dw/util/StringUtils');


// prepares data for "Viewed Product" event
function getData(productID) {

    var data, price, priceString, originalPrice, originalPriceString, productImage;
    try {

        data = {};

        // product in viewData is flat and doesn't have all data required (to whit, categories)
        var product = ProductMgr.getProduct(productID);
        if (!product) {
            throw new Error('Product with ID [' + productID + '] not found');
        }

        var priceModel = product.getPriceModel();
        if (priceModel && priceModel.priceInfo) {
            // SiteGen Approach
            var priceBook = priceModel.priceInfo.priceBook ? klaviyoUtils.getRootPriceBook(priceModel.priceInfo.priceBook) : null;
            var PromotionMgr = require('dw/campaign/PromotionMgr');
            var Promotion = require('dw/campaign/Promotion');
            var promos = PromotionMgr.activeCustomerPromotions.getProductPromotions(product);
            var promo = promos && promos.length ? promos[0] : null;
            var promoClass = promo ? promo.getPromotionClass() : null;
            var promoPrice;
            if (promoClass && promoClass.equals(Promotion.PROMOTION_CLASS_PRODUCT)) {
                if (product.optionProduct) {
                    promoPrice = promo.getPromotionalPrice(product, product.getOptionModel());
                } else {
                    promoPrice = promo.getPromotionalPrice(product);
                }
            }

            originalPrice = priceBook && priceModel ? priceModel.getPriceBookPrice(priceBook.ID) : null;
            if (originalPrice) {
                originalPrice = originalPrice.value;
            }
            price = promoPrice ? promoPrice.value : priceModel.price.value;
            priceString = StringUtils.formatMoney(dw.value.Money( price, session.getCurrency().getCurrencyCode() ));
            originalPriceString = originalPrice ? StringUtils.formatMoney(dw.value.Money( originalPrice, session.getCurrency().getCurrencyCode() )) : null;
            productImage = product.getImage(KLImageSize).getAbsURL().toString()
        } else {
            // SFRA Approach
            var fullProductModel = require('*/cartridge/models/product/fullProduct');
            var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
            var options = productHelper.getConfig(product, { pid: productID });
            var newProdObj = Object.create(Object.prototype);
            var fullProduct = fullProductModel(newProdObj, options.apiProduct, options);

            price = fullProduct.price.sales.value;
            priceString = fullProduct.price.sales.formatted;
            originalPrice = fullProduct.price.list ? fullProduct.price.list.value : fullProduct.price.sales.value;
            originalPriceString = fullProduct.price.list ? fullProduct.price.list.formatted : fullProduct.price.sales.formatted;
            productImage = product.getImage(KLImageSize).getAbsURL().toString()
        }

        // copied & adjusted from kl_core klaviyoUtils prepareViewedProductEventData
        data['Product ID'] = product.ID;
        data['Product Name'] = product.name;
        data['Product Page URL'] = URLUtils.https('Product-Show', 'pid', product.ID).toString();
        data['Product Image URL'] = productImage;
        data['Price'] = price;
        data['Price String'] = priceString;
        data['Original Price'] = originalPrice ? originalPrice : price;
        data['Original Price String'] = originalPriceString ? originalPriceString : priceString;

        // verify what klav really wants here, UPC rarely used by SFCC clients
        data['Product UPC'] = product.UPC;

        var categories = [];
        var catProduct = (product.variant) ? product.masterProduct : product; // from orig klav code, always use master for finding cats
        for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
            categories.push(catProduct.categoryAssignments[i].category.displayName);
        }

        data['Categories'] = categories;
        data['Primary Category'] = !empty(product.getPrimaryCategory()) ? product.getPrimaryCategory().displayName : '';

    } catch(e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core viewedProduct.js');
        logger.error('viewedProduct.getData() failed to create data object: '+e.message+' '+ e.stack );
    }
    return data;
}


module.exports = {
    getData : getData
}