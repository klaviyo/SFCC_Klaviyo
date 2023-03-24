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

var imageSize = Site.getCurrent().getCustomPreferenceValue('klaviyo_image_size') || 'large';


// looks for klaviyo's cookie and if found extracts the exchangeID from it, returning that value
// if the cookie is not found or exchangeID extraction fails, returns false
function getKlaviyoExchangeID() {
    if('__kla_id' in request.httpCookies && !empty(request.httpCookies['__kla_id'])) {
        var kx = JSON.parse(StringUtils.decodeBase64(request.httpCookies['__kla_id'].value)).$exchange_id;
        return (kx && kx != '') ? kx : false;
    }
    return false;
}

// gets SFCC profile info (if available) to use for IDing user to klaviyo
function getProfileInfo() {
    if(customer.authenticated && customer.profile) {
        var profileInfo = {
            "$email" : customer.profile.email,
            "$first_name" : customer.profile.firstName,
            "$last_name" : customer.profile.lastName
        };
        profileInfo = JSON.stringify(profileInfo);
        profileInfo = StringUtils.encodeBase64(profileInfo);
        return profileInfo;
    }
    return false;
}

/****
 *
 * DATA ASSEMBLY FUNCTIONS FOR INDIVIDUAL EVENT TYPES
 *
****/

// prepares data for "Viewed Product" event
function viewedProductData(productID) {

    var data = {};

    // product in viewData is flat and doesn't have all data required (to whit, categories)
    var product = ProductMgr.getProduct(productID);


    // copied & adjusted from kl_core klaviyoUtils prepareViewedProductEventData
    data['Product ID'] = product.ID;
    data['Product Name'] = product.name;
    data['Product Page URL'] = URLUtils.https('Product-Show', 'pid', product.ID).toString();
    data['Product Image URL'] = product.getImage(imageSize).getAbsURL().toString();

    var price = product.getPriceModel().getPrice().getValue();
    if (empty(price) || price <= 0) {
        price = product.getPriceModel().getMinPrice().getValue();
    }
    data['Price'] = price;

    // verify what klav really wants here, UPC rarely used by SFCC clients
    data['Product UPC'] = product.UPC;

    var categories = [];
    var catProduct = (product.variant) ? product.masterProduct : product; // from orig klav code, always use master for finding cats
    for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
        categories.push(catProduct.categoryAssignments[i].category.displayName);
    }

    data['Categories'] = categories;
    data['Primary Category'] = !empty(product.getPrimaryCategory()) ? product.getPrimaryCategory().displayName : '';

    return data;
}

// prepares data for "Viewed Category" event
function viewedCategoryData(categoryID) {
    return { "Viewed Category": categoryID }
}

// prepares data for "Searched Site" event
function searchedSiteData(term, count) {
    return {
        "Search Term": term,
        "Search Results Count": count
    }
}

// prepares data for "Added to Cart" event
function addedToCartData(basket) {

    // TODO: analyze line-by-line.  currently pulled straight from previous cartridge prepareAddToCartEventForKlaviyo function
    var data = {};
    var basketItems = basket.getProductLineItems().toArray();

    data.event = EVENT_NAMES.addedToCart;
    data.basketGross = basket.getTotalGrossPrice().getValue().valueOf();
    data.itemCount = basketItems.length;
    data.lineItems = [];
    data.items = [];
    data.categories = [];
    data.primaryCategories = [];

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

            data.lineItems.push({
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
    return data;
}


// prepares data for "Started Checkout" event
function startedCheckoutData(currentBasket) {

    // TODO: analyze line-by-line.  currently pulled straight from previous cartridge prepareCheckoutEventForKlaviyo function

    var data = {};
    var basketItems = currentBasket.getProductLineItems().toArray();
    // Create some top-level event data
    //data.event = EVENT_NAMES['startedCheckout'];
    data['Basket Gross Price'] = currentBasket.getTotalGrossPrice().value;
    data['Item Count'] = basketItems.length;

    // prepare to add top-level data while iterating through product line items
    data.line_items = [];
    data.Categories = [];
    data.Items = [];
    data.$email = currentBasket.customerEmail;

    for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
        var lineItem = basketItems[itemIndex];
        var currentProductID = lineItem.productID;
        var basketProduct = ProductMgr.getProduct(currentProductID);

        if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
            var productObj = prepareProductObj( lineItem, basketProduct, currentProductID );

            // add top-level data for the event for segmenting, etc.
            data.line_items.push(productObj);
            data.Categories.push.apply(data.Categories, data.line_items[itemIndex].Categories);
            data.Items.push(data.line_items[itemIndex]['Product Name']);
        }
    }

    return data;
}


// prepares data for "Order Confirmation" event
function orderConfirmationData(currentOrder, exchangeID) {

    // TODO: this all should be reviewed more closely, particularly the prepareOrderPayload function in "emailUtils"
    // that function is called nowhere else - although it is large, is it better to inline it here?
    // if its kept, at least change the filename to something more descriptive of how its being used, ie orderConfirmationUtils or something

    // site specific order object */
    var emailUtils = require('*/cartridge/scripts/utils/klaviyo/emailUtils');
    var dwareOrder = emailUtils.prepareOrderPayload( currentOrder, false, 'orderConfirmation' );
    // TODO - shift back back up to controller level to follow pattern of other event controllers
    trackEvent( exchangeID, dwareOrder, EVENT_NAMES['orderConfirmation'] );

};


/****
 *
 * END DATA ASSEMBLY FUNCTIONS FOR INDIVIDUAL EVENT TYPES
 *
****/




/**
 * Prepares Product Object and set necessary product details
 * https://apidocs.klaviyo.com/reference/track-identify#track-get
 *
 * @param lineItem
 * @param basketProduct
 * @param currentProductID
 * @returns {Object}
 */

// TODO: this is called in one location... can it just be inlined?

function prepareProductObj(lineItem, basketProduct, currentProductID) {
    var productObj = {};
    productObj['Product ID'] = currentProductID;
    productObj['Product Name'] = basketProduct.name;
    productObj['Product Image URL'] = imageSize ? basketProduct.getImage(imageSize).getAbsURL().toString() : null;
    productObj.Price = dw.util.StringUtils.formatMoney( dw.value.Money( basketProduct.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode() ) );
    productObj['Product Description'] = basketProduct.pageDescription ? basketProduct.pageDescription.toString() : null;
    productObj['Product Page URL'] = require('dw/web/URLUtils').https('Product-Show', 'pid', currentProductID).toString();
    productObj['Product UPC'] = basketProduct.UPC;
    productObj['Product Availability Model'] = basketProduct.availabilityModel.availability;

    var categories = [];
    var catProduct = (basketProduct.variant) ? basketProduct.masterProduct : basketProduct; // from orig klav code, always use master for finding cats
    for(var i=0, len=catProduct.categoryAssignments.length; i<len; i++) {
        categories.push(catProduct.categoryAssignments[i].category.displayName);
    }

    productObj.Categories = categories;
    return productObj;
}


function trackEvent(exchangeID, data, event) {

    var requestBody = {};
    var resultObj = {};

    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - trackEvent()');

    if (KlaviyoEventService == null || empty(exchangeID)) {
        logger.error('trackEvent() failed for exchange_id: ' + exchangeID + '.');
        return;
    }

    var eventData = {
        "data": {
            "type": "event",
            "attributes": {
                "profile": {
                    "$exchange_id": exchangeID,
                },
                "metric": {
                    "name": event,
                    "service": "demandware" // TODO: update this to work off a site pref toggle
                },
                "properties" : data,
                "time": (new Date()).toISOString()
                // value: 9.99 // TODO - figure out when this can be set and what it should be set to ie, product price, cart total, order total, etc
            }
        }
    };

    var result = KlaviyoEventService.call(eventData);

    if (result == null) {
        logger.error('Result for ' + event + ' track event via Klaviyo returned null.');
        return;
    }

    resultObj = JSON.parse(result.object);

    if (result.ok) {
        logger.info(event + ' track event via Klaviyo is successful.');
    } else {
        logger.error( event + ' track event via Klaviyo failed. '+result.errorMessage);
    }

    return resultObj;

}

// HTTP Services

var KlaviyoEventService = ServiceRegistry.createService('KlaviyoEventService', {
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
    createRequest: function (svc, args) {
        // TODO: remove this if its not going to get used
        //var password = svc.configuration.credential.password;

        var key = Site.getCurrent().getCustomPreferenceValue('klaviyo_api_key');
        if(!key || key == '') {
            // TODO: log error - missing Klaviyo Private API Key
            // also test to see what happens to the calling code when this immediately returns / no key set
            return;
        }

        svc.setRequestMethod('POST');
        svc.addHeader('Authorization', 'Klaviyo-API-Key '+key);
        svc.addHeader('Content-type', 'application/json');
        svc.addHeader('Accept', 'application/json');
        svc.addHeader('revision', '2023-02-22');

        return JSON.stringify(args);
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
    getProfileInfo : getProfileInfo,
    viewedProductData : viewedProductData,
    viewedCategoryData : viewedCategoryData,
    searchedSiteData : searchedSiteData,
    addedToCartData : addedToCartData,
    startedCheckoutData : startedCheckoutData,
    orderConfirmationData : orderConfirmationData,
    trackEvent : trackEvent
}