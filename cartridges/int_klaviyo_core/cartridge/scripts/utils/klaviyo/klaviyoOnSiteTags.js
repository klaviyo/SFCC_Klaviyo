// var klCustomer = new Object();
var viewedProductObj = new Object();
var checkoutObj = new Object();
var cartObj = new Object();
var categoryObj = new Object();
var searchObj = new Object();
var klaviyoTagUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoTagUtils.js');

function klaviyoOnSiteTags(klData) {
    // identify call for passing over user info for logged in users
    // if (currentUser && currentUser.email) {
    //     klCustomer = klaviyoTagUtils.setCustomerDetails(currentUser);
    //     var userReturnString = learnq.concat(" _learnq.push(['identify'," + JSON.stringify(klCustomer) + ']);');
    //     return userReturnString;
    // }

    if (klData.event === 'Viewed Product') {
        viewedProductObj.data = klaviyoTagUtils.prepareViewedProductObject(klData);
        viewedProductObj.eventType = 'track';
        viewedProductObj.eventName = klData.event;
        return JSON.stringify(viewedProductObj);
    }

    if (klData.event === 'Started Checkout') {
        checkoutObj.data = klaviyoTagUtils.prepareCheckoutObj(klData);
        checkoutObj.eventType = 'track';
        checkoutObj.eventName = klData.event;
        return JSON.stringify(checkoutObj);
    }

    if (klData.event === 'Added to Cart') {
        cartObj.data = klaviyoTagUtils.prepareAddToCartObj(klData);
        cartObj.eventType = 'track';
        cartObj.eventName = klData.event;
        return JSON.stringify(cartObj);
    }

    if (klData.event === 'Viewed Category') {
        categoryObj.data = {};
        categoryObj.data['Viewed Category'] = klData.pageCategoryId;
        categoryObj.eventType = 'track';
        categoryObj.eventName = klData.event;
        return JSON.stringify(categoryObj);
    }

    if (klData.event === 'Searched Site') {
        searchObj.data = {};
        searchObj.data['Search Term'] = klData.searchTerm;
        searchObj.data['Search Results Count'] = klData.searchResultsCount;
        searchObj.eventType = 'track';
        searchObj.eventName = klData.event;
        return JSON.stringify(searchObj);
    }

    // identify call for logged-in users (new registrations)
    // if (currentUser != null && currentUser.email != null) {
    //     var currentUserReturnString = learnq.concat(" _learnq.push(['identify'," + JSON.stringify(currentUser.email) + ']);');
    //     return currentUserReturnString;
    // }
}

module.exports = {
    klaviyoOnSiteTags: klaviyoOnSiteTags
};
