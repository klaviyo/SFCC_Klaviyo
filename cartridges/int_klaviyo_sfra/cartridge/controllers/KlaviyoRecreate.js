'use strict';

var server = require('server');

/* Script Modules */
var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
var recreateCartHelpers = require('*/cartridge/scripts/klaviyo/recreateCartHelpers');

/* Models */
var CartModel = require('*/cartridge/models/cart');

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');


/**
 * KlaviyoRecreate-Cart : The KlaviyoRecreate-Cart route rebuilds a cart page based on a query containing an ENCODED array of objects with product IDs, product quanty, the product's selected options within URL / endpoint.
 * A DECODED query would be structured as:  <baseURL>/Cart-Recreate?items=[ {"productID": ProdID, "quantity": QTY, "options": [ {lineItemText, optionID, optionValueID} ]} ]
 * @function
 * @memberof Cart
 * @param {querystringparameter} - items - JSON containing product Ids, qty, childProducts, options
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Cart', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    try {
        var items = req.querystring.items ? JSON.parse(StringUtils.decodeBase64(req.querystring.items)) : null;
    } catch (error) {
        res.setStatusCode(500);
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core KlaviyoRecreate.js');
        logger.error('KlaviyoRecreate-Cart failed. Please check the encoded obj for unexpected chars or syntax issues. ERROR: {0} {1}', error.message, error.stack)

        res.render('error', {
            error: true,
            message: Resource.msgf('rebuildcart.message.error.general', 'klaviyo_error', null, error.message, 'Check the encoded obj for unexpected chars or syntax issues.')
        });
        return next();
    }

    if (!currentBasket) {
        res.setStatusCode(500);
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core KlaviyoRecreate.js');
        logger.error(`KlaviyoRecreate-Cart controller failed to create a cart Obj. The currentBasket is ${currentBasket}.`);
    };

    // Clean the basket to prevent product duplication on page refresh
    if (currentBasket && currentBasket.productQuantityTotal > 0) {
        recreateCartHelpers.clearCart(currentBasket);
    }

    try {
        Transaction.wrap(function () {
            if (items && items.length) {
                for (let i = 0; i < items.length; i++) {
                    var productToAdd = ProductMgr.getProduct(items[i].productID);
                    if (!productToAdd) {
                        throw new Error('Product with ID [' + items[i].productID + '] not found');
                    }
                    var childProducts = productToAdd.bundledProducts ? collections.map(productToAdd.bundledProducts, function (product) { return { pid: product.ID, quantity: null } }) : [];
                    var options = [];
                    items[i].options.forEach(optionObj => {
                        options.push({ lineItemText: optionObj['Line Item Text'], optionId: optionObj['Option ID'], selectedValueId: optionObj['Option Value ID']});
                    })

                    for (let key in currentBasket.shipments) {
                        shippingHelper.ensureShipmentHasMethod(currentBasket.shipments[key]);
                    }
                    cartHelpers.addProductToCart(currentBasket, items[i].productID, items[i].quantity, childProducts, options);
                }
                COHelpers.recalculateBasket(currentBasket);
            }

            var basketModel = new CartModel(currentBasket);
            res.render('cart/cart', basketModel);
        })
    } catch (error) {
        var testError = error;
        res.setStatusCode(500);
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core KlaviyoRecreate.js');
        logger.error('Transaction failed in KlaviyoRecreate-Cart controller. ERROR: {0} {1}', error.message, error.stack)

        res.render('error', {
            error: true,
            message: Resource.msgf('rebuildcart.message.error.transaction', 'klaviyo_error', null, error.message)
        });
    }
    next();
});


module.exports = server.exports();
