'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;
var siteId = klaviyoUtils.siteId;

// prepares data for "Added to Cart" event
function getData(basket) {
    var data;

    try {
        data = {};
        var basketItems = basket.getProductLineItems().toArray();
        klaviyoUtils.setSiteIdAndIntegrationInfo(data, siteId);
        data.event = klaviyoUtils.EVENT_NAMES.addedToCart;
        data.basketGross = basket.getTotalGrossPrice().getValue().valueOf();
        data.value = basket.getTotalGrossPrice().getValue().valueOf(); // duplicative but we will attempt to pop this out to the top-level value property
        data.value_currency = session.getCurrency().getCurrencyCode();
        data.itemCount = basketItems.length;
        data.lineItems = [];
        data.items = [];
        data.categories = [];
        data.primaryCategories = [];
        data.productAddedToCart = {};

        for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
            var lineItem = basketItems[itemIndex];
            var currentProductID = lineItem.productID;
            var basketProduct = ProductMgr.getProduct(currentProductID);
            var parentProduct = klaviyoUtils.getParentProduct(basketProduct);

            if (!basketProduct) {
                throw new Error('Product with ID [' + currentProductID + '] not found');
            }

            if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
                var primaryCategory;
                var categories = [];
                if (parentProduct) {
                    primaryCategory = parentProduct.primaryCategory ? parentProduct.primaryCategory.displayName : '';
                    if (parentProduct.categoryAssignments) {
                        for (var i = 0, len = parentProduct.categoryAssignments.length; i < len; i++) {
                            categories.push(parentProduct.categoryAssignments[i].category.displayName);
                        }
                    }
                }
                var selectedOptions;

                var imageSizeOfProduct = null;
                if (KLImageSize && basketProduct.getImage(KLImageSize)) {
                    imageSizeOfProduct = basketProduct.getImage(KLImageSize).getAbsURL().toString();
                }


                var currentLineItem = {
                    productID                 : currentProductID,
                    productName               : basketProduct.name,
                    productImageURL           : imageSizeOfProduct,
                    productPageURL            : URLUtils.https('Product-Show', 'pid', currentProductID).toString(),
                    productUPC                : basketProduct.UPC,
                    viewedProductAvailability : basketProduct.availabilityModel.availability,
                    categories                : categories,
                    primaryCategory           : primaryCategory
                };

                if (basketProduct.variant) {
                    currentLineItem.masterProductID = parentProduct ? parentProduct.ID : null;
                }


                var priceData = klaviyoUtils.priceCheck(lineItem, basketProduct);
                currentLineItem.price = priceData.purchasePrice;
                currentLineItem.priceValue = priceData.purchasePriceValue;
                currentLineItem.originalPrice = priceData.originalPrice;
                currentLineItem.originalPriceValue = priceData.originalPriceValue;

                selectedOptions = lineItem && lineItem.optionProductLineItems ? klaviyoUtils.captureProductOptions(lineItem.optionProductLineItems) : null;
                if (selectedOptions && selectedOptions.length) {
                    currentLineItem.productOptions = selectedOptions;
                }

                if (lineItem.bundledProductLineItem || lineItem.bundledProductLineItems.length) {
                    var prodBundle = klaviyoUtils.captureProductBundles(lineItem.bundledProductLineItems);
                    currentLineItem['Is Product Bundle'] = prodBundle.isProdBundle;
                    currentLineItem['Bundled Product IDs'] = prodBundle.prodBundleIDs;
                }

                if (lineItem.bonusProductLineItem) {
                    currentLineItem['Is Bonus Product'] = true;
                }

                data.lineItems.push(currentLineItem);
                data.items.push(basketProduct.name);
                data.categories.push.apply(
                    data.categories,
                    data.lineItems[itemIndex].categories
                );
                data.primaryCategories.push(
                    data.lineItems[itemIndex].primaryCategory
                );
                data.categories = klaviyoUtils.dedupeArray(data.categories);
                data.primaryCategories = klaviyoUtils.dedupeArray(data.primaryCategories);
            }
        }

        // Item added to the cart in this event
        // Bonus products can occasionally appear as final item in the cart. We exclude these from the line items to accurately track the item added to cart in this event.
        for (var idx = data.lineItems.length - 1; idx >= 0; idx--) {
            if (!data.lineItems[idx]['Is Bonus Product']) {
                data.productAddedToCart = data.lineItems[idx];

                // Duplicating to top-level for segmentation
                data.productID = data.productAddedToCart.productID;
                data.masterProductID = data.productAddedToCart.masterProductID;
                data.price = data.productAddedToCart.priceValue;
                data.productName = data.productAddedToCart.productName;
                break;
            }
        }
    } catch (e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core addedToCart.js');
        logger.error('addedToCart.getData() failed to create data object: ' + e.message + ' ' + e.stack);
    }

    return data;
}


module.exports = {
    getData: getData
};
