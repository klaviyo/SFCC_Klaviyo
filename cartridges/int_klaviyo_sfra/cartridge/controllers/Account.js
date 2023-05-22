'use strict';

var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

/***
 * KL IDENTIFY:
 * If we don't have a KL exchange ID, check to see if we have a logged in SFCC user/profile and ID off of that.
 * Note: This is the Account page Show method, only accessible if the user is logged in and unless customized by the client is the
 *  default landing page post-login... so in most cases it will definitely ID the user if they aren't previously cookied by Klaviyo
***/
server.append('Show', function (req, res, next) {
    if(klaviyoUtils.klaviyoEnabled && !klaviyoUtils.getKlaviyoExchangeID()){
        res.viewData.klid = klaviyoUtils.getProfileInfo();
    }

    next();
});


module.exports = server.exports();
