'use strict';

/* API Includes */
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Promotion = require('dw/campaign/Promotion');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');


/***
 * KL EVENT TRACKING (SiteGen): get a product's current and original ("list") price and return them
 * in an object in multiple formats to be passed along in various event data objects.
 *
 * Differences between SFRA and SiteGen require us to extract product price data from its own file. This is called in the getData() in viewedProduct.js
 *
 * The goal of this file is to get "price" to reflect the price seen by the user on the PDP and for "original price"
 * to always reflect the full, non-reduced "list" price of the item.
 *
 * Values within the returned object:
 *   price: current price as a number, i.e. 9.99
 *   priceString: current price as a formatted currency string inc. currency symbol, i.e. "$9.99"
 *   originalPrice: list price as a number, i.e. 14.99
 *   originalPriceString: list price as formatted currency string inc currency symbol, i.e. "$14.99"
 *
 * Note 1: certain types of promos, including "Order Level Discounts", will result in different prices being seen in on the PDP vs once the product has been added to cart.
 * Note 2: Due to site-specific customization and product / promotions settings, it is possible that a specific client may need to adjust or augment the code below.
 * Note 3: "price" / "originalPrice" in this event are numerical, whereas in other events they are formatted currency strings. This is neccesary to preserve backward-compatibility with current KL customer flows.
***/

function getProductPrices(product) {
    var price, originalPrice, promoPrice;
    var orgProduct = product;

    product = (product.variationGroup) ? product.masterProduct : product;

    if(product.master && !product.priceModel.isPriceRange() && product.variationModel.variants.size() > 0) {
        product = orgProduct.variationModel.variants[0];
    }

    try {
        // In SiteGen, we need the priceModel object to identify price books assigned to a specific product (Ex: an original 'list price' book vs. a 'sales price' book, etc.)
        var priceModel = product.getPriceModel();
        // The getRootPriceBook utility function is leveraged to get the root price book assigned to a given product.
        var priceBook = priceModel.priceInfo.priceBook ? klaviyoUtils.getRootPriceBook(priceModel.priceInfo.priceBook) : null;

        // SFCC's PromotionMgr class object is used to access any campaigns and promotions to calculate and apply promotional discounts to products. Promotions & discounts are
        // stored on the activeCustomerPromotions object with the applicable session currency and according to the current customer's view (ex: any targeted specials, etc.).
        // Here, we use the getProductPromotions function to get the promotions that are currently active on the given product.
        var promos = PromotionMgr.activeCustomerPromotions.getProductPromotions(product);
        var promo = promos && promos.length ? promos[0] : null;
        var promoClass = promo ? promo.getPromotionClass() : null;

        // When a promo has been identified using the built-in SFCC utility classes & methods, we will set the promoPrice to the value of the promotional price calculated on SFCC's promo object.
        // Note: In this case, the promotional price is the 'purchase price' that is visible on the PDP (Ex: the price after any strike-throughs, specials, etc.)
        // Additional Note: More information about the getPromotionalPrice method is available in the SFCC Docs at: https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/content/b2c_commerce/topics/promotions/b2c_api_product_promotional_price.html?resultof=%22%67%65%74%50%72%6f%6d%6f%74%69%6f%6e%61%6c%50%72%69%63%65%22%20%22%67%65%74%70%72%6f%6d%6f%74%69%6f%6e%61%6c%70%72%69%63%22%20
        if (promoClass && promoClass.equals(Promotion.PROMOTION_CLASS_PRODUCT)) {
            if (product.optionProduct) {
                promoPrice = promo.getPromotionalPrice(product, product.getOptionModel());
            } else {
                promoPrice = promo.getPromotionalPrice(product);
            }
        }

        // If a promo price is identified and set, we declare the promotional price as the price...otherwise, the active price on the priceModel is set as the price.
        price = promoPrice ? promoPrice.value : priceModel.price.value;

        // SFCC's getPriceBookPrice method returns the active price of the product in the specified price book. The original price is set as the value that is active
        // on the priceModel, so we extract the price according to the priceBook assigned to the product.
        originalPrice = priceBook && priceModel ? priceModel.getPriceBookPrice(priceBook.ID) : null;

        if (originalPrice) {
            originalPrice = originalPrice.value;
        }

        // Similar to utilities used in priceCheck within utils.js, SFCC's formatMoney() method on the StringUtils class object is used to correctly format the price according to
        // the currency that is currently active on the session. (Ex: $19.99 or €19.99 or £19.99, etc.). The formatted currency values are returned alongside numerical values to be used in viewedProduct.js
        return {
            price : price,
            priceString : StringUtils.formatMoney(dw.value.Money( price, session.getCurrency().getCurrencyCode() )),
            originalPrice : originalPrice,
            originalPriceString : originalPrice ? StringUtils.formatMoney(dw.value.Money( originalPrice, session.getCurrency().getCurrencyCode() )) : null
        }

    } catch(e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.siteGen viewedProductHelper.js');
        logger.error('getProductPrices() failed to generate price data for product ' + product.ID + ': ' + e.message + ' ' + e.stack);
    }

    // fallback for failure to generate price data
    return {
        price : 0,
        priceString : 0,
        originalPrice : 0,
        originalPriceString : 0
    }
}


module.exports = {
    getProductPrices : getProductPrices
};
