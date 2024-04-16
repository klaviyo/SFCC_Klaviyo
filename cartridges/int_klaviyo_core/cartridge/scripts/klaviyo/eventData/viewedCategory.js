'use strict';

var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

// prepares data for "Viewed Category" event
function getData(categoryID) {
    return { 'SiteID': klaviyoUtils.siteId, 'Viewed Category': categoryID };
}


module.exports = {
    getData: getData
};
