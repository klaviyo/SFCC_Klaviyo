'use strict';

var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
var productMgr = require('dw/catalog/ProductMgr');
var orderMgr = require('dw/order/OrderMgr');
var basketMgr = require('dw/order/BasketMgr');
var imageSize = Site.getCurrent().getCustomPreferenceValue('klaviyo_image_size') || null;

var WHITELISTED_EVENTS = ['Searched Site', 'Viewed Product', 'Viewed Category', 'Added to Cart', 'Started Checkout', 'Placed Order', 'Ordered Product'];

/**
 * Uses the service framework to get the Klaviyo Service configuration
 * (please see metadata/klaviyo-services.xml) and executes a get call with the payload generated from the
 * preparePayload() method.
 *
 * This is a track API call. Please refer https://apidocs.klaviyo.com/reference/track-identify#track-get
 *
 * @param email
 * @param data
 * @param event
 * @returns
 */
function trackEvent(email, data, event) {
    var requestBody = {};
    var resultObj = {};

    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - trackEvent()');

    if (KlaviyoTrackService == null || empty(email)) {
        logger.error('trackEvent() failed for email: ' + obfuscateKlEmail(email) + '. Service Connection for send email via Klaviyo returned null.');
        return;
    }

    var klaviyoData = preparePayload(email, data, event);

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


/**
 * Prepares Track API Payload Data in format per
 * https://apidocs.klaviyo.com/reference/track-identify#track-get
 *
 * @param email
 * @param data
 * @param event
 * @returns
 */
function preparePayload(email, data, event) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - preparePayload()');
    var jsonData = {};
    jsonData.token = Site.getCurrent().getCustomPreferenceValue('klaviyo_account');
    jsonData.event = event;
    if (WHITELISTED_EVENTS.indexOf(event) > -1) {
        jsonData.service = 'demandware';
    }
    var customerProperties = {};
    customerProperties.$email = email;
    jsonData.customer_properties = customerProperties;
    jsonData.properties = data;
    jsonData.time = Math.floor(Date.now() / 1000);

    var klaviyoData = JSON.stringify(jsonData);

    return StringUtils.encodeBase64(klaviyoData);
}


/**
 * Prepares GiftCard Object and set necessary details
 *
 * @param giftCard
 * @returns {Object}
 */

function preparegiftCardObject(giftCard) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - preparegiftCardObject()');
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


/**
 * Prepares Product Object and set necessary product details
 * https://apidocs.klaviyo.com/reference/track-identify#track-get
 *
 * @param lineItem
 * @param basketProduct
 * @param currentProductID
 * @returns {Object}
 */

function prepareProductObj(lineItem, basketProduct, currentProductID) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - prepareProductObject()');
    var productObj = {};
    productObj['Product ID'] = currentProductID;
    productObj['Product Name'] = basketProduct.name;
    productObj['Product Image URL'] = imageSize ? basketProduct.getImage(imageSize).getAbsURL().toString() : null;
    productObj.Price = dw.util.StringUtils.formatMoney(dw.value.Money(basketProduct.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode()));
    productObj['Product Description'] = basketProduct.pageDescription ? basketProduct.pageDescription.toString() : null;
    productObj['Product Page URL'] = require('dw/web/URLUtils').https('Product-Show', 'pid', currentProductID).toString();
    productObj['Product UPC'] = basketProduct.UPC;
    productObj['Product Availability Model'] = basketProduct.availabilityModel.availability;
    productObj.Categories = createCategories(basketProduct);
    return productObj;
}

/**
 * Prepares Viewed Product Object and set necessary details
 *
 * @param pageProductID
 * @param viewedProduct
 * @returns {Object}
 */

function prepareViewedProductEventData(pageProductID, viewedProduct) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - prepareViewedProductEventData()');
    var klData = {};
    klData.event = 'Viewed Product';
    klData.viewedProductID = pageProductID;
    klData.viewedProductName = viewedProduct.name;
    klData.viewedProductPage = viewedProduct.getPageURL();
    klData.viewedProductImage = imageSize ? viewedProduct.getImage(imageSize).getAbsURL().toString() : null;
    var price = viewedProduct.getPriceModel().getPrice().getValue();
    if (empty(price) || price <= 0) {
        price = viewedProduct.getPriceModel().getMinPrice().getValue();
    }
    klData.viewedProductPrice = price;
    klData.viewedProductPageURL = require('dw/web/URLUtils').https('Product-Show', 'pid', pageProductID).toString();
    klData.viewedProductUPC = viewedProduct.UPC;
    klData.viewedProductCategories = createCategories(viewedProduct);
    klData.viewedProductPrimaryCategory = !empty(viewedProduct.getPrimaryCategory()) ? viewedProduct.getPrimaryCategory().displayName : '';
    return klData;
}

/**
 * Return product product categories
 *
 * @param product
 * @returns categories
 */
function createCategories(product) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - createCategories()');
    var productCategoryIndex,
        currentCategory;
    var arrayOfCategories = [];

    if (product.variant) {
        var productCategoryArray = product.masterProduct.allCategories.toArray();
        for (productCategoryIndex = 0; productCategoryIndex < productCategoryArray.length; productCategoryIndex++) {
            currentCategory = productCategoryArray[productCategoryIndex].displayName;
            arrayOfCategories.push(currentCategory);
        }
    } else {
        productCategoryArray = product.allCategories.toArray();
        for (productCategoryIndex = 0; productCategoryIndex < productCategoryArray.length; productCategoryIndex++) {
            currentCategory = productCategoryArray[productCategoryIndex].displayName;
            arrayOfCategories.push(currentCategory);
        }
    }
    var categories = removeDuplicates(arrayOfCategories);
    return categories;
}

/**
 * Removing duplicate items from an array
 * @param array
 * @returns array
 */

function removeDuplicates(items) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - removeDuplicates()');
    var unique = {};
    items.forEach(function (i) {
        if (!unique[i]) {
            unique[i] = true;
        }
    });
    return Object.keys(unique);
}

/**
 * Creating data layer from the basket for checkout start event
 * @param basket
 * @returns datalayer
 */
function prepareCheckoutEventForKlaviyo(currentBasket) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - prepareCheckoutEventForKlaviyo()');
    try {
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
            var basketProduct = productMgr.getProduct(currentProductID);

            if (currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
                var productObj = prepareProductObj(lineItem, basketProduct, currentProductID);

                // add top-level data for the event for segmenting, etc.
                klData.line_items.push(productObj);
                klData.Categories.push.apply(klData.Categories, klData.line_items[itemIndex].Categories);
                klData.Items.push(klData.line_items[itemIndex]['Product Name']);
            }
        }
    } catch (e) {
        klData.data.debug_error = [e.message, e.lineNumber];
    }
    return klData;
}

/**
 * Creating data layer from the order object and send to klaviyo
 * @param order
 * @returns
 */
function prepareOrderConfirmationEventForKlaviyo(currentOrder) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - prepareOrderConfirmationEventForKlaviyo()');
    try {
        // putting this here for performance

        // site specific order object */
        var emailUtils = require('*/cartridge/scripts/utils/klaviyo/emailUtils');
        var dwareOrder = emailUtils.prepareOrderPayload(currentOrder, false, 'orderConfirmation');
        trackEvent(currentOrder.getCustomerEmail(), dwareOrder, 'Order Confirmation');

        // giftcards
        var giftCertCollection = currentOrder.getGiftCertificateLineItems().toArray();
        var orderGiftCards = [];

        for (var giftCertIndex = 0; giftCertIndex < giftCertCollection.length; giftCertIndex++) {
            // gift certificates don't count as orderItems so we need to reconcile that ourselves
            // var giftCardId = dw.system.Site.getCurrent().getCustomPreferenceValue('EgiftProduct-ID');

            /* klData["Item Count"]++ */
            var giftCard = giftCertCollection[giftCertIndex];
            var giftCardObj = {};
            giftCardObj = preparegiftCardObject(giftCard);
            orderGiftCards.push(giftCardObj);
        }

        // send an event for transactional gift certificate emails
        for (var totalOrderGiftCards = 0; totalOrderGiftCards < orderGiftCards.length; totalOrderGiftCards++) {
            var theGiftCard = orderGiftCards[totalOrderGiftCards];
            trackEvent(theGiftCard['Recipient Email'], theGiftCard, 'e-Giftcard Notification');
        }
    } catch (e) {
        logger.debug('prepareOrderConfirmationEventForKlaviyo -- error ' + e.message + ' at ' + e.lineNumber);
    }
}

/**
 * Creating data layer from the basket for add to cart event.
 * @param object
 * @returns object
 */
function prepareAddToCartEventForKlaviyo(klData) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - prepareAddToCartEventForKlaviyo()');
    var basketItems = basketMgr.getCurrentBasket().getProductLineItems().toArray();
    klData.event = 'Added to Cart';
    klData.basketGross = basketMgr.getCurrentBasket().getTotalGrossPrice().getValue().valueOf();
    klData.itemCount = basketItems.length;
    klData.lineItems = [];
    klData.items = [];
    klData.categories = [];
    klData.primaryCategories = [];

    for (var itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
        var lineItem = basketItems[itemIndex];
        var currentProductID = lineItem.productID;
        var basketProduct = productMgr.getProduct(currentProductID);

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

            klData.lineItems.push({
                productID                 : currentProductID,
                productName               : basketProduct.name,
                productImageURL           : imageSizeOfProduct,
                productPageURL            : require('dw/web/URLUtils').https('Product-Show', 'pid', currentProductID).toString(),
                price                     : dw.util.StringUtils.formatMoney(dw.value.Money(basketProduct.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode())),
                productUPC                : basketProduct.UPC,
                viewedProductAvailability : basketProduct.availabilityModel.availability,
                categories                : createCategories(basketProduct),
                primaryCategory           : primaryCategory
            });
            klData.items.push(basketProduct.name);
            klData.categories.push.apply(klData.categories, klData.lineItems[itemIndex].categories);
            klData.primaryCategories.push(klData.lineItems[itemIndex].primaryCategory);
        }
    }
    return klData;
}

/**
 * Prepare data to be sent to klaviyo in klData object
 */
var buildDataLayer = function () {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - buildDataLayer()');
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
        pageCategoryId;

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
        // Started Checkout event
        if (pageContext == 'checkout') {
            logger.info('Building dataLayer for "Started Checkout" event.');
            currentBasket = basketMgr.getCurrentBasket();
            basketHasLength = currentBasket.getProductLineItems().toArray().length >= 1;

            if (basketHasLength) {
                klData = prepareCheckoutEventForKlaviyo(currentBasket);
            }
        }

        // Order Confirmation Event
        if (pageContext == 'orderconfirmation' && orderID || !empty(orderID.rawValue)) {
            logger.info('Building dataLayer for "Order Confirmation" event.');
            currentOrder = orderMgr.getOrder(orderID);
            prepareOrderConfirmationEventForKlaviyo(currentOrder);
        }


        // Viewed Product event
        if (pageContext == 'product') {
            logger.info('Building dataLayer for "Viewed Product" event.');
            viewedProduct = productMgr.getProduct(pageProductID);
            klData = prepareViewedProductEventData(pageProductID, viewedProduct);
        }

        // Viewed Category event
        if (pageContext == 'search' && !empty(pageCategoryId)) {
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
    }

    return klData;
};

/**
 * Prepare data to be sent to klaviyo in klData object for add to cart
 */
var buildCartDataLayer = function () {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - buildCartDataLayer()');
    logger.info('Calling buildCartDataLayer().');
    var klData = {};
    var isValidBasket,
        basketHasLength;

    isValidBasket = (basketMgr.getCurrentBasket());
    if (isValidBasket) {
        basketHasLength = (basketMgr.getCurrentBasket().getProductLineItems().toArray().length >= 1);
    }

    if (basketHasLength) {
        klData = prepareAddToCartEventForKlaviyo(klData);
    }

    return klData;
};

/**
 * Creating page context from the request path
 * @returns context
 */
var getContext = function () {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - getContext()');
    logger.info('Calling getContext().');
    var path = request.httpPath;
    var parts = path.split('/');
    var context = null;
    if (parts[parts.length - 1] == 'Checkout-Begin') {
        context = 'checkout';
    }
    return context;
};

/**
 * Initializing add to cart event
 * @returns
 */
var trackAddToCart = function () {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - trackAddToCart()');
    logger.info('Calling trackAddToCart().');
    var klaviyoDataLayer = buildCartDataLayer();
    var email = '';
    if (!empty(session.getCustomer()) && !empty(session.getCustomer().profile)) {
        var currentUser = session.getCustomer().profile;
        email = currentUser.email;
    }
    var event = 'Add To Cart';
    trackEvent(email, klaviyoDataLayer, event);
};

/**
 * Obfuscating an email address for log file
 * @returns obfuscated email like d**********@k******.com
 */
function obfuscateKlEmail(email) {
    var logger = Logger.getLogger('Klaviyo', 'Core klaviyoUtils - obfuscateEmail()');
    logger.info('Calling obfuscateKlEmail().');
    if (empty(email)) {
        return;
    }
    var astericks = '**********';
    var splitEmail = email.split('@');
    var firstLetter = splitEmail[0][0];
    var domainLetter = splitEmail[1][0];
    var newDomain = domainLetter.concat(astericks);
    var newStartEmail = firstLetter.concat(astericks + '@');
    var obfuscatedEmail = newStartEmail.concat(newDomain);
    logger.debug('obfuscatedEmail: ' + obfuscatedEmail);
    return obfuscatedEmail;
}

module.exports = {
    trackEvent                              : trackEvent,
    preparegiftCardObject                   : preparegiftCardObject,
    prepareViewedProductEventData           : prepareViewedProductEventData,
    prepareProductObj                       : prepareProductObj,
    prepareCheckoutEventForKlaviyo          : prepareCheckoutEventForKlaviyo,
    prepareOrderConfirmationEventForKlaviyo : prepareOrderConfirmationEventForKlaviyo,
    prepareAddToCartEventForKlaviyo         : prepareAddToCartEventForKlaviyo,
    createCategories                        : createCategories,
    buildDataLayer                          : buildDataLayer,
    buildCartDataLayer                      : buildCartDataLayer,
    getContext                              : getContext,
    trackAddToCart                          : trackAddToCart,
    removeDuplicates                        : removeDuplicates
};


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
        svc.setRequestMethod('GET');
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
