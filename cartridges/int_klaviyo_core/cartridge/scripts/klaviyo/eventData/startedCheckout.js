'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;
var StringUtils = require('dw/util/StringUtils');

// prepares data for "Started Checkout" event
function getData(currentBasket) {

    // TODO: analyze line-by-line.  currently pulled straight from previous cartridge prepareCheckoutEventForKlaviyo function

    var data = {};
    var basketItems = currentBasket.getProductLineItems().toArray();
    var reconstructCartItems = [];
    // Create some top-level event data
    // data.event = EVENT_NAMES['startedCheckout'];
    data['Basket Gross Price'] = currentBasket.getTotalGrossPrice().value;
    data['Item Count'] = basketItems.length;

    // prepare to add top-level data while iterating through product line items
    data.line_items = [];
    data.Categories = [];
    data.Items = [];
    data.$email = currentBasket.customerEmail;
    data.cartRebuildingLink = URLUtils.abs('KlaviyoRecreate-Cart').toString() + `?items=${reconstructCartItems}`;

    for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
        var lineItem = basketItems[itemIndex];
        var currentProductID = lineItem.productID;
        var basketProduct = ProductMgr.getProduct(currentProductID);
        var quantity = lineItem.quantityValue;
        var options = []; // TODO: confirm working in SiteGen as is functional in SFRA on recreated cart page.
        if (lineItem && lineItem.optionProductLineItems) {
            for (let i = 0; i < lineItem.optionProductLineItems.length; i++){
                let currOption = lineItem.optionProductLineItems[i];
                options.push({optionID: lineItem.optionProductLineItems[i].optionID, optionValueID: lineItem.optionProductLineItems[i].optionValueID, lineItemText: lineItem.optionProductLineItems[i].lineItemText})
            }
        }

        if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
            var productObj = prepareProductObj( lineItem, basketProduct, currentProductID );

            // add top-level data for the event for segmenting, etc.
            data.line_items.push(productObj);
            data.Categories.push.apply(data.Categories, data.line_items[itemIndex].Categories);
            data.Items.push(data.line_items[itemIndex]['Product Name']);

            reconstructCartItems.push({ productID: currentProductID, quantity, options });
        }
    }

    data.cartRebuildingLink += StringUtils.encodeBase64(JSON.stringify(reconstructCartItems)); // add the encoded array containing products to the query string
    return data;
}


// TODO: this is called in one location... can it just be inlined?
function prepareProductObj(lineItem, basketProduct, currentProductID) {
    var productObj = {};
    productObj['Product ID'] = currentProductID;
    productObj['Product Name'] = basketProduct.name;
    productObj['Product Image URL'] = KLImageSize ? basketProduct.getImage(KLImageSize).getAbsURL().toString() : null;
    productObj.Price = dw.util.StringUtils.formatMoney( dw.value.Money( basketProduct.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode() ) );
    productObj['Product Description'] = basketProduct.pageDescription ? basketProduct.pageDescription.toString() : null;
    productObj['Product Page URL'] = URLUtils.https('Product-Show', 'pid', currentProductID).toString();
    productObj['Product UPC'] = basketProduct.UPC;
    productObj['Product Availability Model'] = basketProduct.availabilityModel.availability;

    var categories = [];
    var catProduct = (basketProduct.variant) ? basketProduct.masterProduct : basketProduct; // from orig klav code, always use master for finding cats
    for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
        categories.push(catProduct.categoryAssignments[i].category.displayName);
    }

    productObj.Categories = categories;
    return productObj;
}


module.exports = {
    getData : getData
}