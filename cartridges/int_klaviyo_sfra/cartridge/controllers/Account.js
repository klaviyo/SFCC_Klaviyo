'use strict';

var server = require('server');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    if(klaviyoUtils.klaviyoEnabled && !klaviyoUtils.getKlaviyoExchangeID()){
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }
    next();
});


module.exports = server.exports();