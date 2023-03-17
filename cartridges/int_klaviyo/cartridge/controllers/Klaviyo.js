'use strict';

/* Script Modules */
var guard = require('*/cartridge/scripts/guard');

/* eslint-disable */
var r = require("*/cartridge/scripts/util/Response");
/* eslint-enable */

/* API Includes */
var ISML = require('dw/template/ISML');

/**
 * Controller that sends the necessary data required for klaviyo to track user events
 * such as checkout, order confirmation, searching etc and renders the renders the klaviyoTag isml file
 *
 * @module controllers/Klaviyo
 */

var Event = function () {

    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){

        var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();
        var dataObj, serviceCallResult, action, parms;

        if (exchangeID) {
            action = request.httpParameterMap.action.stringValue;
            parms = request.httpParameterMap.parms.stringValue;

            switch(action) {
                case klaviyoUtils.EVENT_NAMES.viewedProduct :
                    dataObj = klaviyoUtils.viewedProductData(parms); // parms: product ID
                    serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, 'Viewed Product');
                    break;
                case klaviyoUtils.EVENT_NAMES.viewedCategory :
                    dataObj = klaviyoUtils.viewedCategoryData(parms); // parms: category ID
                    serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, 'Viewed Category');
                    break;
                case klaviyoUtils.EVENT_NAMES.searchedSite :
                    // TODO: add Show-Ajax append?  test to be sure when this happens... if its just on paging, do we want to track that?
                    // TODO: what about search-suggestion flyout? probably not supportable
                    // TODO: be sure to check for 0 result searches, filtering on both search results and PLPs, re-sorts, etc and get clarity on requirements
                    parms = parms.split('|');
                    dataObj = klaviyoUtils.searchedSiteData(parms[0], parms[1]); // parms: search phrase, result count
                    serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, 'Searched Site');
                    break;
            }

        }

    }

};


exports.RenderKlaviyo = guard.ensure(['get'], Event);
