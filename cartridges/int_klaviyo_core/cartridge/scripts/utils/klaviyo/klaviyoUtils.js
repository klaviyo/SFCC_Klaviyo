'use strict';

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
var ProductMgr = require('dw/catalog/ProductMgr');


// event name constants
// TODO: currently crossover with WHITELISTED_EVENTS below - square them when answers are found to why WHITELISTED_EVENTS exists

var EVENT_NAMES = {
    'viewedProduct' : 'Viewed Product',
    'viewedCategory' : 'Viewed Category',
    'searchedSite' : 'Searched Site',
    'addedToCart' : 'Added to Cart',
    'startedCheckout' : 'Started Checkout',
    'orderConfirmation' : 'Order Confirmation', // TODO: confirm exact string needed here
    'placedOrder' : 'Placed Order',
    'orderedProduct' : 'Ordered Product'
};



// looks for klaviyo's cookie and if found extracts the exchangeID from it, returning that value
// if the cookie is not found or exchangeID extraction fails, returns false
function getKlaviyoExchangeID() {
    if('__kla_id' in request.httpCookies && !empty(request.httpCookies['__kla_id'])) {
        var kx = JSON.parse(StringUtils.decodeBase64(request.httpCookies['__kla_id'].value)).$exchange_id;
        return (kx && kx != '') ? kx : false;
    }
}

/****
 *
 * DATA ASSEMBLY FUNCTIONS FOR INDIVIDUAL EVENT TYPES
 *
****/

// prepares data for "Viewed Product" event
function viewedProductData(productID) {

    var imageSize = Site.getCurrent().getCustomPreferenceValue('klaviyo_image_size') || 'large';

    var productData = {};

    // product in viewData is flat and doesn't have all data required (to whit, categories)
    var product = ProductMgr.getProduct(productID);


    // copied & adjusted from kl_core klaviyoUtils prepareViewedProductEventData
    productData['Product ID'] = product.ID;
    productData['Product Name'] = product.name;
    productData['Product Page URL'] = URLUtils.https('Product-Show', 'pid', product.ID).toString();
    productData['Product Image URL'] = product.getImage(imageSize).getAbsURL().toString();

    var price = product.getPriceModel().getPrice().getValue();
    if (empty(price) || price <= 0) {
        price = product.getPriceModel().getMinPrice().getValue();
    }
    productData['Price'] = price;

    // verify what klav really wants here, UPC rarely used by SFCC clients
    productData['Product UPC'] = product.UPC;

    var categories = [];
    var catProduct = (product.variant) ? product.masterProduct : product; // from orig klav code, always use master for finding cats
    for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
        categories.push(catProduct.categoryAssignments[i].category.displayName);
    }

    productData['Categories'] = categories;
    productData['Primary Category'] = !empty(product.getPrimaryCategory()) ? product.getPrimaryCategory().displayName : '';

    var klData = {
        data: productData,
        eventType: "track",
        eventName: EVENT_NAMES.viewedProduct
    };

    return klData;
}

// prepares data for "Viewed Category" event
function viewedCategoryData(categoryID) {

    var klData = {
        data: {
            "Viewed Category": categoryID
        },
        eventType: "track",
        eventName: EVENT_NAMES.viewedCategory
    };

    return klData;
}

// prepares data for "Site Searched" event
function searchedSiteData(term, count) {

    var klData = {
        data: {
            "Search Term": term,
            "Search Results Count": count
        },
        eventType: "track",
        eventName: EVENT_NAMES.searchedSite
    };

    return klData;

}

// prepares data for "Added to Cart" event
function addedToCartData(basket) {

    // TODO: analyze line-by-line.  currently pulled straight from previous cartridge prepareAddToCartEventForKlaviyo function
    var klData = {};
    var basketItems = basket.getProductLineItems().toArray();
    var imageSize = Site.getCurrent().getCustomPreferenceValue('klaviyo_image_size') || 'large';

    klData.event = EVENT_NAMES.addedToCart;
    klData.basketGross = basket.getTotalGrossPrice().getValue().valueOf();
    klData.itemCount = basketItems.length;
    klData.lineItems = [];
    klData.items = [];
    klData.categories = [];
    klData.primaryCategories = [];

    for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
        var lineItem = basketItems[itemIndex];
        var currentProductID = lineItem.productID;
        var basketProduct = ProductMgr.getProduct(currentProductID);

        if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
            var primaryCategory;
            if (basketProduct.variant) {
                primaryCategory = basketProduct.masterProduct.getPrimaryCategory().displayName;
            } else {
                primaryCategory = basketProduct.getPrimaryCategory().displayName;
            }
            var imageSizeOfProduct = null;
            if (imageSize && basketProduct.getImage(imageSize)) {
                imageSizeOfProduct = basketProduct.getImage(imageSize).getAbsURL().toString();
            }

            var categories = [];
            var catProduct = (basketProduct.variant) ? basketProduct.masterProduct : basketProduct; // from orig klav code, always use master for finding cats
            for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
                categories.push(catProduct.categoryAssignments[i].category.displayName);
            }

            klData.lineItems.push({
                productID       : currentProductID,
                productName     : basketProduct.name,
                productImageURL : imageSizeOfProduct,
                productPageURL  : require('dw/web/URLUtils').https('Product-Show', 'pid', currentProductID).toString(),
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
            klData.items.push(basketProduct.name);
            klData.categories.push.apply(
                klData.categories,
                klData.lineItems[itemIndex].categories
            );
            klData.primaryCategories.push(
                klData.lineItems[itemIndex].primaryCategory
            );
        }
    }
    return klData;
}


/****
 *
 * END DATA ASSEMBLY FUNCTIONS FOR INDIVIDUAL EVENT TYPES
 *
****/



// TODO: DO WE NEED THIS?
// ALSO: missing Order Confirmation / Order Confirmed
var WHITELISTED_EVENTS = [
    'Searched Site',
    'Viewed Product',
    'Viewed Category',
    'Added to Cart',
    'Started Checkout',
    'Placed Order',
    'Ordered Product'
];

function preparePayload(exchangeID, data, event) {
    Logger.getLogger('Klaviyo', 'Core klaviyoUtils - preparePayload()');
    var jsonData = {};
    jsonData.token = Site.getCurrent().getCustomPreferenceValue('klaviyo_account');
    jsonData.event = event;
    if (WHITELISTED_EVENTS.indexOf(event) > -1) { // TODO: WHAT IS THIS ABOUT?
        jsonData.service = 'demandware';
    }
    var customerProperties = {};
    customerProperties.$exchange_id = exchangeID;
    jsonData.customer_properties = customerProperties;
    jsonData.properties = data;
    jsonData.time = Math.floor(Date.now() / 1000);

    var klaviyoData = JSON.stringify(jsonData);

    return StringUtils.encodeBase64(klaviyoData);
}



function trackEvent(exchangeID, data, event) {
    var requestBody = {};
    var resultObj = {};

    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - trackEvent()');

    if (KlaviyoTrackService == null || empty(exchangeID)) {
        logger.error(
            'trackEvent() failed for exchange_id: ' +
            exchangeID +
        '.'
        );
        return;
    }

    var klaviyoData = preparePayload(exchangeID, data, event);

    KlaviyoTrackService.addParam('data', klaviyoData);

    var result = KlaviyoTrackService.call(requestBody);

    if (result == null) {
        logger.error('Result for track event via Klaviyo returned null.');
        return;
    }

    resultObj = JSON.parse(result.object);

    if (resultObj == 1) {
        logger.info('Track event via Klaviyo is successful.');
    } else {
        logger.error('Track event via Klaviyo failed.');
    }

    return resultObj;

}


// HTTP Services

var KlaviyoTrackService = ServiceRegistry.createService('KlaviyoTrackService', {
    /**
   * Create the service request
   * - Set request method to be the HTTP GET method
   * - Construct request URL
   * - Append the request HTTP query string as a URL parameter
   *
   * @param {dw.svc.HTTPService} svc - HTTP Service instance
   * @param {Object} params - Additional paramaters
   * @returns {void}
   */
    createRequest: function (svc) {
        svc.setRequestMethod('GET'); // TODO: potentially create new site pref to switch between GET and POST
    },
    /**
   * JSON parse the response text and return it in configured retData object
   *
   * @param {dw.svc.HTTPService} svc - HTTP Service instance
   * @param {dw.net.HTTPClient} client - HTTPClient class instance of the current service
   * @returns {Object} retData - Service response object
   */
    parseResponse: function (svc, client) {
        return client.text;
    },

    getRequestLogMessage: function () {
        var reqLogMsg = 'sending klaviyo track payload';
        return reqLogMsg;
    },

    getResponseLogMessage: function () {}
});



module.exports = {
    EVENT_NAMES : EVENT_NAMES,
    getKlaviyoExchangeID : getKlaviyoExchangeID,
    viewedProductData : viewedProductData,
    viewedCategoryData : viewedCategoryData,
    searchedSiteData : searchedSiteData,
    addedToCartData : addedToCartData,
    trackEvent : trackEvent
}