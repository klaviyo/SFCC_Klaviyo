'use strict';

var Site = require('dw/system/Site');
var klaviyoUtils = require('*/cartridge/scripts/klaviyo/utils');
var klaviyoServices = require('*/cartridge/scripts/klaviyo/services.js');

function buildResponse(storefrontRoutes, fields) {
    var response = { storefront_routes: storefrontRoutes };
    Object.keys(fields).forEach(function (key) {
        response[key] = fields[key];
    });
    return response;
}

function getBootstrapRoutes(routes) {
    return {
        login: routes.login,
        register: routes.register,
        profile: routes.profile,
        addresses: routes.addresses
    };
}

/**
 * Authenticates the current storefront session for the customer hub.
 */
function authenticate(options) {
    var site = Site.getCurrent();
    var routes = options.getStorefrontRoutes();
    var bootstrapRoutes = getBootstrapRoutes(routes);

    if (!klaviyoUtils.customerHubEnabled) {
        return buildResponse(bootstrapRoutes, { authenticated: false });
    }

    if (!customer.authenticated || !customer.profile || !customer.profile.email) {
        return buildResponse(bootstrapRoutes, {
            authenticated: false,
            error: 'sfcc_session_not_authenticated'
        });
    }

    var companyId = String(site.getCustomPreferenceValue('klaviyo_account') || '').trim();
    if (!companyId) {
        return buildResponse(bootstrapRoutes, {
            authenticated: false,
            error: 'missing_company_id'
        });
    }

    var customerNo = String(customer.profile.customerNo || '').trim();
    if (!customerNo) {
        return buildResponse(bootstrapRoutes, {
            authenticated: false,
            error: 'missing_customer_no'
        });
    }

    var payload = {
        company_id: companyId,
        email: String(customer.profile.email || '').trim().toLowerCase(),
        customer_id: customerNo,
        site_id: String(site.getID() || '').trim()
    };

    var onsiteClientId = options.getOnsiteClientId ? options.getOnsiteClientId() : null;
    if (onsiteClientId) {
        payload.onsite_client_id = String(onsiteClientId);
    }

    var loginResult = klaviyoServices.exchangeSessionForCustomerHubOnsiteToken(payload);

    if (!loginResult.ok || !loginResult.data || !loginResult.data.auth_token) {
        return buildResponse(bootstrapRoutes, {
            authenticated: false,
            error: 'customer_hub_onsite_login_failed'
        });
    }

    return buildResponse(routes, {
        authenticated: true,
        customer_id: customerNo,
        email: customer.profile.email,
        auth_token: loginResult.data.auth_token,
        is_new_user: loginResult.data.is_new_user || false
    });
}

module.exports = {
    authenticate: authenticate
};
