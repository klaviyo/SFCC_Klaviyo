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

function compareVariantTitles(a, b) {
    var titleA = getVariantTitle(a);
    var titleB = getVariantTitle(b);
    if (titleA < titleB) {
        return -1;
    }
    if (titleA > titleB) {
        return 1;
    }
    return 0;
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

function isAvailableForSale(product) {
    if (!product.availabilityModel) {
        return false;
    }

    // SFRA Cart-AddProduct does: inventoryRecord.perpetual with no null check.
    // Site default-in-stock can make isOrderable true even when inventoryRecord
    // is null — that still 500s on ATC, so treat as unavailable.
    if (!product.bundle && !product.availabilityModel.inventoryRecord) {
        return false;
    }

    return product.availabilityModel.isOrderable(1);
}

function buildVariant(variant, currencyCode) {
    var viewedProductHelpers = require('*/cartridge/scripts/klaviyo/viewedProductHelpers');
    var price = '';
    var priceString = '';

    try {
        var prices = viewedProductHelpers.getProductPrices(variant);
        if (prices && prices.price != null && prices.price !== '') {
            price = String(prices.price);
        }
        if (prices && prices.priceString) {
            priceString = prices.priceString;
        }
    } catch (priceError) {
        // Leave blank — do not invent a $0 display value when SFRA price helpers fail.
    }

    return {
        id: variant.ID,
        title: getVariantTitle(variant),
        price: price,
        priceString: priceString,
        currency: currencyCode,
        availableForSale: isAvailableForSale(variant),
        imageUrl: getProductImageUrl(variant)
    };
}

/**
 * Product payload for the current product detail page (window.customerHub.activeProduct).
 * Identity via getParentProduct (same as Viewed Product events). Variants from the
 * viewed product's variation master so the selector matches the SFRA PDP matrix.
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

        var catalogProduct;
        var variantSourceProduct;

        // Only variation products need getParentProduct / masterProduct. Bundles, sets,
        // and standalones use the viewed product as-is (masterProduct access can throw).
        if (
            viewedProduct.variant ||
            viewedProduct.master ||
            viewedProduct.variationGroup
        ) {
            catalogProduct = klaviyoUtils.getParentProduct(viewedProduct) || viewedProduct;
            variantSourceProduct = viewedProduct.master
                ? viewedProduct
                : (viewedProduct.masterProduct || catalogProduct);
        } else {
            catalogProduct = viewedProduct;
            variantSourceProduct = viewedProduct;
        }

        var currencyCode = session.getCurrency().getCurrencyCode();
        var category = '';

        if (catalogProduct.primaryCategory) {
            category = catalogProduct.primaryCategory.displayName;
        } else if (variantSourceProduct.primaryCategory) {
            category = variantSourceProduct.primaryCategory.displayName;
        }

        var variantProducts = getVariantProducts(variantSourceProduct);
        variantProducts.sort(compareVariantTitles);
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
