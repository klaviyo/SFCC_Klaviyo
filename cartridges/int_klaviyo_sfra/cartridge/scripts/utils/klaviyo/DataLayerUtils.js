'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var catalogMgr= require('dw/catalog/CatalogMgr');
var productMgr= require('dw/catalog/ProductMgr');
var orderMgr= require('dw/order/OrderMgr');
var basketMgr= require('dw/order/BasketMgr');
var klaviyoToken = require('dw/system/Site').getCurrent().getCustomPreferenceValue('klaviyo_account');
var createDate = new Date();

//prepare data's needs to be send to klaviyo in klData object
var buildDataLayer = function() {
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

          currentBasket = basketMgr.getCurrentBasket();
          basketHasLength = currentBasket.getProductLineItems().toArray().length >= 1;

          if (basketHasLength) {
        	  var KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/KlaviyoUtils');
        	  klData= KlaviyoUtils.prepareCheckoutEventForKlaviyo(currentBasket);

            }
          }

        // Order Placed Event
        if (pageContext == "orderconfirmation" && orderID) {
            var KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/KlaviyoUtils');
        	
        if(!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_order_transactional_enabled')){
			return;
		}
        currentOrder = orderMgr.getOrder(orderID);
        KlaviyoUtils.prepareOrderConfirmationEventForKlaviyo(currentOrder)  
        
          }
        

        // Viewed Product event
        if (!empty(pageProductID.rawValue)) {
          viewedProduct = productMgr.getProduct(pageProductID);
          var KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/KlaviyoUtils');
          klData=KlaviyoUtils.prepareViewedProductEventData(pageProductID,viewedProduct);
        }

        // Category Viewed event
        if (!empty(pageCategoryId)) {
          klData.event = "Viewed Category"
          klData.pageCategoryId = pageCategoryId
        }

        // Site Search event
        if (!empty(searchTerm)) {
          klData.event = "Site Search";
          klData.searchTerm = searchTerm;
          klData.searchResultsCount = (!empty(searchResultsCount))?searchResultsCount.value:0;
        }


    } catch(e) { 
    	klData.data.debug_error = [e.message,e.lineNumber];
    	}

    return klData
}

var buildCartDataLayer = function() {
  var klData = {};
  var isValidBasket, basketItems, itemIndex, basketProduct;
  var basketHasLength, basketProductCategories, currentViewedProductCategory, currentCategories;

  isValidBasket = (basketMgr.getCurrentBasket());
  if (isValidBasket) {
    basketHasLength = (basketMgr.getCurrentBasket().getProductLineItems().toArray().length >= 1)
  }

  if (basketHasLength) {
	  var KlaviyoUtils = require('*/cartridge/scripts/utils/klaviyo/KlaviyoUtils');
	  klData=KlaviyoUtils.prepareAddToCartEventForKlaviyo(klData);
  }

  return klData
}

/** Testable functions **/

module.exports = {
	buildDataLayer : buildDataLayer,
	buildCartDataLayer : buildCartDataLayer
};