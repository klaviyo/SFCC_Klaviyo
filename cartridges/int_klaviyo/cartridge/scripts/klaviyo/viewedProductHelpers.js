'use strict';

/* API Includes */
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Promotion = require('dw/campaign/Promotion');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');


// The getProductPrices helper func is necessary to locate the correct 'purchase price' that's visible on the PDP.
// This leverages SiteGen logic and expected properties to locate the original price book & promos to capture promotional prices that may be set on a given item.
// It accepts a full product as a parameter and returns a simple object with four properties. Ex: { "price": INT, "priceString": STRING, "originalPrice": INT, "originalPriceString": STRING }
function getProductPrices(product) {
    var price;
    var originalPrice;
    var promoPrice;
    var orgProduct = product;

    product = (product.variationGroup) ? product.masterProduct : product;

    if (product.master && !product.priceModel.isPriceRange() && product.variationModel.variants.size() > 0) {
        product = orgProduct.variationModel.variants[0];
    }

    try {
        var priceModel = product.getPriceModel();
        var priceBook = priceModel.priceInfo.priceBook ? klaviyoUtils.getRootPriceBook(priceModel.priceInfo.priceBook) : null;
        var promos = PromotionMgr.activeCustomerPromotions.getProductPromotions(product);
        var promo = promos && promos.length ? promos[0] : null;
        var promoClass = promo ? promo.getPromotionClass() : null;

        if (promoClass && promoClass.equals(Promotion.PROMOTION_CLASS_PRODUCT)) {
            if (product.optionProduct) {
                promoPrice = promo.getPromotionalPrice(product, product.getOptionModel());
            } else {
                promoPrice = promo.getPromotionalPrice(product);
            }
        }

        price = promoPrice ? promoPrice.value : priceModel.price.value;
        originalPrice = priceBook && priceModel ? priceModel.getPriceBookPrice(priceBook.ID) : null;

        if (originalPrice) {
            originalPrice = originalPrice.value;
        }

        return {
            price               : price,
            priceString         : StringUtils.formatMoney(dw.value.Money(price, session.getCurrency().getCurrencyCode())),
            originalPrice       : originalPrice,
            originalPriceString : originalPrice ? StringUtils.formatMoney(dw.value.Money(originalPrice, session.getCurrency().getCurrencyCode())) : null
        };
    } catch (e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.siteGen viewedProductHelper.js');
        logger.error('getProductPrices() failed to generate price data for product ' + product.ID + ': ' + e.message + ' ' + e.stack);
    }

    // fallback for failure to generate price data
    return {
        price               : 0,
        priceString         : 0,
        originalPrice       : 0,
        originalPriceString : 0
    };
}


module.exports = {
    getProductPrices: getProductPrices
};
