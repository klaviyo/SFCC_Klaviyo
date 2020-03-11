'use strict';

/* API Includes */
var productMgr = require('dw/catalog/ProductMgr');
var orderMgr = require('dw/order/OrderMgr');
var basketMgr = require('dw/order/BasketMgr');

var buildDataLayer = function () {
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
            currentBasket = basketMgr.getCurrentBasket();
            basketHasLength = currentBasket.getProductLineItems().toArray().length >= 1;

            if (basketHasLength) {
                KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
                klData = KlaviyoUtils.prepareCheckoutEventForKlaviyo(currentBasket);
            }
        }

        // Order Placed Event
        if (pageContext == 'orderconfirmation' && orderID) {
            KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');

            if (!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_order_transactional_enabled')) {
                return;
            }
            currentOrder = orderMgr.getOrder(orderID);
            KlaviyoUtils.prepareOrderConfirmationEventForKlaviyo(currentOrder);
        }


        // Viewed Product event
        if (!empty(pageProductID.rawValue)) {
            viewedProduct = productMgr.getProduct(pageProductID);
            KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
            klData = KlaviyoUtils.prepareViewedProductEventData(pageProductID, viewedProduct);
        }

        // Category Viewed event
        if (!empty(pageCategoryId)) {
            klData.event = 'Viewed Category';
            klData.pageCategoryId = pageCategoryId;
        }

        // Site Search event
        if (!empty(searchTerm)) {
            klData.event = 'Site Search';
            klData.searchTerm = searchTerm;
            klData.searchResultsCount = (!empty(searchResultsCount)) ? searchResultsCount.value : 0;
        }
    } catch (e) {
        klData.data.debug_error = [e.message, e.lineNumber];
    }

    return klData;
};

var buildCartDataLayer = function () {
    var klData = {};
    var isValidBasket,
        basketHasLength,
        KlaviyoUtils;

    isValidBasket = (basketMgr.getCurrentBasket());
    if (isValidBasket) {
        basketHasLength = (basketMgr.getCurrentBasket().getProductLineItems().toArray().length >= 1);
    }

    if (basketHasLength) {
        KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/KlaviyoUtils');
        klData = KlaviyoUtils.prepareAddToCartEventForKlaviyo(klData);
    }

    return klData;
};

/**
 * Creating page context from the request path
 * @returns context
 */
var getContext = function () {
    var path = request.httpPath;
    var parts = path.split('/');
    var context = null;
    if (parts[parts.length - 1] == 'Checkout-Begin') {
        context = 'checkout';
    }
    return context;
};


/** Testable functions **/

module.exports = {
    buildDataLayer     : buildDataLayer,
    buildCartDataLayer : buildCartDataLayer,
    getContext         : getContext
};
