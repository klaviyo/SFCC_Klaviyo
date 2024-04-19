'use strict';

var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var siteId = klaviyoUtils.siteId;

// prepares data for "Viewed Category" event
function getData(categoryID) {
    return { 'SiteID': siteId, 'Viewed Category': categoryID };
}


module.exports = {
    getData: getData
};
