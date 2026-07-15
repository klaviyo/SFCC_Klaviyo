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
 * Product payload for the current product detail page (window.customerHub.activeProduct).
 * Identity comes from getParentProduct (master by default; variation group when
 * klaviyo_use_variation_group_id is on). Variants always come from the master when
 * one exists, so the list matches SFRA PDPs that expose the full color/size matrix.
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

        var catalogProduct = klaviyoUtils.getParentProduct(viewedProduct) || viewedProduct;
        // Prefer the master for variant options when the parent is a variation group.
        var variantSourceProduct = (catalogProduct.variationGroup && catalogProduct.masterProduct)
            ? catalogProduct.masterProduct
            : catalogProduct;
        var currencyCode = session.getCurrency().getCurrencyCode();
        var category = '';

        if (catalogProduct.primaryCategory) {
            category = catalogProduct.primaryCategory.displayName;
        } else if (variantSourceProduct.primaryCategory) {
            category = variantSourceProduct.primaryCategory.displayName;
        }

        var variantProducts = getVariantProducts(variantSourceProduct);
        var variants = [];
        var variantLimit = Math.min(variantProducts.length, MAX_VARIANTS);

        for (var i = 0; i < variantLimit; i++) {
            variants.push(buildVariant(variantProducts[i], currencyCode));
        }

        return {
            name: catalogProduct.name,
            category: category,
            imageUrl: getProductImageUrl(catalogProduct) || getProductImageUrl(variantSourceProduct) || '',
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
