'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;
var siteId = klaviyoUtils.siteId;


// prepares data for "Started Checkout" event
function getData(currentBasket) {
    var data;
    try {
        data = {};
        klaviyoUtils.setSiteIdAndIntegrationInfo(data, siteId);
        var basketItems = currentBasket.getProductLineItems().toArray();
        var reconstructCartItems = [];
        data['Basket Gross Price'] = currentBasket.getTotalGrossPrice().value;
        data['value'] = currentBasket.getTotalGrossPrice().value; // duplicative, will be pulled to top-level event field during event creation
        data['value_currency'] = session.getCurrency().getCurrencyCode(); // will be pulled to top-level event field during event creation
        data['Item Count'] = basketItems.length;

        // prepare to add top-level data while iterating through product line items
        data.line_items = [];
        data.Categories = [];
        data.Items = [];
        data.$email = currentBasket.customerEmail;
        data.cartRebuildingLink = URLUtils.abs('KlaviyoRecreate-Cart').toString() + '?items=';

        for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
            var lineItem = basketItems[itemIndex];
            var currentProductID = lineItem.productID;
            var basketProduct = ProductMgr.getProduct(currentProductID);
            if (!basketProduct) {
                throw new Error('Product with ID [' + currentProductID + '] not found');
            }
            var parentProduct = klaviyoUtils.getParentProduct(basketProduct);
            var quantity = lineItem.quantityValue;
            var options = lineItem && lineItem.optionProductLineItems ? klaviyoUtils.captureProductOptions(lineItem.optionProductLineItems) : null;

            if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
                var productObj = prepareProductObj(lineItem, basketProduct, currentProductID, parentProduct);

                if (basketProduct.variant) {
                    productObj['Master Product ID'] = parentProduct ? parentProduct.ID : null;
                }

                if (options && options.length) {
                    productObj['Product Options'] = options;
                }

                if (lineItem.bundledProductLineItem || lineItem.bundledProductLineItems.length) {
                    var prodBundle = klaviyoUtils.captureProductBundles(lineItem.bundledProductLineItems);
                    productObj['Is Product Bundle'] = prodBundle.isProdBundle;
                    productObj['Bundled Product IDs'] = prodBundle.prodBundleIDs;
                }

                // add top-level data for the event for segmenting, etc.
                data.line_items.push(productObj);
                data.Categories.push.apply(data.Categories, data.line_items[itemIndex].Categories);
                data.Categories = klaviyoUtils.dedupeArray(data.Categories);
                data.Items.push(data.line_items[itemIndex]['Product Name']);

                // Exclude bonus products from reconstructCartItems array (Note: This excludes bonus products from being included in the cart rebuilding link))
                if (!lineItem.bonusProductLineItem) {
                    reconstructCartItems.push({ productID: currentProductID, quantity: quantity, options: options });
                }
            }
        }

        data.cartRebuildingLink += StringUtils.encodeBase64(JSON.stringify(reconstructCartItems));
    } catch (e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core startedCheckout.js');
        logger.error('startedCheckout.getData() failed to create data object: ' + e.message + ' ' + e.stack);
    }
    return data;
}


function prepareProductObj(lineItem, basketProduct, currentProductID, parentProduct) {
    var productObj = {};
    if (lineItem.bonusProductLineItem) {
        var bonusProduct = klaviyoUtils.captureBonusProduct(lineItem, basketProduct);
        productObj['Is Bonus Product'] = bonusProduct.isbonusProduct;
        productObj['Original Price'] = bonusProduct.originalPrice;
        productObj['Original Price Value'] = bonusProduct.originalPriceValue;
        productObj['Price'] = bonusProduct.price;
        productObj['Price Value'] = bonusProduct.priceValue;
    } else {
        var lineItemPriceData = klaviyoUtils.priceCheck(lineItem, basketProduct);
        productObj['Price'] = lineItemPriceData.purchasePrice;
        productObj['Price Value'] = lineItemPriceData.purchasePriceValue;
        productObj['Original Price'] = lineItemPriceData.originalPrice;
        productObj['Original Price Value'] = lineItemPriceData.originalPriceValue;
    }

    productObj['Product ID'] = currentProductID;
    productObj['Product Name'] = basketProduct.name;
    productObj['Product Image URL'] = KLImageSize ? basketProduct.getImage(KLImageSize).getAbsURL().toString() : null;
    productObj['Product Description'] = basketProduct.pageDescription ? basketProduct.pageDescription.toString() : null;
    productObj['Product Page URL'] = URLUtils.https('Product-Show', 'pid', currentProductID).toString();
    productObj['Product UPC'] = basketProduct.UPC;
    productObj['Product Availability Model'] = basketProduct.availabilityModel.availability;

    var categories = [];
    if (parentProduct) {
        // parentProduct can only be null if the klaviyo_use_variation_group_id site preference is enabled and the product has no variation groups
        for (var i = 0, len = parentProduct.categoryAssignments.length; i < len; i++) {
            categories.push(parentProduct.categoryAssignments[i].category.displayName);
        }
    }

    productObj.Categories = categories;
    return productObj;
}


module.exports = {
    getData: getData
};
