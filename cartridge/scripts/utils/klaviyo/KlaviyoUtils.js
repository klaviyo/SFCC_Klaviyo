'use strict';


var Logger = require('dw/system/Logger');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');

var WHITELISTED_EVENTS = ['Started Checkout', 'Ordered Product', 'Placed Order'];

/**
 * Uses the service framework to get the Klaviyo Service configuration
 * (please see metadata/klaviyo-services.xml) and executes a get call with the payload generated from the
 * preparePayload() method.
 *
 * This is a track API call. Please refer https://www.klaviyo.com/docs/http-api
 *
 * @param email
 * @param data
 * @param event
 * @returns
 */
function sendEmail(email, data, event) {
	var requestBody = {};
	var resultObj = {};

	var logger = Logger.getLogger('Klaviyo', 'KlaviyoUtils - sendEmail()');

	if (KlaviyoTrackService == null ) {
		logger.error('sendEmail() failed for email: ' + email + '. Service Connection for send email via Klaviyo returned null.');
		return;
	}

	var klaviyoData = preparePayload(email, data, event);

	KlaviyoTrackService.addParam('data', klaviyoData);

	var result = KlaviyoTrackService.call(requestBody);

	if (result == null){
		logger.error('Result for send email via Klaviyo returned null. Payload info: ' +  klaviyoData);
		return;
	}

	resultObj = JSON.parse(result.object);

	if (resultObj == 1) {
		logger.info('Send email via Klaviyo is successful. Payload info ' + klaviyoData);
	} else {
		logger.error('Send email via Klaviyo failed. Payload info ' +  klaviyoData);
	}

}


/**
 * Prepares Track API Payload Data in format per
 * https://www.klaviyo.com/docs/http-api
 *
 * @param email
 * @param data
 * @param event
 * @returns
 */
function preparePayload (email, data, event) {
	var Site = require('dw/system/Site');
	var StringUtils = require('dw/util/StringUtils');
	var jsonData = {};
	jsonData.token = Site.getCurrent().getCustomPreferenceValue('klaviyo_account');
	jsonData.event = event;
  if (WHITELISTED_EVENTS.includes(event)) {
    jsonData.service = 'demandware';
  }
	var customerProperties = {};
	customerProperties.$email = email;
	jsonData.customer_properties = customerProperties;
	jsonData.properties = data;
	jsonData.time = Math.floor(Date.now() / 1000);

	var klaviyoData = JSON.stringify(jsonData);

	return StringUtils.encodeBase64(klaviyoData);

}

/**
 * Prepares GiftCard Object and set necessary details
 *
 * @param giftCard
 * @returns {Object}
 */

function preparegiftCardObject(giftCard){

	  var giftCardObj = {};
      giftCardObj["Product Name"] = "e-Giftcard";
     // giftCardObj["Product ID"] = giftCardId;
      giftCardObj["Recipient Email"] = giftCard.recipientEmail;
      giftCardObj["Recipient Name"] = giftCard.recipientName;
      giftCardObj["Sender Name"] = giftCard.senderName;
      giftCardObj["Message"] = giftCard.message;
      giftCardObj["Value"] = giftCard.price.value;
      return giftCardObj;
}





/**
 * Prepares Product Object and set necessary product details
 * https://www.klaviyo.com/docs/http-api
 *
 * @param lineItem
 * @param basketProduct
 * @param currentProductID
 * @returns {Object}
 */

function prepareProductObj(lineItem,basketProduct,currentProductID){

	 productObj = {};
     productObj["Product ID"] = currentProductID;
     productObj["Product Name"] = basketProduct.name;
     productObj["Product Image URL"] = basketProduct.getImage("large").getAbsURL().toString();
     productObj["Price"] = dw.util.StringUtils.formatMoney(dw.value.Money(basketProduct.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode()));
     productObj["Product Description"] = basketProduct.pageDescription ? basketProduct.pageDescription.toString() : null;
     productObj["Product Page URL"] = require('dw/web/URLUtils').https('Product-Show', 'pid', currentProductID).toString();
     productObj["Product UPC"] = basketProduct.UPC;
     productObj["Product Availability Model"] = basketProduct.availabilityModel.availability;
     productObj["Categories"] = createCategories(basketProduct);
     return productObj;

}

/**
 * Prepares Viewed Product Object and set necessary details
 *
 * @param pageProductID
 * @param viewedProduct
 * @returns {Object}
 */

function prepareViewedProductEventData(pageProductID,viewedProduct){
	 klData={};
	 klData.event = "Viewed Product";
     klData.viewedProductID = pageProductID;
     klData.viewedProductName = viewedProduct.name;
     viewedProduct.getImage("large") ? klData.viewedProductImage = viewedProduct.getImage("large").getAbsURL() : null;
     klData.viewedProductPage = viewedProduct.getPageURL();
     if(viewedProduct.getPriceModel().getPrice().getValue() !=0){
     klData.viewedProductPrice = viewedProduct.getPriceModel().getPrice().getValue();
     }else{
     klData.viewedProductPrice=viewedProduct.getPriceModel().getMinPrice().getValue();
     }
     klData.viewedProductPageURL = require('dw/web/URLUtils').https('Product-Show', 'pid', pageProductID).toString();
     klData.viewedProductUPC = viewedProduct.UPC;
     klData.viewedProductCategories = createCategories(viewedProduct);
     klData.viewedProductPrimaryCategory = !empty(viewedProduct.getPrimaryCategory()) ? viewedProduct.getPrimaryCategory().displayName : '';
	 return klData;

}

//for creating  catagories of product

function createCategories(product) {
	  var productCategoryIndex, currentCategory;
	  var arrayOfCategories = [];

	  if(product.variant){
		  	var productCategoryArray = product.masterProduct.allCategories.toArray();
		    for (productCategoryIndex = 0; productCategoryIndex < productCategoryArray.length; productCategoryIndex++) {
		      var currentCategory = productCategoryArray[productCategoryIndex].displayName;
		      arrayOfCategories.push(currentCategory);
		    }
	  }else{
		  	var productCategoryArray = product.allCategories.toArray();
		    for (productCategoryIndex = 0; productCategoryIndex < productCategoryArray.length; productCategoryIndex++) {
		      currentCategory = productCategoryArray[productCategoryIndex].displayName;
		      arrayOfCategories.push(currentCategory);
		    }
	  }

	 var categories = removeDuplicates(arrayOfCategories);
	  return categories ;
	}

/**
 * Removing duplicate items from an array
 * @param array
 * @returns array
 */

function removeDuplicates(items) {
	  let unique = {};
	  items.forEach(function(i) {
	    if(!unique[i]) {
	      unique[i] = true;
	    }
	  });
	  return Object.keys(unique);
}


	//prepare data for checkout cart event to klaviyo

 function prepareCheckoutEventForKlaviyo(currentBasket){
		var productMgr= require('dw/catalog/ProductMgr');
		try{

		klData={};
		basketItems = currentBasket.getProductLineItems().toArray();
		//Create some top-level event data
		klData.event = "Checkout Started";
		klData["Basket Gross Price"] = currentBasket.getTotalGrossPrice().value;
		klData["Item Count"] = basketItems.length;

		// prepare to add top-level data while iterating through product line items
		klData["line_items"] = [];
		klData["Categories"] = [];
		klData["Items"] = [];
		klData["$email"] = currentBasket.customerEmail;

		for (itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
		  lineItem = basketItems[itemIndex];
		  currentProductID = lineItem.productID;
		  basketProduct = productMgr.getProduct(currentProductID)

		  if ( currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {
		      productObj=prepareProductObj(lineItem,basketProduct,currentProductID);

		      // add top-level data for the event for segmenting, etc.
		  klData["line_items"].push(productObj)
		  klData["Categories"].push.apply(klData["Categories"], klData["line_items"][itemIndex]["Categories"]);
		  klData["Items"].push(klData["line_items"][itemIndex]["Product Name"]);
		    }
		  }
		}catch(e) {

			klData.data.debug_error = [e.message,e.lineNumber];
		}
		return klData;

		}

 //prepare order confirmation and orderplaced related event data for klaviyo

function prepareOrderConfirmationEventForKlaviyo(currentOrder){
	try{
	var Site = require('dw/system/Site');
    var EmailUtils = require('~/cartridge/scripts/utils/klaviyo/EmailUtils');
    var sitegenesisOrder =EmailUtils.prepareOrderPayload(currentOrder, false, 'orderConfirmation');
    sendEmail(currentOrder.getCustomerEmail(), sitegenesisOrder, "Placed Order");

    // giftcards
    var giftCertCollection = currentOrder.getGiftCertificateLineItems().toArray();
    var orderGiftCards = [];

    for (var giftCertIndex = 0; giftCertIndex < giftCertCollection.length; giftCertIndex++) {
      // gift certificates don't count as orderItems so we need to reconcile that ourselves
    	if(Site.getCurrent().getCustomPreferenceValue('EgiftProduct-ID')) {
      var giftCardId = Site.getCurrent().getCustomPreferenceValue('EgiftProduct-ID');

      /* klData["Item Count"]++ */
      var giftCard = giftCertCollection[giftCertIndex];
      var giftCardObj = {};
      var giftCardObj =preparegiftCardObject(giftCard);
      orderGiftCards.push(giftCardObj)

    }
    }

       // send an event for transactional gift certificate emails
      for (var totalOrderGiftCards = 0; totalOrderGiftCards < orderGiftCards.length; totalOrderGiftCards++) {
        var theGiftCard = orderGiftCards[totalOrderGiftCards]
        sendEmail(theGiftCard["Recipient Email"], theGiftCard, "e-Giftcard Notification");
      }

	}catch(e) {
    	klData.data.debug_error = [e.message,e.lineNumber];
	}
}

// preparing data to be send to klaviyo for add to cart event

function prepareAddToCartEventForKlaviyo(klData){
	var productMgr= require('dw/catalog/ProductMgr');
	var basketMgr= require('dw/order/BasketMgr');
    basketItems = basketMgr.getCurrentBasket().getProductLineItems().toArray();
    klData.event = "Add to Cart";
    klData.basketGross = basketMgr.getCurrentBasket().getTotalGrossPrice().getValue();
    if(klData.basketGross==0){
    klData.basketGross=basketMgr.getCurrentBasket().getMerchandizeTotalPrice().getValue();
    }

    klData.itemCount = basketItems.length;
    klData.lineItems = [];
    klData.items = [];
    klData.categories = [];
    klData.primaryCategories = [];
    currentCategories = [];
    for (itemIndex = 0; itemIndex < basketItems.length; itemIndex++) {
      lineItem = basketItems[itemIndex];
      currentProductID = lineItem.productID;
      basketProduct = productMgr.getProduct(currentProductID);

      if ( currentProductID != null && !empty(basketProduct) && basketProduct.getPriceModel().getPrice().value > 0) {

    	  if(basketProduct.variant) {
      		var primaryCategory = basketProduct.masterProduct.getPrimaryCategory().displayName;
      	}else{
      		var primaryCategory = basketProduct.getPrimaryCategory().displayName;
      	}

        klData.lineItems.push({
          productID: currentProductID,
          productName: basketProduct.name,
          productImageURL: basketProduct.getImage("large").getAbsURL().toString(),
          productPageURL:   require('dw/web/URLUtils').https('Product-Show', 'pid', currentProductID).toString(),
          price: dw.util.StringUtils.formatMoney(dw.value.Money(basketProduct.getPriceModel().getPrice().value, session.getCurrency().getCurrencyCode())),
          productUPC: basketProduct.UPC,
          viewedProductAvailability: basketProduct.availabilityModel.availability,
          categories: createCategories(basketProduct),
          primaryCategory:primaryCategory
        })
        klData.items.push(basketProduct.name);
        klData.categories.push.apply(klData.categories, klData.lineItems[itemIndex].categories);
        klData.primaryCategories.push(klData.lineItems[itemIndex].primaryCategory);
      }
    }
    return klData;
}

//send shipment confirmation for shipped order's

function sendMailForShipmentConfirmation(orderID){
	var orderMgr= require('dw/order/OrderMgr');
	var orderObj = orderMgr.searchOrders('orderNo={0} AND shippingStatus={1}', 'creationDate desc', orderID,
	            dw.order.Order.SHIPPING_STATUS_SHIPPED);
   	var orderList = orderObj.asList();

   		var sendStatus=false;
	if(!empty(orderList)) {
		for(var i in orderList) {
			var order = orderList[i];
			try {
				var EmailUtils = require('~/cartridge/scripts/utils/klaviyo/EmailUtils');
				EmailUtils.sendOrderEmail(order, 'Shipping Confirmation');
				sendStatus=true;
			} catch (e) {
				logger.error('resendKlaviyoShipmentEmailsJob failed for order: ' + order.getOrderNo() + '. Error: ' +  e.message);
			}
		}
	}
	return sendStatus;
}




//prepare data's needs to be send to klaviyo in klData object
function buildDataLayer() {
    var klData = {};
    var order;
    var pageContext, isValidBasket;
    var basketItems, itemIndex, basketProduct, currentBasket, basketHasLength;
    var currentOrder, orderItems, orderAddress, addressObj, itemOrderIndex;
    var product, viewedProduct, currentProduct, productId, productCategory, productPrimeCategory, productSet;
    var lineItem, productObj, priceValue, promotionID;
    var couponLineItems = null, productLineItems = null, priceAdjustments = null;
    var viewedProductCategories, orderedProductCategories;
    var searchResultsCount;
    var customer, profile;
    var klEvent;
    klData.data='';
	klData.data.debug_error='';

	var httpParameterMap = request.httpParameterMap;
    var pageContext = httpParameterMap.pagecontexttype;
    var pageProductID = httpParameterMap.productid;
    var orderID = httpParameterMap.orderno;
    var searchResultsCount = httpParameterMap.searchresultscount;
    var searchTerm = httpParameterMap.searchterm.value;
    var pagecontexttitle = httpParameterMap.pagecontexttitle;
    var pageCategoryId = httpParameterMap.pagecgid.value;

    try {

        // Checkout Started event

        if (pageContext == "checkout") {
          var basketMgr= require('dw/order/BasketMgr');
          currentBasket = basketMgr.getCurrentBasket();
          basketHasLength = currentBasket.getProductLineItems().toArray().length >= 1;

          if (basketHasLength) {
        	  klData= prepareCheckoutEventForKlaviyo(currentBasket);

            }
          }

        // Order Placed Event
        if (pageContext == "orderconfirmation" && orderID) {
            var orderMgr= require('dw/order/OrderMgr');

        currentOrder = orderMgr.getOrder(orderID);
        prepareOrderConfirmationEventForKlaviyo(currentOrder)

          }


        // Viewed Product event
        if (pageContext == "product" && pageProductID) {
          var productMgr= require('dw/catalog/ProductMgr');
          viewedProduct = productMgr.getProduct(pageProductID);
          klData=prepareViewedProductEventData(pageProductID,viewedProduct);
        }

        // Category Viewed event

        if (pageContext == "search" && pageCategoryId) {
          klData.event = "Viewed Category";
          klData.pageCategoryId = pageCategoryId;
        }

        // Site Search event
        if (pageContext == "search" && searchTerm) {
          klData.event = "Site Search";
          klData.searchTerm = searchTerm;
          klData.searchResultsCount = (!empty(searchResultsCount))?searchResultsCount.value:0;
        }


    } catch(e) {
    	klData.data.debug_error = [e.message,e.lineNumber];
    	}

    return klData;
}

// builds the data layer required for sending klaviyo evens.

function buildCartDataLayer() {
  var klData = {};
  var isValidBasket, basketItems, itemIndex, basketProduct;
  var basketHasLength, basketProductCategories, currentViewedProductCategory, currentCategories;
  var basketMgr= require('dw/order/BasketMgr');
  isValidBasket = (basketMgr.getCurrentBasket());
  if (isValidBasket) {
    basketHasLength = (basketMgr.getCurrentBasket().getProductLineItems().toArray().length >= 1)
  }

  if (basketHasLength) {
	  klData=prepareAddToCartEventForKlaviyo(klData);
  }

  return klData;
}



module.exports = {
	sendEmail: sendEmail,
	prepareViewedProductEventData:prepareViewedProductEventData,
	prepareProductObj:prepareProductObj,
	preparegiftCardObject:preparegiftCardObject,
	removeDuplicates:removeDuplicates,
	prepareCheckoutEventForKlaviyo:prepareCheckoutEventForKlaviyo,
	prepareOrderConfirmationEventForKlaviyo:prepareOrderConfirmationEventForKlaviyo,
	prepareAddToCartEventForKlaviyo:prepareAddToCartEventForKlaviyo,
	sendMailForShipmentConfirmation:sendMailForShipmentConfirmation,
	createCategories:createCategories,
	buildDataLayer:buildDataLayer,
	buildCartDataLayer:buildCartDataLayer

};


// HTTP Services

var KlaviyoTrackService = ServiceRegistry.createService('KlaviyoTrackService', {
	/**
     * Create the service request
     * - Set request method to be the HTTP GET method
     * - Construct request URL
     * - Append the request HTTP query string as a URL parameter
     *
     * @param {dw.svc.HTTPService} svc - HTTP Service instance
     * @param {Object} params - Additional paramaters
     * @returns {void}
     */
	createRequest: function(svc, args) {
		svc.setRequestMethod('GET');
	},
	/**
     * JSON parse the response text and return it in configured retData object
     *
     * @param {dw.svc.HTTPService} svc - HTTP Service instance
     * @param {dw.net.HTTPClient} client - HTTPClient class instance of the current service
     * @returns {Object} retData - Service response object
     */
	parseResponse: function(svc, client) {
		return client.text;
	}

});
