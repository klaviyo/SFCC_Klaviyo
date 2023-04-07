'use strict';

var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;
var StringUtils = require('dw/util/StringUtils');
var collections = require('*/cartridge/scripts/util/collections');


// prepares data for "Added to Cart" event
function getData(basket) {

    // TODO: analyze line-by-line.  currently pulled straight from previous cartridge prepareAddToCartEventForKlaviyo function
    var data = {};
    var basketItems = basket.getProductLineItems().toArray();
    var reconstructCartItems = [];

    data.event = klaviyoUtils.EVENT_NAMES.addedToCart;
    data.basketGross = basket.getTotalGrossPrice().getValue().valueOf();
    data.itemCount = basketItems.length;
    data.lineItems = [];
    data.items = [];
    data.categories = [];
    data.primaryCategories = [];
    data.cartRebuildingLink = URLUtils.abs('Cart-Recreate').toString() + `?items=${reconstructCartItems}`;

    for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
        var lineItem = basketItems[itemIndex];
        var currentProductID = lineItem.productID;
        var basketProduct = ProductMgr.getProduct(currentProductID);
        var quantity = lineItem.quantity.value;
        var basketProductID = basketProduct.ID;
        var childProducts = basketProduct.bundledProducts ? collections.map(basketProduct.bundledProducts, function (product) { return { pid: product.ID, quantity: null } }) : []; // TODO: need to identify what quantity would be...
        var options = []; // TODO: need to identify what this would be...(ex: options from TVs that have warranties? How to include?)

        if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
            var primaryCategory;
            if (basketProduct.variant) {
                primaryCategory = basketProduct.masterProduct.getPrimaryCategory().displayName;
            } else {
                primaryCategory = basketProduct.getPrimaryCategory().displayName;
            }
            var imageSizeOfProduct = null;
            if (KLImageSize && basketProduct.getImage(KLImageSize)) {
                imageSizeOfProduct = basketProduct.getImage(KLImageSize).getAbsURL().toString();
            }

            var categories = [];
            var catProduct = (basketProduct.variant) ? basketProduct.masterProduct : basketProduct; // from orig klav code, always use master for finding cats
            for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
                categories.push(catProduct.categoryAssignments[i].category.displayName);
            }

            reconstructCartItems.push({ productID: basketProductID, quantity, childProducts, options }); //TODO: shorten key names for brevity.

            data.lineItems.push({
                productID       : currentProductID,
                productName     : basketProduct.name,
                productImageURL : imageSizeOfProduct,
                productPageURL  : URLUtils.https('Product-Show', 'pid', currentProductID).toString(),
                price: dw.util.StringUtils.formatMoney(
                    dw.value.Money(
                        basketProduct.getPriceModel().getPrice().value,
                        session.getCurrency().getCurrencyCode()
                    )
                ),
                productUPC                : basketProduct.UPC,
                viewedProductAvailability : basketProduct.availabilityModel.availability,
                categories                : categories, // was createCategories(basketProduct) in orig, check that my output from categories above matches expected output
                primaryCategory           : primaryCategory
            });
            data.items.push(basketProduct.name);
            data.categories.push.apply(
                data.categories,
                data.lineItems[itemIndex].categories
            );
            data.primaryCategories.push(
                data.lineItems[itemIndex].primaryCategory
            );
        }
    }

    data.cartRebuildingLink += StringUtils.encodeBase64(JSON.stringify(reconstructCartItems)); // add the encoded array containing products to the query string
    return data;
}



module.exports = {
    getData : getData
}