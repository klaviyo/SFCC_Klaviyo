'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {

    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){

        var klaviyoScripts = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');
        var exchange_id = klaviyoScripts.getKlaviyoExchangeID();

        if (exchange_id) {
            var data = klaviyoScripts.klaviyoViewedProductData(res.viewData.product.id);
            var serviceCallResult = klaviyoScripts.trackEvent(exchange_id, data, 'Viewed Product');
        }

    }
    next();
});


module.exports = server.exports();