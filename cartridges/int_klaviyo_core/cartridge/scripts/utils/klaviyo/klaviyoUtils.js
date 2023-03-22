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


// prepares data for "Started Checkout" event
function startedCheckoutData(currentBasket) {

    // TODO: analyze line-by-line.  currently pulled straight from previous cartridge prepareCheckoutEventForKlaviyo function

    var klData = {};
    var basketItems = currentBasket.getProductLineItems().toArray();
    // Create some top-level event data
    klData.event = 'Started Checkout';
    klData['Basket Gross Price'] = currentBasket.getTotalGrossPrice().value;
    klData['Item Count'] = basketItems.length;

    // prepare to add top-level data while iterating through product line items
    klData.line_items = [];
    klData.Categories = [];
    klData.Items = [];
    klData.$email = currentBasket.customerEmail;

    for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
        var lineItem = basketItems[itemIndex];
        var currentProductID = lineItem.productID;
        var basketProduct = ProductMgr.getProduct(currentProductID);

        if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
            var productObj = prepareProductObj( lineItem, basketProduct, currentProductID );

            // add top-level data for the event for segmenting, etc.
            klData.line_items.push(productObj);
            klData.Categories.push.apply(klData.Categories, klData.line_items[itemIndex].Categories);
            klData.Items.push(klData.line_items[itemIndex]['Product Name']);
        }
    }

    return klData;
}


// prepares data for "Order Confirmation" event
function orderConfirmationData(currentOrder, exchangeID) {

    // TODO: this all should be reviewed more closely, particularly the prepareOrderPayload function in "emailUtils"
    // that function is called nowhere else - although it is large, is it better to inline it here?
    // if its kept, at least change the filename to something more descriptive of how its being used, ie orderConfirmationUtils or something

    // site specific order object */
    var emailUtils = require('*/cartridge/scripts/utils/klaviyo/emailUtils');
    var dwareOrder = emailUtils.prepareOrderPayload( currentOrder, false, 'orderConfirmation' );
    trackEvent( exchangeID, dwareOrder, 'Order Confirmation' );

    // giftcards
    var giftCertCollection = currentOrder.getGiftCertificateLineItems().toArray();
    var orderGiftCards = [];

    for (
        var giftCertIndex = 0;
        giftCertIndex < giftCertCollection.length;
        giftCertIndex++
    ) {
        // gift certificates don't count as orderItems so we need to reconcile that ourselves
        // var giftCardId = dw.system.Site.getCurrent().getCustomPreferenceValue('EgiftProduct-ID');

        /* klData["Item Count"]++ */
        var giftCard = giftCertCollection[giftCertIndex];
        var giftCardObj = {};
        giftCardObj = prepareGiftCardObject(giftCard);
        orderGiftCards.push(giftCardObj);
    }

    // send an event for transactional gift certificate emails
    for (
        var totalOrderGiftCards = 0;
        totalOrderGiftCards < orderGiftCards.length;
        totalOrderGiftCards++
    ) {
        var theGiftCard = orderGiftCards[totalOrderGiftCards];
        // TODO: confirm this special event with Klaviyo... being tracked on recipient email
        // ALSO: add string to event constants?
        trackEvent( theGiftCard['Recipient Email'], theGiftCard, 'e-Giftcard Notification' ); 
    }

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



/**
 * Prepares GiftCard Object and set necessary details
 *
 * @param giftCard
 * @returns {Object}
 */

// TODO: this is called in one location... can it just be inlined?

function prepareGiftCardObject(giftCard) {
    var giftCardObj = {};
    giftCardObj['Product Name'] = 'e-Giftcard';
    // giftCardObj['Product ID'] = dw.system.Site.getCurrent().getCustomPreferenceValue('EgiftProduct-ID');
    giftCardObj['Recipient Email'] = giftCard.recipientEmail;
    giftCardObj['Recipient Name'] = giftCard.recipientName;
    giftCardObj['Sender Name'] = giftCard.senderName;
    giftCardObj.Message = giftCard.message;
    giftCardObj.Value = giftCard.price.value;
    return giftCardObj;
}



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
        logger.error('trackEvent() failed for exchange_id: ' + exchangeID + '.');
        return;
    }

    var klaviyoData = preparePayload(exchangeID, data, event);

    KlaviyoTrackService.addParam('data', klaviyoData);

    var result = KlaviyoTrackService.call(requestBody);

    if (result == null) {
        logger.error('Result for ' + event + ' track event via Klaviyo returned null.');
        return;
    }

    resultObj = JSON.parse(result.object);

    if (resultObj == 1) {
        // TODO: do we really need to log every successful event?
        //logger.info(event + ' track event via Klaviyo is successful.');
    } else {
        logger.error( event + ' track event via Klaviyo failed.');
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
        svc.setRequestMethod('GET');  // TODO: switch to POST when shifting to V3 API
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

// TODO: remove - written by AOC for server-side identify, most likely not useful
var KlaviyoIdentifyService = ServiceRegistry.createService('KlaviyoIdentifyService', {
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
        svc.setRequestMethod('GET'); // TODO: switch to POST when shifting to V3 API
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
        var reqLogMsg = 'sending klaviyo identify payload';
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