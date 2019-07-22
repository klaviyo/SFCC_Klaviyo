'use strict';

/* Script Modules */
var Site = require('dw/system/Site');
var app = require('app_controllers/cartridge/scripts/app');
var guard = require('app_controllers/cartridge/scripts/guard');
let r = require('app_controllers/cartridge/scripts/util/Response');
var Logger = require('dw/system/Logger');
/* API Includes */
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var catalogMgr= require('dw/catalog/CatalogMgr');
var productMgr= require('dw/catalog/ProductMgr');
var orderMgr= require('dw/order/OrderMgr');
var basketMgr= require('dw/order/BasketMgr');
var klaviyoToken = require('dw/system/Site').getCurrent().getCustomPreferenceValue('klaviyo_account');
var paramMap = request.httpParameterMap;
var customer = app.getModel('Customer');
var createDate = new Date();



/**
 * Controller that will send the necessary data required for klaviyo to track the user event's 
 * such as checkout,order confirmation,searching etc and renders the renders the klaviyo_tag isml file
 *
 * @module controllers/Klaviyo
 */


var RenderKlaviyo = function() {
	
	if(!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){
		return;
	}
	var klaviyoUtils = require('~/cartridge/scripts/utils/klaviyo/KlaviyoUtils');
	
    var klaviyoDataLayer = klaviyoUtils.buildDataLayer();

    ISML.renderTemplate('klaviyo/klaviyo_tag', {
      klaviyoData : klaviyoDataLayer
    });
}

/**
 * Controller that will send the necessary data  to klaviyo when an add to cart event happens
 * @module controllers/Klaviyo
 */


var RenderKlaviyoAddToCart = function() {
	
	if(!dw.system.Site.getCurrent().getCustomPreferenceValue('klaviyo_enabled')){
		return;
	}
	var klaviyoUtils = require('~/cartridge/scripts/utils/klaviyo/KlaviyoUtils');

    var klaviyoDataLayer = klaviyoUtils.buildCartDataLayer();

    ISML.renderTemplate('klaviyo/klaviyo_tag', {
      klaviyoData : klaviyoDataLayer
    });
}



/**
 *end point for testing shipping confirmation event 
 * 
 */

function sendKlaviyoShipmentEmail() {
	
	var logger = Logger.getLogger('KlaviyoJobs', 'Klaviyo - sendMailsJob()');
	var OrderMgr = require('dw/order/OrderMgr');
	var parameterMap = request.httpParameterMap;
	var orderID=null;
	    if (!empty(parameterMap)) {
		orderID=parameterMap.orderID.stringValue
	    }
	    if(orderID){
	    	var KlaviyoUtils = require('~/cartridge/scripts/utils/klaviyo/KlaviyoUtils');
	    	if(KlaviyoUtils.sendMailForShipmentConfirmation(orderID)){
	    	    r.renderJSON({status: 'success'});
	    	} else {
	    		r.renderJSON({status: 'failed sending email'});
	    	}
	    }

}



/**
 * 
 *Subscribe End Point for handling news letter's subsciption
 * 
 */
function subscribe() {
	
	var email = app.getForm('subscribe.email').value();
	var source = !empty(request.httpParameterMap.source) ? request.httpParameterMap.source.stringValue : '';
	var KlaviyoSubscriptionUtils = require('~/cartridge/scripts/utils/klaviyo/KlaviyoSubscriptionUtils');
	if(KlaviyoSubscriptionUtils.subscribeToList(email,source)) {
	    r.renderJSON({status: 'success'});
	} else {
		r.renderJSON({status: 'alreadyconfirmed'});
	}
	
}

/**
 *Renders the footer_subscriibe template  
 * 
 */
function footerSubscribe() {
	app.getView().render('klaviyo/footer_subscribe');
}




/** Handles the form submission for subscription.
 * @see {@link module:controllers/Klaviyo~Subscribe} */
exports.Subscribe = guard.ensure(['post', 'https', 'csrf'], subscribe);
exports.sendKlaviyoShipmentEmail = guard.ensure(['get'], sendKlaviyoShipmentEmail);
exports.FooterSubscribe = guard.ensure(['get'], footerSubscribe);
exports.RenderKlaviyo = guard.ensure(['get'], RenderKlaviyo);
exports.RenderKlaviyoAddToCart = guard.ensure(['get'], RenderKlaviyoAddToCart);


