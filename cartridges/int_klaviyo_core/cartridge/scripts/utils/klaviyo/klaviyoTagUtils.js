'use strict';

/**
 * This script provides utility functions for klaviyoTag isml fle.
 */


// prepare viewed product event's data for klaviyo

function prepareViewedProductObject(klData) {
    var viewedProductObj = new Object();
    viewedProductObj['Product Name'] = klData.viewedProductName;
    viewedProductObj['Product Image URL'] = !empty(klData.viewedProductImage) ? klData.viewedProductImage.toString() : '';
    viewedProductObj['Product ID'] = klData.viewedProductID.toString();
    viewedProductObj['Product Description'] = klData.viewedProductDesc;
    viewedProductObj.Price = klData.viewedProductPrice.toString();
    viewedProductObj['Product Page URL'] = klData.viewedProductPageURL;
    viewedProductObj['Product UPC'] = klData.viewedProductUPC;
    // viewedProductObj["Product Availability Model"] = klData.viewedProductAvailability;
    viewedProductObj.Categories = klData.viewedProductCategories;
    viewedProductObj['Primary Category'] = klData.viewedProductPrimaryCategory;
    return klData;
}


// prepare checkout product event's data for klaviyo

function prepareCheckoutObj(klData) {
    var checkoutObj = new Object();
    checkoutObj.Items = klData.Items;
    checkoutObj.line_items = klData.line_items;
    checkoutObj.$value = klData['Basket Gross Price'].toString();
    checkoutObj.itemCount = klData['Item Count'].toString();
    checkoutObj.Categories = klData.Categories;
    return checkoutObj;
}

// prepare checkout add to cart  event's data for klaviyo

function prepareAddToCartObj(klData) {
    var cartObj = new Object();
    cartObj.Items = klData.items;
    cartObj.line_items = klData.lineItems;
    cartObj.Categories = klData.categories;
    cartObj['Primary Categories'] = klData.primaryCategories;
    cartObj.$value = klData.basketGross;
    cartObj['Item Count'] = klData.itemCount.toString();
    return cartObj;
}


//  Setting customer basic details and information to klaviyo


function setCustomerDetails(currentUser) {
    var klCustomer = new Object();
    klCustomer.$email = currentUser.email;
    klCustomer.$first_name = currentUser.firstName || null;
    klCustomer.$last_name = currentUser.lastName || null;
    klCustomer.Birthday = currentUser.birthday ? currentUser.birthday : null;
    klCustomer['Customer No'] = currentUser.customerNo || null;

    if (currentUser.addressBook.preferredAddress) {
        var currentUserAddress = currentUser.addressBook.preferredAddress;
        klCustomer.address1 = currentUserAddress.address1;
        klCustomer.address2 = currentUserAddress.address2;
        klCustomer.$city = currentUserAddress.city;
        klCustomer.$region = currentUserAddress.stateCode;
        klCustomer.$country = currentUserAddress.countryCode;
        klCustomer.$zip = currentUserAddress.postalCode;
    }
    return klCustomer;
}

module.exports = {
    prepareViewedProductObject : prepareViewedProductObject,
    prepareCheckoutObj         : prepareCheckoutObj,
    prepareAddToCartObj        : prepareAddToCartObj,
    setCustomerDetails         : setCustomerDetails
};
