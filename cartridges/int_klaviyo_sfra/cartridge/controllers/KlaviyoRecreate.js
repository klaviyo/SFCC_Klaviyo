'use strict';

var server = require('server');
var basketMgr = require('dw/order/BasketMgr');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var addedToCartData = require('*/cartridge/scripts/klaviyo/eventData/addedToCart');
var Transaction = require('dw/system/Transaction');
var CartModel = require('*/cartridge/models/cart');
var StringUtils = require('dw/util/StringUtils');
var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var collections = require('*/cartridge/scripts/util/collections');
var ProductMgr = require('dw/catalog/ProductMgr');


/**
 * KlaviyoRecreate-Cart : The KlaviyoRecreate-Cart route rebuilds a cart page based on a query containing an ENCODED array of objects with product IDs, product quanty, the product's selected options within URL / endpoint.
 * A DECODED query would be structured as:  <baseURL>/Cart-Recreate?items=[ {"productID": ProdID, "quantity": QTY, "options": [ {lineItemText, optionID, optionValueID} ]} ]
 * @function
 * @memberof Cart
 * @param {querystringparameter} - items - JSON containing product Ids, qty, childProducts, options
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Cart', function (req, res, next) {
    var items = JSON.parse(StringUtils.decodeBase64(req.querystring.items));
    var currentBasket = basketMgr.getCurrentOrNewBasket();

    // TODO: Delete following debugging comment regarding basketMgr
    // basketMgr.deleteBasket(currentBasket) // ERROR: user not authorized to act on behalf of customer (NOTE: Only customer service can call this method)

    // Clean the basket to prevent product duplication on page refresh
    if (currentBasket && currentBasket.productQuantityTotal > 0) {
        for (let i = 0; i < currentBasket.productLineItems.length; i++) {
            // TODO: Delete following debugging comment about lengthAtIteration variable
            // Note current iterative length brefore anything is deleted from productLineItems.
            let lengthAtIteration = currentBasket.productLineItems.length;
            var shipmentToRemove = currentBasket.productLineItems[i].shipment;
            currentBasket.removeProductLineItem(currentBasket.productLineItems[i]);
            currentBasket.updateTotals(); // update totals after removing the line item.
            if (currentBasket.productLineItems.length < lengthAtIteration) {
                // TODO: Delete following debugging comment regarding decrementing index
                // decrement index by one to account for the productLineItems array shortening by one.
                i--;
            }

            if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                currentBasket.removeShipment(shipmentToRemove);
            }
            PromotionMgr.applyDiscounts(currentBasket);
        }
    }

    // Transaction.begin();

    Transaction.wrap(function () {
        if (items && items.length) {
            for (let i = 0; i < items.length; i++) {
                var currItem = items[i];
                var productToAdd = ProductMgr.getProduct(items[i].productID);
                var childProducts = productToAdd.bundledProducts ? collections.map(productToAdd.bundledProducts, function (product) { return { pid: product.ID, quantity: null } }) : []; // TODO: need to identify what quantity would be...
                var options = []; // TODO: need to identify what this would be...(ex: options from TVs that have warranties? How to include?)
                for (let j = 0; j < currItem.options.length; j++) {
                    options.push({
                        lineItemText: currItem.options[j].lineItemText,
                        optionId: currItem.options[j].optionID,
                        selectedValueId: currItem.options[j].optionValueID
                    })
                }
                // TODO: Delete following debugging comment related to addProductToCart call
                // in here...could call add to cart again for each item....based on query values...
                cartHelpers.addProductToCart(currentBasket, items[i].productID, items[i].quantity, childProducts, options)
            }
        }

        var basketModel = new CartModel(currentBasket);
        res.render('cart/cart', basketModel);
    })
    next();
});

module.exports = server.exports();
