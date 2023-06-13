'use strict';

var server = require('server');

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
var recreateCartHelpers = require('*/cartridge/scripts/klaviyo/recreateCartHelpers');

/* Models */
var CartModel = require('*/cartridge/models/cart');


/**
 * KL RECREATE CART (SFRA)
 * KlaviyoRecreate-Cart : The KlaviyoRecreate-Cart route rebuilds a cart page based on a query containing an ENCODED array of objects with product IDs, product quanty,
 * and the product's selected options within URL / endpoint. This controller will decode the encoded array of objects, and process and organize the data of each product to capture expected values.
 * The controller then creates a new transaction by leveraging core SFCC patterns & functions, so items are added in a similar OOTB flow as when clicking the Add to Cart button on a PDP.
 *
 * A query would be structured as:  * <baseURL>/Cart-Recreate?items=[{ "productID": string, "quantity": number, "options": [{optionObj}] }]
 * Verbose view of the DECODED structure:  <baseURL>/Cart-Recreate?items=[{ "productID": ProdID, "quantity": QTY, "options": [{'Line Item Text': text, 'Option ID': string, 'Option Value ID': string, 'Option Price': formattedString, 'Option Price Value': number}] }]
 *
 * Note: Three values in the optionObj are needed for the KL RECREATE CART ('Line Item Text', 'Option ID' and 'Option Value ID').
 * The other two values in the optionObj ('Option Price' and 'Option Price Value') are only used for KL EVENT TRACKING when the recreate cart link is constructed in startedCheckout.js.
 * @function
 * @memberof Cart
 * @param {querystringparameter} - items - JSON containing product Ids, qty, childProducts, options
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Cart', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core KlaviyoRecreate.js');
    try {
        var items = req.querystring.items ? JSON.parse(StringUtils.decodeBase64(req.querystring.items)) : null;
    } catch (error) {
        res.setStatusCode(500);
        logger.error('KlaviyoRecreate-Cart failed. Please check the encoded obj for unexpected chars or syntax issues. ERROR: {0} {1}', error.message, error.stack);

        res.render('error', {
            error   : true,
            message : Resource.msg('rebuildcart.message.error.general', 'klaviyo_error', null)
        });
        return next();
    }

    if (!currentBasket) {
        res.setStatusCode(500);
        logger.error(`KlaviyoRecreate-Cart controller failed to create a cart Obj. The currentBasket is ${currentBasket}.`);
    }

    // Clean the basket to prevent product duplication on page refresh
    if (currentBasket && currentBasket.productQuantityTotal > 0) {
        recreateCartHelpers.clearCart(currentBasket);
    }

    try {
        Transaction.wrap(function () {
            if (items && items.length) {
                for (var i = 0; i < items.length; i++) {
                    var productToAdd = ProductMgr.getProduct(items[i].productID);
                    if (!productToAdd) {
                        throw new Error('Product with ID [' + items[i].productID + '] not found');
                    }
                    var childProducts = productToAdd.bundledProducts ? collections.map(productToAdd.bundledProducts, function (product) { return { pid: product.ID, quantity: null }; }) : [];
                    var options = [];
                    // eslint-disable-next-line
                    items[i].options.forEach(optionObj => {
                        // Here we use the three key values needed for the KL RECREATE CART to properly use and select the same product options when recreating the cart. These options are the
                        // same as what the customer selected when shopping. This data is then passed to the OOTB cartHelpers.addProductToCart function below to add the selected product option as expected.
                        // Special Note: 'Option Price' & 'Option Price Value') are not needed for this logic. Those values are only used for KL EVENT TRACKING when the cart rebuilding link is created.
                        options.push({ lineItemText: optionObj['Line Item Text'], optionId: optionObj['Option ID'], selectedValueId: optionObj['Option Value ID'] });
                    });

                    for (var key in currentBasket.shipments) {
                        shippingHelper.ensureShipmentHasMethod(currentBasket.shipments[key]);
                    }
                    cartHelpers.addProductToCart(currentBasket, items[i].productID, items[i].quantity, childProducts, options);
                }
                COHelpers.recalculateBasket(currentBasket);
            }

            var basketModel = new CartModel(currentBasket);
            res.render('cart/cart', basketModel);
        });
    } catch (error) {
        res.setStatusCode(500);
        logger.error('Transaction failed in KlaviyoRecreate-Cart controller. ERROR: {0} {1}', error.message, error.stack);

        res.render('error', {
            error   : true,
            message : Resource.msg('rebuildcart.message.error.general', 'klaviyo_error', null)
        });
    }
    next();
});


module.exports = server.exports();
