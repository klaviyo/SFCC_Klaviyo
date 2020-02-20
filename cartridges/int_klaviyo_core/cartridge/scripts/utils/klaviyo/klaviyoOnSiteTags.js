var klCustomer = new Object();
var viewedProductObj = new Object();
var checkoutObj = new Object();
var cartObj = new Object();
var categoryObj = new Object();
var searchObj = new Object();
var klaviyoTagUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoTagUtils.js');
var learnq = 'var _learnq = _learnq || [];';

function klaviyoOnSiteTags(klData, currentUser) {
    // identify call for passing over user info for logged in users
    if (currentUser && currentUser.email) {
        klCustomer = klaviyoTagUtils.setCustomerDetails(currentUser);
        var userReturnString = learnq.concat(" _learnq.push(['identify'," + JSON.stringify(klCustomer) + ']);');
        return userReturnString;
    }

    if (klData.event == 'Viewed Product') {
        viewedProductObj = klaviyoTagUtils.prepareViewedProductObject(klData);
        var viewProdReturnString = learnq.concat(" _learnq.push(['track', 'Viewed Product', " + JSON.stringify(viewedProductObj) +
    ']);');
        return viewProdReturnString;
    }

    if (klData.event == 'Started Checkout') {
        checkoutObj = klaviyoTagUtils.prepareCheckoutObj(klData);
        klCustomer.$email = klData.$email;
        var startCheckoutReturnString = learnq.concat(" _learnq.push(['identify'," + JSON.stringify(klCustomer) + ']);');
        startCheckoutReturnString.concat(" _learnq.push(['track', 'Checkout Started', " + JSON.stringify(checkoutObj) +
    ']);');
        return startCheckoutReturnString;
    }

    if (klData.event == 'Added to Cart') {
        cartObj = klaviyoTagUtils.prepareAddToCartObj(klData);
        var cartReturnString = learnq.concat(" _learnq.push(['track', 'Add to Cart', " + JSON.stringify(cartObj) +
    ']);');
        return cartReturnString;
    }

    if (klData.event == 'Viewed Category') {
        categoryObj['Viewed Category'] = klData.pageCategoryId;
        var catReturnString = learnq.concat(" _learnq.push(['track', 'Viewed Category', " +
        JSON.stringify(categoryObj) + ']);');
        return catReturnString;
    }

    if (klData.event == 'Searched Site') {
        searchObj['Search Term'] = klData.searchTerm;
        searchObj['Search Results Count'] = klData.searchResultsCount;
        var searchReturnString = learnq.concat(" _learnq.push(['track', 'Site Search', " + JSON.stringify(searchObj) +
    ']);');
        return searchReturnString;
    }

    // identify call for logged-in users (new registrations)
    if (currentUser != null && currentUser.email != null) {
        var currentUserReturnString = learnq.concat(" _learnq.push(['identify'," + JSON.stringify(currentUser.email) + ']);');
        return currentUserReturnString;
    }
}

module.exports = {
    klaviyoOnSiteTags: klaviyoOnSiteTags
};
