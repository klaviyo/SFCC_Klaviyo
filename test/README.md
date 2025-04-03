# Test Automation

## Introduction

The following frameworks and packages are used for testing

 - [Playwright](https://playwright.dev/)
 - [mocha](https://mochajs.org/)

    - SFCC API calls are mocked & stubbed using:

        - [proxyquire](https://github.com/thlorenz/proxyquire)
        - [sinon.js](https://sinonjs.org/)
        - [dw-mock-api](https://github.com/SalesforceCommerceCloud/dw-api-mock)


### Notes:
- Playwright will output screenshots and videos to help debugging test failures*

- Debugging tests is made easy using the Playwright logger. Please refer to the `logger` block within the [Playwright Config](./playwright.config.js) and the [following documentation](https://playwright.dev/docs/api/class-logger) for more details

## Prerequisites

`node v18.16.x`

`.env` file at the root of this directory with the following variables. See [example](env.example) file

```
SFRA_BASE_URL=https://<INSTANCE>.commercecloud.salesforce.com/on/demandware.store/Sites-RefArch-Site
SITEGEN_BASE_URL=https://<INSTANCE>.commercecloud.salesforce.com/on/demandware.store/Sites-SiteGenesis-Site
KLAVIYO_SFRA_PRIVATE_KEY=<klaviyo_private_api_key_for_sfra_store>
KLAVIYO_SITEGEN_PRIVATE_KEY=<klaviyo_private_api_key_for_sitegen_store>
KLAVIYO_V3_URL=a.klaviyo.com/api

KLAVIYO_E2E_TEST_SITE_ID=<your_test_store_site_id>
KLAVIYO_METRIC_ID_VIEWED_CATEGORY=<metric_id_for_viewed_catalog>
KLAVIYO_METRIC_ID_VIEWED_PRODUCT=<metric_id_for_viewed_product>
KLAVIYO_METRIC_ID_ADDED_TO_CART=<metric_id_for_added_to_cart>
KLAVIYO_METRIC_ID_ORDER_CONFIRMATION=<metric_id_for_order_confirmation>
KLAVIYO_METRIC_ID_STARTED_CHECKOUT=<metric_id_for_started_checkout>
KLAVIYO_METRIC_ID_SEARCHED_SITE=<metric_id_for_searched_site>
```

## Instructions

- In Business Manager make sure you have added the appropriate selectors in the custom site preferences (see setup [documentation](../documentation/))
- `npm install`
- Running tests:

    - SFRA E2E tests: `npm run test:sfra:e2e`
    - SiteGen E2E tests: `npm run test:sg:e2e`
    - Unit Tests: `npm run test:unit`

## Coverage

End to End (E2E) tests focus on verifying event data for the following

- Viewed Product
- Viewed Category
- Searched Site
- Added to Cart
- Started Checkout
- Order Confirmation
- Account registration & Log in
- Data Listener DOM property (see Event Data [documentation](../documentation/))

Unit Tests verify the following

- Track Event
- Viewed Product
- Order Confirmation
- Added to Cart
- Started Checkout

    - Bonus Products
    - Product Bundles
    - Product Options