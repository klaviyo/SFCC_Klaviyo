'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

var MAX_VARIANTS = 100;

function getVariantProducts(catalogProduct) {
    if (catalogProduct.master) {
        if (catalogProduct.variationModel && catalogProduct.variationModel.variants.length > 0) {
            return catalogProduct.variationModel.variants.toArray();
        }

        if (catalogProduct.variants && catalogProduct.variants.length > 0) {
            return catalogProduct.variants.toArray();
        }
    }

    if (
        catalogProduct.variationGroup &&
        catalogProduct.variants &&
        catalogProduct.variants.length > 0
    ) {
        return catalogProduct.variants.toArray();
    }

    return [catalogProduct];
}

function getVariantTitle(variant) {
    if (!variant) {
        return '';
    }

    var variationModel = variant.variationModel;
    if (!variationModel) {
        return variant.name || '';
    }

    var variationAttrs = variationModel.getProductVariationAttributes();
    if (!variationAttrs || !variationAttrs.length) {
        return variant.name || '';
    }

    var parts = [];

    for (var i = 0; i < variationAttrs.length; i++) {
        var attribute = variationAttrs[i];
        var selectedValue = variationModel.getSelectedValue(attribute);

        if (selectedValue && selectedValue.displayValue) {
            parts.push(selectedValue.displayValue);
        }
    }

    if (parts.length > 0) {
        return parts.join(' / ');
    }

    return variant.name || '';
}

function getProductImageUrl(product) {
    try {
        var productImage = product.getImage(klaviyoUtils.KLImageSize);
        if (productImage) {
            return productImage.getAbsURL().toString();
        }
    } catch (imageError) {}

    return null;
}

function buildVariant(variant, currencyCode) {
    var viewedProductHelpers = require('*/cartridge/scripts/klaviyo/viewedProductHelpers');
    var prices = viewedProductHelpers.getProductPrices(variant);

    return {
        id: variant.ID,
        title: getVariantTitle(variant),
        price: String(prices.price),
        priceString: prices.priceString,
        currency: currencyCode,
        availableForSale: variant.availabilityModel ? variant.availabilityModel.isInStock() : true,
        imageUrl: getProductImageUrl(variant)
    };
}

/**
 * Product payload for the current product detail page.
 */
function buildActiveProduct(productId) {
    if (!productId) {
        return null;
    }

    try {
        var viewedProduct = ProductMgr.getProduct(productId);
        if (!viewedProduct) {
            return null;
        }

        // Variation-group PDPs must keep the group as catalog identity.
        // getParentProduct walks to the master when klaviyo_use_variation_group_id
        // is off, which would set the wrong id and include every master variant.
        var catalogProduct = viewedProduct.variationGroup
            ? viewedProduct
            : (klaviyoUtils.getParentProduct(viewedProduct) || viewedProduct);
        var currencyCode = session.getCurrency().getCurrencyCode();
        var category = '';

        if (catalogProduct.primaryCategory) {
            category = catalogProduct.primaryCategory.displayName;
        }

        var variantProducts = getVariantProducts(catalogProduct);
        var variants = [];
        var variantLimit = Math.min(variantProducts.length, MAX_VARIANTS);

        for (var i = 0; i < variantLimit; i++) {
            variants.push(buildVariant(variantProducts[i], currencyCode));
        }

        return {
            name: catalogProduct.name,
            category: category,
            imageUrl: getProductImageUrl(catalogProduct) || '',
            id: catalogProduct.ID,
            link: URLUtils.https('Product-Show', 'pid', viewedProduct.ID).toString(),
            variants: variants
        };
    } catch (e) {
        return null;
    }
}

module.exports = {
    buildActiveProduct: buildActiveProduct
};
