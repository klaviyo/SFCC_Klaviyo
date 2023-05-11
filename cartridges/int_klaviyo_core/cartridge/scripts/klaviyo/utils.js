'use strict';

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');

var klaviyoServices = require('*/cartridge/scripts/klaviyo/services.js');

// event name constants
// TODO: currently crossover with WHITELISTED_EVENTS below - square them when answers are found to why WHITELISTED_EVENTS exists

var EVENT_NAMES = {
    'viewedProduct' : 'Viewed Product',
    'viewedCategory' : 'Viewed Category',
    'searchedSite' : 'Searched Site',
    'addedToCart' : 'Added to Cart',
    'startedCheckout' : 'Started Checkout',
    'orderConfirmation' : 'Order Confirmation',
    'placedOrder' : 'Placed Order',
    'orderedProduct' : 'Ordered Product'
};

var klaviyoEnabled = Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled') || false;
var KLImageSize = Site.getCurrent().getCustomPreferenceValue('klaviyo_image_size') || 'large';


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

function trackEvent(exchangeID, data, event, customerEmail) {

    var requestBody = {};
    var resultObj = {};

    var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core utils.js - trackEvent()');

    if (klaviyoServices.KlaviyoEventService == null || empty(exchangeID)) {
        logger.error('trackEvent() failed - KlaviyoEventService or exchange_id is null.  exchange_id: ' + exchangeID + '.');
        return;
    }

    var metricObj = {
        "name": event
    }
    /* IMPORTANT:
        If the klaviyo_sendEventsAsSFCC site preference has been set to Yes (true) events will show up in the Klaviyo Dashboard with SFCC as the event provider.
        Generally speaking this should only be set to Yes if this is a brand new Klaviyo integration - if there is a previous integration with Klaviyo for
        this site that did not label events with SFCC as provider there will be a break in reporting and functionality between past events that were not
        labelled with SFCC as provider and the new events that are.  If in doubt, leave the site preference set to No and contact Klaviyo technical support.
    */
    if(Site.getCurrent().getCustomPreferenceValue('klaviyo_sendEventsAsSFCC')) {
        metricObj.service = "demandware"
    }

    var profileObj = {};
    if(!customerEmail) {
        profileObj = { "$exchange_id": exchangeID }
    } else {
        profileObj = { "$email": customerEmail }
    }

    var eventData = {
        "data": {
            "type": "event",
            "attributes": {
                "profile": profileObj,
                "metric": metricObj,
                "properties" : data,
                "time": (new Date()).toISOString()
                // value: 9.99 // TODO - figure out when this can be set and what it should be set to ie, product price, cart total, order total, etc
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
    } else {
        return JSON.parse(result.errorMessage);
    }
}




module.exports = {
    EVENT_NAMES : EVENT_NAMES,
    klaviyoEnabled : klaviyoEnabled,
    KLImageSize : KLImageSize,
    getKlaviyoExchangeID : getKlaviyoExchangeID,
    getProfileInfo : getProfileInfo,
    prepareDebugData : prepareDebugData,
    dedupeArray: dedupeArray,
    trackEvent : trackEvent
}