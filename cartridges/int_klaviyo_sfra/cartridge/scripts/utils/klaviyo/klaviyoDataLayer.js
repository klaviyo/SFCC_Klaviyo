'use strict';

var Logger = require('dw/system/Logger');

/* API Includes */
var productMgr = require('dw/catalog/ProductMgr');
var orderMgr = require('dw/order/OrderMgr');
var basketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');

var buildDataLayer = function () {
    var logger = Logger.getLogger('Klaviyo', 'SFRA klaviyoDataLayer - buildDataLayer()');
    logger.info('Calling buildDataLayer().');
    var klData = {};
    var pageContext,
        currentBasket,
        basketHasLength,
        currentOrder,
        viewedProduct,
        httpParameterMap,
        pageProductID,
        orderID,
        searchResultsCount,
        searchTerm,
        pageCategoryId,
        KlaviyoUtils;

    klData.data = '';
    klData.data.debug_error = '';

    httpParameterMap = request.httpParameterMap;
    pageContext = httpParameterMap.pagecontexttype;
    pageProductID = httpParameterMap.productid;
    orderID = httpParameterMap.orderno;
    searchResultsCount = httpParameterMap.searchresultscount;
    searchTerm = httpParameterMap.searchterm.value;
    pageCategoryId = httpParameterMap.pagecgid.value;

    try {
        // Checkout Started event
        if (pageContext == 'checkout') {
            logger.info('Building dataLayer for "Started Checkout" event.');
            currentBasket = basketMgr.getCurrentBasket();
            basketHasLength = currentBasket.getProductLineItems().toArray().length >= 1;

            if (basketHasLength) {
                KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
                klData = KlaviyoUtils.prepareCheckoutEventForKlaviyo(currentBasket);
            }
        }

        // Order Confirmation Event
        if (orderID && !empty(orderID.rawValue)) {
            logger.info('Building dataLayer for "Order Confirmation" event.');
            KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
            currentOrder = orderMgr.getOrder(orderID);
            // check to see if the status is new or created
            if (currentOrder.status == 3 || currentOrder.status == 4) {
                KlaviyoUtils.prepareOrderConfirmationEventForKlaviyo(currentOrder);
            }
        }

        // Viewed Product event
        if (!empty(pageProductID.rawValue)) {
            logger.info('Building dataLayer for "Viewed Product" event.');
            viewedProduct = productMgr.getProduct(pageProductID);
            KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
            klData = KlaviyoUtils.prepareViewedProductEventData(pageProductID, viewedProduct);
        }

        // Viewed Category event
        if (!empty(pageCategoryId)) {
            logger.info('Building dataLayer for "Viewed Category" event.');
            klData.event = 'Viewed Category';
            klData.pageCategoryId = pageCategoryId;
        }

        // Searched Site event
        if (!empty(searchTerm)) {
            logger.info('Building dataLayer for "Searched Site" event.');
            klData.event = 'Searched Site';
            klData.searchTerm = searchTerm;
            klData.searchResultsCount = (!empty(searchResultsCount)) ? searchResultsCount.value : 0;
        }
    } catch (e) {
        klData.data.debug_error = [e.message, e.lineNumber];
        logger.debug('Error encountered: ' + klData.data.debug_error);
    }

    return klData;
};


/**
 * Creating page context from the request path
 * @returns context
 */
var getContext = function () {
    var logger = Logger.getLogger('Klaviyo', 'SFRA klaviyoDataLayer - getContext()');
    logger.info('Calling getContext().');
    var path = request.httpPath;
    var parts = path.split('/');
    var context = null;
    if (parts[parts.length - 1] == 'Checkout-Begin') {
        context = 'checkout';
    }
    logger.debug('Context: ' + JSON.stringify(context));
    return context;
};


/** Testable functions **/

module.exports = {
    buildDataLayer     : buildDataLayer,
    getContext         : getContext
};
