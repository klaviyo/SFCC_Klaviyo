'use strict';

var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var siteId = klaviyoUtils.siteId;
// prepares data for "Searched Site" event
function getData(term, count) {
    return {
        'CustomerSiteID'               : siteId,
        'Search Term'          : term,
        'Search Results Count' : count
    };
}


module.exports = {
    getData: getData
};
