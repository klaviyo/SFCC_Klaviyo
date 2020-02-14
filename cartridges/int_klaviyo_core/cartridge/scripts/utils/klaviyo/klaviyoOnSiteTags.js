var klCustomer = new Object();
var viewedProductObj = new Object();
var checkoutObj = new Object();
var cartObj = new Object();
var categoryObj = new Object();
var searchObj = new Object();
var klaviyoTagUtils = require('*/cartridge/scripts/utils/klaviyo/klaviyoTagUtils.js');

function klaviyoOnSiteTags(klData, currentUser) {
    // identify call for passing over user info for logged in users
    if (currentUser && currentUser.email) {
        out.print('var _learnq = _learnq || [];');
        klCustomer = klaviyoTagUtils.setCustomerDetails(currentUser);
        out.print("_learnq.push(['identify'," + JSON.stringify(klCustomer) + ']);');
    }

    if (klData.event == 'Viewed Product') {
        out.print('var _learnq = _learnq || [];');
        viewedProductObj = klaviyoTagUtils.prepareViewedProductObject(klData);
        out.print("_learnq.push(['track', 'Viewed Product', " + JSON.stringify(viewedProductObj) +
    ']);');
    }

    if (klData.event == 'Started Checkout') {
        checkoutObj = klaviyoTagUtils.prepareCheckoutObj(klData);
        klCustomer.$email = klData.$email;
        out.print('var _learnq = _learnq || [];');
        out.print("_learnq.push(['identify'," + JSON.stringify(klCustomer) + ']);');
        out.print("_learnq.push(['track', 'Checkout Started', " + JSON.stringify(checkoutObj) +
    ']);');
    }

    if (klData.event == 'Added to Cart') {
        cartObj = klaviyoTagUtils.prepareAddToCartObj(klData);
        out.print('var _learnq = _learnq || [];');
        out.print("_learnq.push(['track', 'Add to Cart', " + JSON.stringify(cartObj) +
    ']);');
    }

    if (klData.event == 'Viewed Category') {
        categoryObj['Viewed Category'] = klData.pageCategoryId;
        out.print('var _learnq = _learnq || [];');
        out.print("_learnq.push(['track', 'Viewed Category', " + JSON.stringify(categoryObj) +
    ']);');
    }

    if (klData.event == 'Searched Site') {
        searchObj['Search Term'] = klData.searchTerm;
        searchObj['Search Results Count'] = klData.searchResultsCount;
        out.print('var _learnq = _learnq || [];');
        out.print("_learnq.push(['track', 'Site Search', " + JSON.stringify(searchObj) +
    ']);');
    }

    // identify call for logged-in users (new registrations)
    if (currentUser != null && currentUser.email != null) {
        out.print('var _learnq = _learnq || [];');
        out.print("_learnq.push(['identify'," + JSON.stringify(currentUser.email) + ']);');
    }
}

module.exports = {
    klaviyoOnSiteTags: klaviyoOnSiteTags
};
