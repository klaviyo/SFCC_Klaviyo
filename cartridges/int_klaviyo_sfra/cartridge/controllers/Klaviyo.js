'use strict';

var server = require('server');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var viewedProductData = require('*/cartridge/scripts/klaviyo/eventData/viewedProduct');
var viewedCategoryData = require('*/cartridge/scripts/klaviyo/eventData/viewedCategory');
var searchedSiteData = require('*/cartridge/scripts/klaviyo/eventData/searchedSite');

var StringUtils = require('dw/util/StringUtils');

/***
 *
 * NOTE: the Klaviyo-Event route exists to support event tracking on pages whose OOTB SFCC controllers are cached by default
 * to avoid caching event data, the Klaviyo-Event route is called via remote include in KlaviyoTag.isml.
 * for event tracking on pages whose controllers are not cached OOTB, server.appends to those OOTB controllers should be utilized
 * reference Cart.js, Checkout.js, Order.js in the int_klaviyo_sfra cartridge
 *
 * Also note that this route gets called via remote include for Home-Show, Page-Show and Default-Start only to check for identifying users to Klaviyo off the user's SFCC Profile
***/


// TODO: any partcular middleware need here?

server.get('Event', function (req, res, next) {

    if(klaviyoUtils.klaviyoEnabled){

        var dataObj, serviceCallResult, action, parms;
        var kx = request.httpParameterMap.kx;
        var isKlDebugOn = request.httpParameterMap.kldebug.booleanValue; // TODO: Remove this comment. Be sure this variable is also added into the Checkout & Add TO cart as well Order Confirmation, etc.
        var exchangeID = (!kx.empty) ? kx.stringValue : klaviyoUtils.getKlaviyoExchangeID();

        if (exchangeID) { // we have a klaviyo ID, proceed to track events
            action = request.httpParameterMap.action.stringValue;
            parms = request.httpParameterMap.parms.stringValue;

            if(action != 'false') { // string test intentional, action passed as 'false' for pages that do not need to trigger events (Home, Page, Default)
                switch(action) {
                    case klaviyoUtils.EVENT_NAMES.viewedProduct :
                        dataObj = viewedProductData.getData(parms); // parms: product ID
                        break;
                    case klaviyoUtils.EVENT_NAMES.viewedCategory :
                        dataObj = viewedCategoryData.getData(parms); // parms: category ID
                        break;
                    case klaviyoUtils.EVENT_NAMES.searchedSite :
                        // TODO: add Show-Ajax append?  test to be sure when this happens... if its just on paging, do we want to track that?
                        // TODO: what about search-suggestion flyout? probably not supportable
                        // TODO: be sure to check for 0 result searches, filtering on both search results and PLPs, re-sorts, etc and get clarity on requirements
                        parms = parms.split('|');
                        dataObj = searchedSiteData.getData(parms[0], parms[1]); // parms: search phrase, result count
                        break;
                }
                // TODO: clean up the following debugging / comments for notes.
                // this is where we call the util function to check if klDebug=true
                // if isKlDebugOn === true...then do this...
                    // can do res.viewData.klDebugData = prepareDebugData(dataObj)
                        // the prepareDebugData utility function will JSON.stringify  the data obj...then base 64Encode that stringified object.
                        // JSON.stringify(getDataObj)
                if (isKlDebugOn) {
                    res.viewData.klDebugData = klaviyoUtils.prepareDebugData(dataObj);
                    res.render('klaviyo/klaviyoDebug') // TODO: Delete this comment!! THIS WILL NOT OCCUR in Checkout or AddProduct or Confirmation...Because we don't need this template in these cases (is rendered through klaviyoFooter through those paths).
                    next()
                    return;
                }


                serviceCallResult = klaviyoUtils.trackEvent(exchangeID, dataObj, action);
                // TODO: need to do anything here with the service call result, or handle all errs etc within trackEvent? otherwise no need to assign to a var / return a value

                // TODO: remove debugging comments & notes in following lines.
                // take service call result...run it through prepareDebugData(serviceCallResult)
                    // that'll base64 encode...
                    // res.viewData.klServiceDebugData...that'll make it available to the template layer...
                // res.viewData.serviceCallResult = klaviyoUtils.prepareDebugData(serviceCallResult)
            }
        } else {
            // no klaviyo ID, check for SFCC profile and ID off that if extant
            res.viewData.klid = klaviyoUtils.getProfileInfo();
        }

    }

    res.render('klaviyo/klaviyoEmpty') // we don't need to render anything here, but SFRA requires a .render to be called
    next();
});


module.exports = server.exports();
