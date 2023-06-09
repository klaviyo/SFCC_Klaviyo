'use strict';

var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');


server.append('Show', function (req, res, next) {
    if (klaviyoUtils.klaviyoEnabled && !klaviyoUtils.getKlaviyoExchangeID()) {
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }

    next();
});


module.exports = server.exports();
