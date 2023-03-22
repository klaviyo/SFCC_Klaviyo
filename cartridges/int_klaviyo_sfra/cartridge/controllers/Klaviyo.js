'use strict';

var server = require('server');
var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');

/***
 * 
 * NOTE: the Klaviyo-Event route exists to support event tracking on pages whose OOTB SFCC controllers are cached by default
 * to avoid caching, the Klaviyo-Event route is called via remote include in KlaviyoTag.isml
 * for event tracking on pages whose controllers are not cached OOTB, server.appends to those OOTB controllers should be utilized
 * 
***/ 


// TODO: any partcular middleware need here?

server.get('Event', function (req, res, next) {
    var profileInfo;
    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){

        var dataObj, serviceCallResult, action, parms;
        var exchangeID = klaviyoUtils.getKlaviyoExchangeID();

        if (exchangeID) {
            action = request.httpParameterMap.action.stringValue;
            parms = request.httpParameterMap.parms.stringValue;

            switch(action) {
                case klaviyoUtils.EVENT_NAMES.viewedProduct :
                    dataObj = klaviyoUtils.viewedProductData(parms); // parms: product ID
                    break;
                case klaviyoUtils.EVENT_NAMES.viewedCategory :
                    dataObj = klaviyoUtils.viewedCategoryData(parms); // parms: category ID
                    break;
                case klaviyoUtils.EVENT_NAMES.searchedSite :
                    // TODO: add Show-Ajax append?  test to be sure when this happens... if its just on paging, do we want to track that?
                    // TODO: what about search-suggestion flyout? probably not supportable
                    // TODO: be sure to check for 0 result searches, filtering on both search results and PLPs, re-sorts, etc and get clarity on requirements
                    parms = parms.split('|');
                    dataObj = klaviyoUtils.searchedSiteData(parms[0], parms[1]); // parms: search phrase, result count
                    break;
            }
            serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, action);
            // TODO: need to do anything here with the service call result, or handle all errs etc within trackEvent? otherwise no need to assign to a var / return a value
        } else {
            res.viewData.klid = klaviyoUtils.getProfileInfo();
        }

    }
    res.render('klaviyo/klaviyoBlank', {});
    next();
});


module.exports = server.exports();