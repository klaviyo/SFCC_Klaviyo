'use strict';

var server = require('server');

/* Script Modules */
var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');

/* Models */
var CartModel = require('*/cartridge/models/cart');

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');


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
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    try {
        var items = req.querystring.items ? JSON.parse(StringUtils.decodeBase64(req.querystring.items)) : null;
    } catch (error) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: `ERROR - ${error.message}. Please check the encoded obj for any unexpected chars or syntax issues.`,
        });
        return next();
    }

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: `ERROR - Current Basket is: ${currentBasket}. Please check the Current Basket and try again.`,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    };

    // Clean the basket to prevent product duplication on page refresh
    if (currentBasket && currentBasket.productQuantityTotal > 0) {
        for (let i = 0; i < currentBasket.productLineItems.length; i++) {
            let lengthAtIteration = currentBasket.productLineItems.length;
            var shipmentToRemove = currentBasket.productLineItems[i].shipment;
            currentBasket.removeProductLineItem(currentBasket.productLineItems[i]);
            currentBasket.updateTotals();
            if (currentBasket.productLineItems.length < lengthAtIteration) {
                i--;
            }

            if (shipmentToRemove.productLineItems.length && !shipmentToRemove.default) {
                currentBasket.removeShipment(shipmentToRemove);
            }
            PromotionMgr.applyDiscounts(currentBasket);
        }
    }

    Transaction.wrap(function () {
        if (items && items.length) {
            for (let i = 0; i < items.length; i++) {
                var productToAdd = ProductMgr.getProduct(items[i].productID);
                var childProducts = productToAdd.bundledProducts ? collections.map(productToAdd.bundledProducts, function (product) { return { pid: product.ID, quantity: null } }) : [];
                var options = [];
                items[i].options.forEach(optionObj => {
                    options.push({ lineItemText: optionObj.lineItemText, optionId: optionObj.optionID, selectedValueId: optionObj.optionValueID});
                })

                var shipments = Array.from(currentBasket.shipments);
                shippingHelper.ensureShipmentHasMethod(shipments[0]);
                cartHelpers.addProductToCart(currentBasket, items[i].productID, items[i].quantity, childProducts, options);
            }
            COHelpers.recalculateBasket(currentBasket);
        }

        var basketModel = new CartModel(currentBasket);
        res.render('cart/cart', basketModel);
    })
    next();
});

module.exports = server.exports();
