'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

var MAX_VARIANTS = 100;

function moveVariantToFront(variants, selectedProductId) {
    if (!selectedProductId || variants.length <= 1) {
        return variants;
    }

    var selectedIndex = -1;

    for (var i = 0; i < variants.length; i++) {
        if (variants[i].id === selectedProductId) {
            selectedIndex = i;
            break;
        }
    }

    if (selectedIndex <= 0) {
        return variants;
    }

    var reorderedVariants = variants.slice();
    var selectedVariant = reorderedVariants.splice(selectedIndex, 1)[0];
    reorderedVariants.unshift(selectedVariant);

    return reorderedVariants;
}

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

function buildVariant(variant, currencyCode) {
    var viewedProductHelpers = require('*/cartridge/scripts/klaviyo/viewedProductHelpers');
    var prices = viewedProductHelpers.getProductPrices(variant);
    var variantImageUrl = null;

    try {
        var variantImage = variant.getImage(klaviyoUtils.KLImageSize);
        if (variantImage) {
            variantImageUrl = variantImage.getAbsURL().toString();
        }
    } catch (imageError) {}

    return {
        id: variant.ID,
        title: getVariantTitle(variant),
        price: String(prices.price),
        priceString: prices.priceString,
        currency: currencyCode,
        availableForSale: variant.availabilityModel ? variant.availabilityModel.isInStock() : true,
        imageUrl: variantImageUrl
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

        var catalogProduct = klaviyoUtils.getParentProduct(viewedProduct) || viewedProduct;
        var currencyCode = session.getCurrency().getCurrencyCode();
        var category = '';

        if (catalogProduct.primaryCategory) {
            category = catalogProduct.primaryCategory.displayName;
        }

        var imageUrl = '';
        try {
            var productImage = catalogProduct.getImage(klaviyoUtils.KLImageSize);
            if (productImage) {
                imageUrl = productImage.getAbsURL().toString();
            }
        } catch (productImageError) {}

        var variantProducts = getVariantProducts(catalogProduct);
        var variants = [];
        var variantLimit = Math.min(variantProducts.length, MAX_VARIANTS);

        for (var i = 0; i < variantLimit; i++) {
            variants.push(buildVariant(variantProducts[i], currencyCode));
        }

        variants = moveVariantToFront(variants, viewedProduct.ID);

        return {
            name: catalogProduct.name,
            category: category,
            imageUrl: imageUrl,
            id: catalogProduct.ID,
            link: URLUtils.https('Product-Show', 'pid', catalogProduct.ID).toString(),
            variants: variants
        };
    } catch (e) {
        return null;
    }
}

module.exports = {
    buildActiveProduct: buildActiveProduct
};
