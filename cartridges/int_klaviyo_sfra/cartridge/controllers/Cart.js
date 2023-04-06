'use strict';

var server = require('server');
var basketMgr = require('dw/order/BasketMgr');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var addedToCartData = require('*/cartridge/scripts/klaviyo/eventData/addedToCart');
var Transaction = require('dw/system/Transaction');
var CartModel = require('*/cartridge/models/cart');
var StringUtils = require('dw/util/StringUtils');
var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    if(klaviyoUtils.klaviyoEnabled && !klaviyoUtils.getKlaviyoExchangeID()){
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }
    next();
});

server.append('AddProduct', function (req, res, next) {

    if(klaviyoUtils.klaviyoEnabled){

        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, currentBasket;

        if (exchangeID) {
            currentBasket = basketMgr.getCurrentBasket()

            if (currentBasket && currentBasket.getProductLineItems().toArray().length) { //TODO: is there a property for isEmpty on basket object?
                dataObj = addedToCartData.getData(currentBasket);
                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, klaviyoUtils.EVENT_NAMES.addedToCart);
                // TODO: need to do anything here with the service call result, or handle all errs etc within trackEvent? otherwise no need to assign to a var / return a value
            }

        }

    }

    next();
});


/**
 * Cart-Recreate : The Cart-Recreate route rebuilds a cart page based on a query containing JSON with product IDs, product quanty, child products & options within URL / endpoint.
 * proper query should be structured as:  <baseURL>/Cart-Recreate?items=[ {"productID": ProdID, "quantity": QTY, "childProducts": [], "options": []} ]
 * @function
 * @memberof Cart
 * @param {querystringparameter} - items - JSON containing product Ids, qty, childProducts, options
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Recreate', function (req, res, next) {
    var items = JSON.parse(StringUtils.decodeBase64(req.querystring.items));
    var currentBasket = basketMgr.getCurrentOrNewBasket();

    // TODO: Delete following debugging comment regarding basketMgr
    // basketMgr.deleteBasket(currentBasket) // ERROR: user not authorized to act on behalf of customer

    // Clean the basket to prevent product duplication on page refresh
    if (currentBasket && currentBasket.productQuantityTotal > 0) {
        for (let i = 0; i < currentBasket.productLineItems.length; i++) {
            // TODO: Delete following debugging comment about lengthAtIteration variable
            // Note current iterative length brefore anything is deleted from productLineItems.
            let lengthAtIteration = currentBasket.productLineItems.length;
            var shipmentToRemove = currentBasket.productLineItems[i].shipment;
            currentBasket.removeProductLineItem(currentBasket.productLineItems[i]);
            if (currentBasket.productLineItems.length < lengthAtIteration) {
                // TODO: Delete following debugging comment regarding decrementing index
                // decrement index by one to account for the productLineItems array shortening by one.
                i--;
            }

            if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                currentBasket.removeShipment(shipmentToRemove);
            }
        }
    }

    Transaction.wrap(function () {
        if (items && items.length) {
            for (let i = 0; i < items.length; i++) {
                let currProductID = items[i].productID;
                let quanty = items[i].quantity;
                let options = items[i].options;
                // TODO: Delete following debugging comment related to addProductToCart call
                // in here...could call add to cart again for each item....based on query values...
                cartHelpers.addProductToCart(currentBasket, items[i].productID, items[i].quantity, items[i].childProducts, items[i].options)
            }
        }

        var basketModel = new CartModel(currentBasket);
        res.render('cart/cart', basketModel);
    })
    next();
});


module.exports = server.exports();
