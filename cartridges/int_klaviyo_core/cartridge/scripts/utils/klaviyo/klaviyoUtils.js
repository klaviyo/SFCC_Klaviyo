'use strict';

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
var ProductMgr = require('dw/catalog/ProductMgr');


// looks for klaviyo's cookie and if found extracts the exchange_id from it, returning that value
// if the cookie is not found or exchange_id extraction fails, returns false
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
        eventName: "Viewed Product"
    };

    return klData;
}

// prepares data for "Viewed Category" event
function viewedCategoryData(categoryID) {
    var _b = categoryID;
    var foo = 'bar';

    var klData = {
        data: {
            "viewed Category": categoryID
        },
        eventType: "track",
        eventName: "Viewed Product"
    };

    return klData;
}




/****
 *
 * END DATA ASSEMBLY FUNCTIONS FOR INDIVIDUAL EVENT TYPES
 *
****/



// TODO: DO WE NEED THIS?
var WHITELISTED_EVENTS = [
    'Searched Site',
    'Viewed Product',
    'Viewed Category',
    'Added to Cart',
    'Started Checkout',
    'Placed Order',
    'Ordered Product'
];

function preparePayload(exchange_id, data, event) {
    Logger.getLogger('Klaviyo', 'Core klaviyoUtils - preparePayload()');
    var jsonData = {};
    jsonData.token = Site.getCurrent().getCustomPreferenceValue('klaviyo_account');
    jsonData.event = event;
    if (WHITELISTED_EVENTS.indexOf(event) > -1) { // TODO: WHAT IS THIS ABOUT?
        jsonData.service = 'demandware';
    }
    var customerProperties = {};
    customerProperties.$exchange_id = exchange_id;
    jsonData.customer_properties = customerProperties;
    jsonData.properties = data;
    jsonData.time = Math.floor(Date.now() / 1000);

    var klaviyoData = JSON.stringify(jsonData);

    return StringUtils.encodeBase64(klaviyoData);
}



function trackEvent(exchange_id, data, event) {
    var requestBody = {};
    var resultObj = {};

    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - trackEvent()');

    if (KlaviyoTrackService == null || empty(exchange_id)) {
        logger.error(
            'trackEvent() failed for exchange_id: ' +
            exchange_id +
        '.'
        );
        return;
    }

    var klaviyoData = preparePayload(exchange_id, data, event);

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
    getKlaviyoExchangeID : getKlaviyoExchangeID,
    viewedProductData : viewedProductData,
    viewedCategoryData : viewedCategoryData,
    trackEvent : trackEvent
}