'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {

    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){

        var klaviyoScripts = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
        var exchange_id = klaviyoScripts.getKlaviyoExchangeID();

        if (exchange_id) {
            if(req.querystring.cgid) { // category page (PLP)
                var data = klaviyoScripts.viewedCategoryData(req.querystring.cgid);
                var serviceCallResult = klaviyoScripts.trackEvent(exchange_id, data, 'Viewed Category');
            } else { // search results page

            }
        }

    }
    next();
});


module.exports = server.exports();