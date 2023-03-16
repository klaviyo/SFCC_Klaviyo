'use strict';

var server = require('server');

server.extend(module.superModule);

// TODO: add Show-Ajax append?  test to be sure when this happens... if its just on paging, do they want to track that?
// TODO: what about search-suggestion flyout?
// TODO: be sure to check for 0 result searches, filtering on both search results and PLPs, re-sorts, etc

server.append('Show', function (req, res, next) {

    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){

        var klaviyoScripts = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
        var exchange_id = klaviyoScripts.getKlaviyoExchangeID();
        var data, serviceCallResult;

        if (exchange_id) {
            if(req.querystring.cgid) { // category page (PLP)
                data = klaviyoScripts.viewedCategoryData(req.querystring.cgid);
                serviceCallResult = klaviyoScripts.trackEvent(exchange_id, data, 'Viewed Category');
            } else if(res.viewData.apiProductSearch) { // search results page
                data = klaviyoScripts.searchedSiteData(res.viewData.apiProductSearch.searchPhrase, res.viewData.apiProductSearch.count);
                serviceCallResult = klaviyoScripts.trackEvent(exchange_id, data, 'Searched Site');
            }
        }

    }
    next();
});


module.exports = server.exports();