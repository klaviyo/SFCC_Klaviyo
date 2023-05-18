'use strict';

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

/* API Includes */
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Promotion = require('dw/campaign/Promotion');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');



function getProductPrices(product) {
    var price, originalPrice, promoPrice;
    var orgProduct = product;

    product = (product.variationGroup) ? product.masterProduct : product;

    if(product.master && !product.priceModel.isPriceRange() && product.variationModel.variants.size() > 0) {
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
