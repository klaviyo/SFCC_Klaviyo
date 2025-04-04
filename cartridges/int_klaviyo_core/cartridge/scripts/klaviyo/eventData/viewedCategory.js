'use strict';

var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var siteId = klaviyoUtils.siteId;

// prepares data for "Viewed Category" event
function getData(categoryID) {
    return klaviyoUtils.setSiteIdAndIntegrationInfo({ 'Viewed Category': categoryID }, siteId);
}


module.exports = {
    getData: getData
};
