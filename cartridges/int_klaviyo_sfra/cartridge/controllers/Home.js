'use strict';

var server = require('server');
var klaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoUtils');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    if(dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled') && !klaviyoUtils.getKlaviyoExchangeID()){
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }
    next();
});


module.exports = server.exports();