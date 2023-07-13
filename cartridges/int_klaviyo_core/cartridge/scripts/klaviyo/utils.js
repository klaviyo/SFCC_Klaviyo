'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

/* Script Modules */
var klaviyoServices = require('*/cartridge/scripts/klaviyo/services.js');

// event name constants
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

var klaviyoEnabled = Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled') || false;
var KLImageSize = Site.getCurrent().getCustomPreferenceValue('klaviyo_image_size') || 'large';


// looks for klaviyo's cookie and if found extracts the exchangeID from it, returning that value
// if the cookie is not found or exchangeID extraction fails, returns false
function getKlaviyoExchangeID() {
    if ('__kla_id' in request.httpCookies && !empty(request.httpCookies['__kla_id'])) {
        var kx = JSON.parse(StringUtils.decodeBase64(request.httpCookies['__kla_id'].value)).$exchange_id;
        return (kx && kx != '') ? kx : false;
    }
    return false;
}


// gets SFCC profile info (if available) to use for IDing user to klaviyo
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


// This takes data passed from the controller and encodes it so it can be used when Klaviyo's Debugger mode has been activated (ex: when including 'kldebug=true' as a URL query)
// Data from this is available in the following Events: 'Viewed Product', 'Viewed Category', 'Searched Site', 'Added to Cart' and 'Started Checkout'.
function prepareDebugData(obj) {
    var stringObj = JSON.stringify(obj);
    var encodedDataObj = StringUtils.encodeBase64(stringObj);

    return encodedDataObj;
}


// helper function used in .getData functions to dedupe values in arrays (particularly product category lists)
function dedupeArray(items) {
    var unique = {};
    items.forEach(function (i) {
        if (!unique[i]) {
            unique[i] = true;
        }
    });
    return Object.keys(unique);
}


// helper function to extract product options and return each selected option into an object with five keys: 'Line Item Text', 'Option ID' and 'Option Value ID', 'Option Price' and 'Option Price Value.
// This helper accomodates products that may have been configured with or feature multiple options by returning an array of each selected product option as its own optionObj.
function captureProductOptions(prodOptions) {
    var options = Array.isArray(prodOptions) ? prodOptions : Array.from(prodOptions);
    var selectedOptions = [];

    options.forEach(function (optionObj) {
        var formattedOptionPrice = optionObj ? StringUtils.formatMoney(dw.value.Money(optionObj.basePrice.value, session.getCurrency().getCurrencyCode())) : null;
        selectedOptions.push({
            'Line Item Text'     : optionObj.lineItemText,
            'Option ID'          : optionObj.optionID,
            'Option Value ID'    : optionObj.optionValueID,
            'Option Price'       : formattedOptionPrice,
            'Option Price Value' : optionObj.basePrice.value
        });
    });

    return selectedOptions;
}


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


// helper function to consider promos & set Price and Original Pride properties on a returned object.
// Used in order level events: 'Started Checkout' and 'Order Confirmation'.
function priceCheck(lineItemObj, basketProdObj) {
    var priceModel = basketProdObj ? basketProdObj.getPriceModel() : null;
    var priceBook = priceModel ? getRootPriceBook(priceModel.priceInfo.priceBook) : null;
    var priceBookPrice = priceBook && priceModel ? priceModel.getPriceBookPrice(priceBook.ID) : null;
    var priceData = {};

    var adjustedPromoPrice = lineItemObj && lineItemObj.adjustedPrice < priceBookPrice ? StringUtils.formatMoney(dw.value.Money(lineItemObj.adjustedPrice.value, session.getCurrency().getCurrencyCode())) : null;
    if (adjustedPromoPrice) {
        priceData.purchasePrice = StringUtils.formatMoney(dw.value.Money(lineItemObj.adjustedPrice.value, session.getCurrency().getCurrencyCode()));
        priceData.purchasePriceValue = lineItemObj.adjustedPrice.value;
        priceData.originalPrice = priceBookPrice ? StringUtils.formatMoney(dw.value.Money(priceBookPrice.value, session.getCurrency().getCurrencyCode())) : StringUtils.formatMoney(dw.value.Money(basketProdObj.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode()));
        priceData.originalPriceValue = priceBookPrice.value;
    } else {
        priceData.purchasePrice = lineItemObj ? StringUtils.formatMoney(dw.value.Money(lineItemObj.price.value, session.getCurrency().getCurrencyCode())) : null;
        priceData.purchasePriceValue = lineItemObj ? lineItemObj.price.value : null;
        priceData.originalPrice = basketProdObj ? StringUtils.formatMoney(dw.value.Money(basketProdObj.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode())) : null;
        priceData.originalPriceValue = basketProdObj.getPriceModel().getPrice().value;
    }

    return priceData;
}


/**
 * Return root price book for a given price book
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

    var profileObj = {};
    if (!customerEmail) {
        profileObj = { $exchange_id: exchangeID };
    } else {
        profileObj = { $email: customerEmail };
    }

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
