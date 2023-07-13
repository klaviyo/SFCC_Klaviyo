'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');

/* Script Modules */
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var KLImageSize = klaviyoUtils.KLImageSize;


/**
 * Prepares the order in JSON format for email send.
 * @param order
 * @returns
 */
function getData(order) {
    var data;
    try {
        data = {};

        // Billing Address
        var orderBillingAddressFirstName = order.billingAddress.firstName ? order.billingAddress.firstName : '';
        var orderBillingAddressLastName = order.billingAddress.lastName ? order.billingAddress.lastName : '';
        var orderBillingAddressAddress1 = order.billingAddress.address1 ? order.billingAddress.address1 : '';
        var orderBillingAddressAddress2 = order.billingAddress.address2 ? order.billingAddress.address2 : '';
        var orderBillingAddressCity = order.billingAddress.city ? order.billingAddress.city : '';
        var orderBillingAddressStateCode = order.billingAddress.stateCode ? order.billingAddress.stateCode : '';
        var orderBillingAddressCountryCode = order.billingAddress.countryCode.value ? order.billingAddress.countryCode.value : '';
        var orderBillingAddressPhone = order.billingAddress.phone ? order.billingAddress.phone : '';

        // Shipping address
        var orderShippingAddressFirstName = '';
        var orderShippingAddressLastName = '';
        var orderShippingAddressAddress1 = '';
        var orderShippingAddressAddress2 = '';
        var orderShippingAddressCity = '';
        var orderShippingAddressPostalCode = '';
        var orderShippingAddressStateCode = '';
        var orderShippingAddressCountryCode = '';
        var orderShippingAddressPhone = '';
        var productLineItems = '';
        var paymentInstruments = '';

        if (order.shipments.length > 0) {
            // Shipping Address
            orderShippingAddressFirstName = order.shipments[0].shippingAddress.firstName ? order.shipments[0].shippingAddress.firstName : '';
            orderShippingAddressLastName = order.shipments[0].shippingAddress.lastName ? order.shipments[0].shippingAddress.lastName : '';
            orderShippingAddressAddress1 = order.shipments[0].shippingAddress.address1 ? order.shipments[0].shippingAddress.address1 : '';
            orderShippingAddressAddress2 = order.shipments[0].shippingAddress.address2 ? order.shipments[0].shippingAddress.address2 : '';
            orderShippingAddressCity = order.shipments[0].shippingAddress.city ? order.shipments[0].shippingAddress.city : '';
            orderShippingAddressPostalCode = order.shipments[0].shippingAddress.postalCode ? order.shipments[0].shippingAddress.postalCode : '';
            orderShippingAddressStateCode = order.shipments[0].shippingAddress.stateCode ? order.shipments[0].shippingAddress.stateCode : '';
            orderShippingAddressCountryCode = order.shipments[0].shippingAddress.countryCode.value ? order.shipments[0].shippingAddress.countryCode.value : '';
            orderShippingAddressPhone = order.shipments[0].shippingAddress.phone ? order.shipments[0].shippingAddress.phone : '';

            // Product Details
            productLineItems = order.shipments[0].productLineItems;
            var productLineItem = {};
            var productLineItemsArray = [];
            var items = [];
            var itemCount = 0;
            var itemPrimaryCategories = [];
            var itemCategories = [];

            for (var j in productLineItems) {
                productLineItem = productLineItems[j];
                var prdUrl = '';
                prdUrl = URLUtils.https('Product-Show', 'pid', productLineItem.productID).toString();
                var secondaryName = '';

                // Get the product secondary name
                var lineItemProduct = productLineItem.product;
                var productDetail = ProductMgr.getProduct(lineItemProduct.ID);
                if (!productDetail) {
                    throw new Error('Product with ID [' + lineItemProduct.ID + '] not found');
                }

                // Variation values
                var variationValues = '';
                if (productDetail.isVariant()) {
                    var variationAttrs = productDetail.variationModel.getProductVariationAttributes();
                    for (var i = 0; i < variationAttrs.length; i++) {
                        var VA = variationAttrs[i];
                        var selectedValue = productDetail.variationModel.getSelectedValue(VA);
                        if (selectedValue) {
                            variationValues += selectedValue.displayValue;
                            if (i < variationAttrs.length - 1) {
                                variationValues += ' | ';
                            }
                        }
                    }
                }

                items.push(productLineItem.productID);
                itemCount += productLineItem.quantity.value;
                var allCategories;
                if (productDetail.variant) {
                    if (productDetail.masterProduct.getPrimaryCategory()) {
                        itemPrimaryCategories.push(
                            productDetail.masterProduct.getPrimaryCategory().displayName
                        );
                    }
                    allCategories = productDetail.masterProduct.getAllCategories();
                } else {
                    if (productDetail.getPrimaryCategory()) {
                        itemPrimaryCategories.push(
                            productDetail.getPrimaryCategory().displayName
                        );
                    }
                    allCategories = productDetail.getAllCategories();
                }

                if (!empty(allCategories) && allCategories.length > 0) {
                    var category = '';
                    for (var categoryCount = 0; categoryCount < allCategories.length; categoryCount++) {
                        category = allCategories[categoryCount];
                        itemCategories.push(category.displayName);
                    }
                }

                var currentLineItem = {
                    'Product ID'             : productLineItem.productID,
                    'Product Name'           : productLineItem.productName,
                    'Product Secondary Name' : secondaryName,
                    'Quantity'               : productLineItem.quantity.value,
                    'Discount'               : productLineItem.adjustedPrice.value,
                    'Product Page URL'       : prdUrl,
                    'Product Variant'        : variationValues,
                    'Product Image URL'      : KLImageSize ? productDetail.getImage(KLImageSize).getAbsURL().toString() : null
                };

                if (!productDetail.master && 'masterProduct' in productDetail) {
                    currentLineItem['Master Product ID'] = productDetail.masterProduct.ID;
                }

                var priceData = klaviyoUtils.priceCheck(productLineItem, productDetail);
                currentLineItem['Price'] = priceData.purchasePrice;
                currentLineItem['Price Value'] = priceData.purchasePriceValue;
                currentLineItem['Original Price'] = priceData.originalPrice;
                currentLineItem['Original Price Value'] = priceData.originalPriceValue;

                var selectedOptions = productLineItem && productLineItem.optionProductLineItems ? klaviyoUtils.captureProductOptions(productLineItem.optionProductLineItems) : null;
                if (selectedOptions && selectedOptions.length) {
                    currentLineItem['Product Options'] = selectedOptions;
                }

                if (productLineItem.bonusProductLineItem) {
                    var bonusProduct = klaviyoUtils.captureBonusProduct(productLineItem, productDetail);
                    currentLineItem['Is Bonus Product'] = bonusProduct.isbonusProduct;
                    currentLineItem['Original Price'] = bonusProduct.originalPrice;
                    currentLineItem['Original Price Value'] = bonusProduct.originalPriceValue;
                    currentLineItem['Price'] = bonusProduct.price;
                    currentLineItem['Price Value'] = bonusProduct.priceValue;
                }

                if (productLineItem.bundledProductLineItem || productLineItem.bundledProductLineItems.length) {
                    var prodBundle = klaviyoUtils.captureProductBundles(productLineItem.bundledProductLineItems);
                    currentLineItem['Is Product Bundle'] = prodBundle.isProdBundle;
                    currentLineItem['Bundled Product IDs'] = prodBundle.prodBundleIDs;
                }

                productLineItemsArray.push(currentLineItem);
            }

            // Get the coupon attached to the order
            var discountCoupon = '';
            var promotionID = '';
            var shippingLineItems = order.shipments[0].shippingLineItems;
            if (shippingLineItems && shippingLineItems.length > 0) {
                if (shippingLineItems[0].lineItemCtnr) {
                    var couponLineItems = shippingLineItems[0].lineItemCtnr.couponLineItems;
                    if (couponLineItems && couponLineItems.length > 0) {
                        for (var q in couponLineItems) {
                            if (couponLineItems[q].statusCode == 'APPLIED') {
                                discountCoupon = couponLineItems[q].couponCode;
                                if (!empty(couponLineItems[q].promotion)) {
                                    var promotion = couponLineItems[q].promotion;
                                    promotionID = promotion.ID;
                                }
                                break;
                            }
                        }
                    }
                }
            } else {
                discountCoupon = '';
            }

            // Payment Details
            paymentInstruments = order.paymentInstruments;
            var ccLastFourDigits = '';
            var creditCardType = '';
            var paymentInstrumentItem = {};
            for (var k in paymentInstruments) {
                paymentInstrumentItem = paymentInstruments[k];
                if (paymentInstrumentItem.creditCardNumberLastDigits) {
                    ccLastFourDigits = paymentInstrumentItem.maskedCreditCardNumber;
                    creditCardType = paymentInstrumentItem.creditCardType ? paymentInstrumentItem.creditCardType : '';
                }
            }

            // Order Total
            var merchTotalExclOrderDiscounts = order.getAdjustedMerchandizeTotalPrice(false);
            var merchTotalInclOrderDiscounts = order.getAdjustedMerchandizeTotalPrice(true);

            // discounts
            var orderDiscount = merchTotalExclOrderDiscounts.subtract(merchTotalInclOrderDiscounts);
            var orderDiscountString = dw.util.StringUtils.formatMoney(dw.value.Money(orderDiscount.value, session.getCurrency().getCurrencyCode()));

            // Sub Total
            var subTotal = merchTotalInclOrderDiscounts;
            var subTotalString = dw.util.StringUtils.formatMoney(dw.value.Money(subTotal.value, session.getCurrency().getCurrencyCode()));

            // Shipping
            var shippingExclDiscounts = order.shippingTotalPrice;
            var shippingInclDiscounts = order.getAdjustedShippingTotalPrice();
            var shippingDiscount = shippingExclDiscounts.subtract(shippingInclDiscounts);
            var shippingTotalCost = shippingExclDiscounts.subtract(shippingDiscount);
            var shippingTotalCostString = dw.util.StringUtils.formatMoney(dw.value.Money(shippingTotalCost.value, session.getCurrency().getCurrencyCode()));

            // Tax
            var totalTax = 0.0;
            if (order.totalTax.available) {
                totalTax = order.totalTax.value;
            }
            var totalTaxString = dw.util.StringUtils.formatMoney(
                dw.value.Money(totalTax, session.getCurrency().getCurrencyCode())
            );

            // Order Total
            var orderTotal = '';
            if (order.totalNetPrice.available) {
                orderTotal = order.totalNetPrice.value + totalTax;
            }
            var orderTotalString = dw.util.StringUtils.formatMoney(
                dw.value.Money(orderTotal, session.getCurrency().getCurrencyCode())
            );

            data['Order Total'] = orderTotalString;
            data['Tax'] = totalTaxString;
            data['Subtotal'] = subTotalString;
            data['Shipping Cost'] = shippingTotalCostString;
            if (orderDiscountString) {
                data['Discount'] = orderDiscountString;
            } else {
                data['Discount'] = '';
            }
        }

        // Order Details
        var orderCreationDate = dw.util.StringUtils.formatCalendar(new dw.util.Calendar(new Date(order.creationDate)), 'yyyy-MM-dd');
        data['Order Number'] = order.orderNo;
        data['Order Date'] = orderCreationDate;
        data['Customer Number'] = order.customerNo ? order.customerNo : '';
        data['Customer Name'] = order.customerName;
        data['Shipping Method'] = order.shipments[0].shippingMethod && order.shipments[0].shippingMethod.displayName ? order.shipments[0].shippingMethod.displayName : '';
        data['Card Last Four Digits'] = ccLastFourDigits;
        data['Card Type'] = creditCardType;
        data['Promo Code'] = discountCoupon;
        data['Promotion ID'] = promotionID;

        // Billing Address
        var billingaddress = [];
        billingaddress.push({
            'First Name'   : orderBillingAddressFirstName,
            'Last Name'    : orderBillingAddressLastName,
            'Address1'     : orderBillingAddressAddress1,
            'Address2'     : orderBillingAddressAddress2,
            'City'         : orderBillingAddressCity,
            'Postal Code'  : orderShippingAddressPostalCode,
            'State Code'   : orderBillingAddressStateCode,
            'Country Code' : orderBillingAddressCountryCode,
            'Phone'        : orderBillingAddressPhone
        });

        // Shipping Address
        var shippingaddress = [];
        shippingaddress.push({
            'First Name'   : orderShippingAddressFirstName,
            'Last Name'    : orderShippingAddressLastName,
            'Address1'     : orderShippingAddressAddress1,
            'Address2'     : orderShippingAddressAddress2,
            'City'         : orderShippingAddressCity,
            'Postal Code'  : orderShippingAddressPostalCode,
            'State Code'   : orderShippingAddressStateCode,
            'Country Code' : orderShippingAddressCountryCode,
            'Phone'        : orderShippingAddressPhone
        });

        // Add product / billing / shipping
        data.product_line_items = productLineItemsArray;
        data['Billing Address'] = billingaddress;
        data['Shipping Address'] = shippingaddress;
        data['Manage Order URL'] = URLUtils.https('Account-Show').toString();
        data['Items'] = items;
        data['Item Count'] = itemCount;
        data['Item Primary Categories'] = itemPrimaryCategories;
        data['Item Categories'] = klaviyoUtils.dedupeArray(itemCategories);
        data['$value'] = orderTotal;
        data['$event_id'] = 'orderConfirmation-' + order.orderNo;
        data['Tracking Number'] = order.shipments[0].trackingNumber ? order.shipments[0].trackingNumber : '';
    } catch (e) {
        var logger = Logger.getLogger('Klaviyo', 'Klaviyo.core orderConfirmation.js');
        logger.error('orderConfirmation.getData() failed to create data object: ' + e.message + ' ' + e.stack);
    }
    return data;
}


module.exports = {
    getData: getData
};
