'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

/* Script Modules */
var klaviyoServices = require('*/cartridge/scripts/klaviyo/services.js');

// KL EVENT TRACKING: event name constants, used throughout code to ensure event names are always consistent
var EVENT_NAMES = {
    viewedProduct     : 'Viewed Product',
    viewedCategory    : 'Viewed Category',
    searchedSite      : 'Searched Site',
    addedToCart       : 'Added to Cart',
    startedCheckout   : 'Started Checkout',
    orderConfirmation : 'Order Confirmation'
};
/* IMPORTANT:
    If the klaviyo_atc_override site preference has been set to No (False) Added To Cart events will show up in the Klaviyo Dashboard with the metric type "Added To Cart"
    If it is left on it's default setting of "Yes" ATC events will appear with the metric label "Add To Cart."
    Generally speaking this should only be set to No if this is a brand new Klaviyo integration - if there is a previous integration with Klaviyo for
    this site that did not label ATC events as "Added To Cart" there will be a break in reporting and functionality between past events that were not
    labelled with "Add To Cart" and the new events that are labelled "Added To Cart".  If in doubt, leave the site preference set to No and contact Klaviyo technical support.
*/
if (Site.getCurrent().getCustomPreferenceValue('klaviyo_atc_override')) {
    EVENT_NAMES.addedToCart = 'Add To Cart';
}

// KL CORE: site preferences to enable/disable Klaviyo and to get settings for image sizes passed with event data
var klaviyoEnabled = Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled') || false;
var KLImageSize = Site.getCurrent().getCustomPreferenceValue('klaviyo_image_size') || 'large';


// KL IDENTIFY:
// Looks for klaviyo's cookie and if found extracts the exchangeID from it, returning that value
// If the cookie is not found or exchangeID extraction fails, returns false
function getKlaviyoExchangeID() {
    if ('__kla_id' in request.httpCookies && !empty(request.httpCookies['__kla_id'])) {
        var kx = JSON.parse(StringUtils.decodeBase64(request.httpCookies['__kla_id'].value)).$exchange_id;
        return (kx && kx != '') ? kx : false;
    }
    return false;
}

// KL IDENTIFY: gets SFCC profile info (if available) to use for IDing user to Klaviyo
function getProfileInfo() {
    if (customer.authenticated && customer.profile) {
        var profileInfo = {
            $email      : customer.profile.email,
            $first_name : customer.profile.firstName,
            $last_name  : customer.profile.lastName
        };
        profileInfo = JSON.stringify(profileInfo);
        profileInfo = StringUtils.encodeBase64(profileInfo);
        return profileInfo;
    }
    return false;
}


// KL CLIENT SIDE DEBUGGING:
// This takes data passed from the controller and encodes it so it can be used when Klaviyo's Debugger mode has been activated (ex: when including 'kldebug=true' as a URL query)
// Data from this is available in the following Events: 'Viewed Product', 'Viewed Category', 'Searched Site', 'Added to Cart' and 'Started Checkout'.
function prepareDebugData(obj) {
    var stringObj = JSON.stringify(obj);
    var encodedDataObj = StringUtils.encodeBase64(stringObj);

    return encodedDataObj;
}


// KL EVENT TRACKING:
// helper function used in getData() functions to dedupe values in arrays (particularly product category lists)
function dedupeArray(items) {
    var unique = {};
    items.forEach(function (i) {
        if (!unique[i]) {
            unique[i] = true;
        }
    });
    return Object.keys(unique);
}


// KL EVENT TRACKING & KL RECREATE CART:
// helper function to extract product options and return each selected option into an object with five keys in readable format: 'Line Item Text', 'Option ID', 'Option Value ID',
// 'Option Price' and 'Option Price Value'. Each of these five values is available in relevant eventData (ex: within line items in 'Started Checkout', 'Order Confirmation', etc.)
// Three of these keys are also used for the KlaviyoRecreate-Cart controller:  'Line Item Text', 'Option ID' and 'Option Value ID'.
// This helper accomodates products that may feature multiple options by returning an array of each selected product option as its own optionObj.
function captureProductOptions(prodOptions) {
    var options = Array.isArray(prodOptions) ? prodOptions : Array.from(prodOptions);
    var selectedOptions = [];

    options.forEach(function (optionObj) {
        var formattedOptionPrice = optionObj ? StringUtils.formatMoney(dw.value.Money(optionObj.basePrice.value, session.getCurrency().getCurrencyCode())) : null;
        selectedOptions.push({
            'Line Item Text'     : optionObj.lineItemText, // KL RECREATE CART & KL EVENT TRACKING
            'Option ID'          : optionObj.optionID, // KL RECREATE CART & KL EVENT TRACKING
            'Option Value ID'    : optionObj.optionValueID, // KL RECREATE CART & KL EVENT TRACKING
            'Option Price'       : formattedOptionPrice, // KL EVENT TRACKING
            'Option Price Value' : optionObj.basePrice.value // KL EVENT TRACKING
        });
    });

    return selectedOptions;
}


// KL EVENT TRACKING:
// helper function to extract child products from product bundles & set appropriate properties on a returned object.
// Used in three key tracked events: 'Added to Cart', 'Started Checkout' and 'Order Confirmation'.
function captureProductBundles(bundledProducts) {
    var prodBundleData = {};
    prodBundleData.prodBundleIDs = [];
    prodBundleData.isProdBundle = true;
    for (var i = 0; i < bundledProducts.length; i++) {
        var childObj = bundledProducts[i];
        prodBundleData.prodBundleIDs.push(childObj.productID);
    }

    return prodBundleData;
}


// KL EVENT TRACKING:
// helper function to handle bonus products & set appropriate properties on a returned object.
// Used in two key tracked events: 'Started Checkout' and 'Order Confirmation'.
function captureBonusProduct(lineItemObj, prodObj) {
    var bonusProductData = {};
    bonusProductData.isbonusProduct = true;
    bonusProductData.originalPrice = StringUtils.formatMoney(dw.value.Money(prodObj.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode()));
    bonusProductData.originalPriceValue = prodObj.getPriceModel().getPrice().value;
    bonusProductData.price = StringUtils.formatMoney(dw.value.Money(lineItemObj.adjustedPrice.value, session.getCurrency().getCurrencyCode()));
    bonusProductData.priceValue = lineItemObj.adjustedPrice.value;

    return bonusProductData;
}


// KL EVENT TRACKING:
// helper function to consider promos & set Price and Original Pride properties on a returned object.
// Used in order level events: 'Started Checkout' and 'Order Confirmation'.
function priceCheck(lineItemObj, basketProdObj) {
    var priceModel = basketProdObj ? basketProdObj.getPriceModel() : null;

    // SFCC handles prices in multiple ways depending on site configureations. We must locate the correct Price Book to see if there is an original 'list price'
    //  that differs from the price that is initialy seen by Klaviyo. This function, getRootPriceBook(), is modeled after the same core logic in SFRA to get at
    //  the root-price book. Recreating the function in this file makes the logic easily shared across SFRA & SiteGen since this fucntion is not available in
    //  OOTB SiteGen (their price books have the same structure, which makes this logic is sharable).
    // Note: Customers can use multiple price books for a single product (ex: list price, sales price, etc.), which makes it necessary to locate the original
    //  price book assigned to a product.
    var priceBook = priceModel ? getRootPriceBook(priceModel.priceInfo.priceBook) : null;

    // After the pricebook is found, we use the built-in SFCC method on the priceModel to get the price book price (i.e. the original / 'list price' of the product).
    // More info about this method is available by searching for "getPriceBookPrice" at https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp,
    var priceBookPrice = priceBook && priceModel ? priceModel.getPriceBookPrice(priceBook.ID) : null;
    var priceData = {};

    // If there is a priceBookPrice and if it's greater than than the adjusted price of the lineItem object, then we need to declare an adjustedPrice exists
    var adjustedPromoPrice = lineItemObj && lineItemObj.adjustedPrice < priceBookPrice ? StringUtils.formatMoney(dw.value.Money(lineItemObj.adjustedPrice.value, session.getCurrency().getCurrencyCode())) : null;
    if (adjustedPromoPrice) {
        // In cases where an adjustedPromoPrice has been identified (i.e. there's a difference between lineItem price and an original 'list price'), we set
        //  the purchase price to be the formatted string of the lineItem price.
        // Important to note the lineItemObj.adjustedPrice.value is the purchase price a customer sees on the site (includes any promos / discounts, etc.). SFCC's
        //  formatMoney() method is used to format the item's purchase price to be the currency that is currently active on the session. (Ex: $19.99 or €19.99 or £19.99, etc.)
        priceData.purchasePrice = StringUtils.formatMoney(dw.value.Money(lineItemObj.adjustedPrice.value, session.getCurrency().getCurrencyCode()));

        // The purchasePriceValue is now set to the numerical value of the purchase price (not formatted by currency, just a decimal number)
        priceData.purchasePriceValue = lineItemObj.adjustedPrice.value;

        // The Original price, in cases when an adjustedPromoPrice is located, is set to be the item's original, 'List Price' - which is based on the original
        //  price book assigned to the item when the site was established.
        // Similar to other lines, SFCC's formatMoney() method that's available on the StringUtils class object is used to correctly format the price according to
        //  the currency. The price on the basketProdObj is used as a fail-safe back-up for additional defensive coding purposes in case there was ever an unexpected issue with the priceBookPrice.value.
        priceData.originalPrice = priceBookPrice ? StringUtils.formatMoney(dw.value.Money(priceBookPrice.value, session.getCurrency().getCurrencyCode())) : StringUtils.formatMoney(dw.value.Money(basketProdObj.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode()));

        // The originalPriceValue is now set to the numerical value of the Original Price (ex: a decimal number, not a formatted currency)
        priceData.originalPriceValue = priceBookPrice.value;
    } else {
        // This block handles cases where there is no discrepancy with an original, 'List Price' and the lineItem price. This follows a similar pattern with the
        //  above block, by utilizing SFCC's StringUtils class Object & its formatMoney() method to format values with the expected currency that is active on the
        //  session. (Ex: $19.99 or €19.99 or £19.99, etc.)
        // In these cases, the lineItemObj is the reliable source of the purchase price, and the Price Model values on the basketProdObj is the reliable source for
        //  the item's original purchase price.
        // Note: this is the expected logical flow when promotions and sales prices are not configured to a particular product. The If conditional above is the route for special pricing edge cases.
        priceData.purchasePrice = lineItemObj ? StringUtils.formatMoney(dw.value.Money(lineItemObj.price.value, session.getCurrency().getCurrencyCode())) : null;
        priceData.purchasePriceValue = lineItemObj ? lineItemObj.price.value : null;
        priceData.originalPrice = basketProdObj ? StringUtils.formatMoney(dw.value.Money(basketProdObj.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode())) : null;
        priceData.originalPriceValue = basketProdObj.getPriceModel().getPrice().value;
    }

    return priceData;
}


/**
 * KL EVENT TRACKING:
 * Return root price book for a given price book
 * This function is utiltized to get the "list price" price book to provide products' "Original Price " in various events
 * @param {dw.catalog.PriceBook} priceBook - Provided price book
 * @returns {dw.catalog.PriceBook} root price book
 */
function getRootPriceBook(priceBook) {
    var rootPriceBook = priceBook;
    while (rootPriceBook.parentPriceBook) {
        rootPriceBook = rootPriceBook.parentPriceBook;
    }
    return rootPriceBook;
}


// KL EVENT TRACKING:
// this is the core method used by all server-side calls to pass event data to the Klaviyo Track Event API
// 'exchangeID' is passed for most events, whereas 'customerEmail' is passed for Started Checkout and Order Confirmation events
// 'data' is the product of a given event's .getData() function, and 'event' is a string from the EVENT_NAMES constants (above) to indicate the event type.
function trackEvent(exchangeID, data, event, customerEmail) {
    var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core utils.js - trackEvent()');

    if (klaviyoServices.KlaviyoEventService == null || empty(exchangeID)) {
        logger.error('trackEvent() failed - KlaviyoEventService or exchange_id is null.  exchange_id: ' + exchangeID + '.');
        return;
    }

    var metricObj = { name: event };
    /* IMPORTANT:
        If the klaviyo_sendEventsAsSFCC site preference has been set to Yes (true) events will show up in the Klaviyo Dashboard with SFCC as the event provider.
        Generally speaking this should only be set to Yes if this is a brand new Klaviyo integration - if there is a previous integration with Klaviyo for
        this site that did not label events with SFCC as provider there will be a break in reporting and functionality between past events that were not
        labelled with SFCC as provider and the new events that are.  If in doubt, leave the site preference set to No and contact Klaviyo technical support.
    */
    if (Site.getCurrent().getCustomPreferenceValue('klaviyo_sendEventsAsSFCC')) {
        metricObj.service = 'demandware';
    }

    // If a customer email was passed in, use it to tie the event to that email (Started Checkout, Order Confirmation)
    // Otherwise use the exchangeID for same.
    var profileObj = {};
    if (!customerEmail) {
        profileObj = { $exchange_id: exchangeID };
    } else {
        profileObj = { $email: customerEmail };
    }

    // Wraps meta data around the specific event data that has been passed in, per KL API Track Event spec
    var eventData = {
        data: {
            type       : 'event',
            attributes : {
                profile    : profileObj,
                metric     : metricObj,
                properties : data,
                time       : (new Date()).toISOString()
            }
        }
    };

    // The call to the KlaviyoEventService (SFCC Service Framework) to pass the event data to the KL API.
    // Reference services.js for further details
    var result = klaviyoServices.KlaviyoEventService.call(eventData);

    if (result == null) {
        logger.error('klaviyoServices.KlaviyoEventService call for ' + event + ' returned null result');
        return;
    }

    if (result.ok === true) {
        return { success: true };
    }
    return JSON.parse(result.errorMessage);
}


// The subscribeUser func takes the user email & phone number to prep a data object w/ a corresponding emailListID or smsListID (both configured in BM w/ values from the Klaviyo Dashboard)
// Data is sent to the KlaviyoSubscribeProfilesService API to subscribe users to email or SMS lists.
function subscribeUser(email, phone) {
    var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core utils.js - subscribeUser()');

    if (klaviyoServices.KlaviyoSubscribeProfilesService == null) {
        logger.error('subscribeUser() failed - KlaviyoSubscribeProfilesService is null.');
        return;
    }

    var emailListID = Site.getCurrent().getCustomPreferenceValue('klaviyo_email_list_id');
    var smsListID = Site.getCurrent().getCustomPreferenceValue('klaviyo_sms_list_id');

    var data;
    var result;

    // This conditional checks whether a user clicked the subscribe box (i.e. the session.custom.klEmailSubscribe value) & looks for whether an emailListID is configured in Business Manager.
    // If so, a data object is constructed with the list ID as well as the entered Phone & Email so profile in the Klaivyo dashboard has the user's full contact information.
    if (session.custom.KLEmailSubscribe && emailListID) {
        data = {
            data: {
                type       : 'profile-subscription-bulk-create-job',
                attributes : {
                    list_id       : emailListID,
                    custom_source : 'SFCC Checkout',
                    subscriptions : [{
                        channels     : { email: ['MARKETING'] },
                        email        : email,
                        phone_number : phone
                    }]
                }
            }
        };

        result = klaviyoServices.KlaviyoSubscribeProfilesService.call(data);

        if (result == null) {
            logger.error('klaviyoServices.KlaviyoSubscribeProfilesService subscribe call for email returned null result');
        }

        if (!result.ok === true) {
            logger.error('klaviyoServices.KlaviyoSubscribeProfilesService subscribe call for email error: ' + result.errorMessage);
            // check to see if the reason the call failed was because of Klaviyo's internal phone number validation.  if so, resend without phone number
            var errObj = JSON.parse(result.errorMessage);
            if (result.error == 400 && errObj.errors[0].source.pointer == 'phone_number') {
                data.data.attributes.subscriptions[0].phone_number = null;
                result = klaviyoServices.KlaviyoSubscribeProfilesService.call(data);
                if (result == null) {
                    logger.error('klaviyoServices.KlaviyoSubscribeProfilesService subscribe call for email returned null result on second attempt without phone number');
                }
                if (!result.ok === true) {
                    logger.error('klaviyoServices.KlaviyoSubscribeProfilesService subscribe call for email on second attempt without phone number, error: ' + result.errorMessage);
                }
            }
        }
    }

    if (session.custom.KLSmsSubscribe && smsListID && phone) {
        data = { data: {
            type       : 'profile-subscription-bulk-create-job',
            attributes : {
                list_id       : smsListID,
                custom_source : 'SFCC Checkout',
                subscriptions : [{
                    channels     : { sms: ['MARKETING'] },
                    email        : email,
                    phone_number : phone
                }]
            }
        } };

        result = klaviyoServices.KlaviyoSubscribeProfilesService.call(data);

        if (result == null) {
            logger.error('klaviyoServices.KlaviyoSubscribeProfilesService subscribe call for SMS returned null result');
        }

        if (!result.ok === true) {
            logger.error('klaviyoServices.KlaviyoSubscribeProfilesService subscribe call for SMS error: ' + result.errorMessage);
        }
    }
}

module.exports = {
    EVENT_NAMES           : EVENT_NAMES,
    klaviyoEnabled        : klaviyoEnabled,
    KLImageSize           : KLImageSize,
    getKlaviyoExchangeID  : getKlaviyoExchangeID,
    getProfileInfo        : getProfileInfo,
    prepareDebugData      : prepareDebugData,
    dedupeArray           : dedupeArray,
    captureProductOptions : captureProductOptions,
    captureProductBundles : captureProductBundles,
    captureBonusProduct   : captureBonusProduct,
    priceCheck            : priceCheck,
    getRootPriceBook      : getRootPriceBook,
    trackEvent            : trackEvent,
    subscribeUser         : subscribeUser
};
