'use strict';

var server = require('server');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

server.extend(module.superModule);

// TODO: willing to bet this doesn't work with cache on!!! have to shift to remote include Klaviyo.js.  Same for Search, check others!

server.append('Show', function (req, res, next) {
    if(klaviyoUtils.klaviyoEnabled && !klaviyoUtils.getKlaviyoExchangeID()){
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }
    next();
});


module.exports = server.exports();