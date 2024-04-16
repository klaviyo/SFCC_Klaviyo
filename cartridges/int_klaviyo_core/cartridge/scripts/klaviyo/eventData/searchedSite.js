'use strict';

var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');

// prepares data for "Searched Site" event
function getData(term, count) {
    return {
        'SiteID'               : klaviyoUtils.siteId,
        'Search Term'          : term,
        'Search Results Count' : count
    };
}


module.exports = {
    getData: getData
};
