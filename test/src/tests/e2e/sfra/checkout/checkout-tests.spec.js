import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../page-objects/checkout.js';
const {
    KLAVIYO_METRIC_ID_STARTED_CHECKOUT,
    KLAVIYO_METRIC_ID_ADDED_TO_CART,
    KLAVIYO_METRIC_ID_ORDER_CONFIRMATION,
    KLAVIYO_E2E_TEST_SITE_ID,
    KLAVIYO_DEMANDWARE_INTEGRATION_KEY,
} = require('../../../../constants/klaviyo-test-settings.js');
const { checkEventWithRetry } = require('../../../../utils/event-checker.js');

let testData = {
    firstName: 'Product',
    lastName: 'Automation',
    phone: '7777777777',
    address: '4321 First Last Lane',
    country: 'US',
    state: 'FL',
    city: 'West Palm Beach',
    postal: '33405',
};

const paymentData = {
    ccn: '4111 1111 1111 1111',
};

let email;
let checkoutPage;

test.beforeEach(async ({ page, isMobile }) => {
    checkoutPage = new CheckoutPage(page, isMobile);
    await checkoutPage.goHome();
    await checkoutPage.acceptCookies();
});

test.describe('Test Klaviyo started checkout event', () => {
    test('Enter checkout flow and verify event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:';
        email = await checkoutPage.generateEmail();
        testData.email = email;
        testData.password = await checkoutPage.generatePassword();
        await checkoutPage.productPage.getProduct();
        await checkoutPage.productPage.addToCart();
        await checkoutPage.startCheckout();
        await checkoutPage.enterGuestEmail(email);
        const logData = await checkoutPage.getDebugLogs(resultMsg);
        expect(logData[0].success).toBe(true);

        const events = await checkEventWithRetry(email, KLAVIYO_METRIC_ID_STARTED_CHECKOUT);
        // console.log("Events:", JSON.stringify(events, null, 2));
        expect(events).toBeDefined();
        expect(events.data.length).toBeGreaterThan(0);

        const metricData = events.included[0];
        const eventData = events.data[0].attributes.event_properties;
        const eventTime = new Date(events.data[0].attributes.datetime);
        expect(Math.abs(new Date() - eventTime)).toBeLessThan(60 * 1000); // Within 1 minute (60,000 ms)

        expect(metricData.attributes.name).toBe('Started Checkout');
        expect(eventData.SiteID).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.external_catalog_id).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.integration_key).toBe(KLAVIYO_DEMANDWARE_INTEGRATION_KEY);
        expect(eventData['Item Count']).toBe(1);
        expect(eventData.line_items[0]['Product Name']).toBe('Incase');
        expect(eventData['$email']).toBe(email);
    });
});

test.describe('Test Klaviyo add to cart event', () => {
    test('Verify add to cart event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Add To Cart Service Result:';
        email = await checkoutPage.generateEmail();
        testData.email = email;
        testData.password = await checkoutPage.generatePassword();
        await checkoutPage.accountPage.gotoAccountLogin();
        await checkoutPage.accountPage.fillRegistrationForm(testData);
        await checkoutPage.productPage.visitPDP();
        const logData = await checkoutPage.getDebugLogs(resultMsg);
        await checkoutPage.productPage.addToCart();
        expect(logData[0].success).toBe(true);

        const events = await checkEventWithRetry(email, KLAVIYO_METRIC_ID_ADDED_TO_CART);
        // console.log("Events:", JSON.stringify(events, null, 2));
        expect(events).toBeDefined();
        expect(events.data.length).toBeGreaterThan(0);

        const metricData = events.included[0];
        const eventData = events.data[0].attributes.event_properties;
        const eventTime = new Date(events.data[0].attributes.datetime);
        expect(Math.abs(new Date() - eventTime)).toBeLessThan(60 * 1000); // Within 1 minute (60,000 ms)

        expect(metricData.attributes.name).toBe('Added to Cart');
        expect(eventData.SiteID).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.external_catalog_id).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.integration_key).toBe(KLAVIYO_DEMANDWARE_INTEGRATION_KEY);

        expect(eventData.itemCount).toBe(1);
        expect(eventData.lineItems[0].productName).toBe('Incase');
        expect(eventData.productAddedToCart.productName).toBe('Incase');
    });
});

test.describe('Test Klaviyo order confirmation event', () => {
    test('Complete purchase and verify event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:';
        email = await checkoutPage.generateEmail();
        testData.email = email;
        testData.password = await checkoutPage.generatePassword();
        await checkoutPage.productPage.getProduct();
        await checkoutPage.productPage.addToCart();
        await checkoutPage.startCheckout();
        await checkoutPage.enterGuestEmail(email);
        await checkoutPage.fillShippingForm(testData);
        await checkoutPage.fillPaymentForm(paymentData);
        await page.waitForTimeout(3000);
        expect(await page.innerText('h1.page-title')).toBe('Thank You');

        const events = await checkEventWithRetry(email, KLAVIYO_METRIC_ID_ORDER_CONFIRMATION);
        // console.log("Events:", JSON.stringify(events, null, 2));
        expect(events).toBeDefined();
        expect(events.data.length).toBeGreaterThan(0);

        const metricData = events.included[0];
        const eventData = events.data[0].attributes.event_properties;
        const eventTime = new Date(events.data[0].attributes.datetime);
        expect(Math.abs(new Date() - eventTime)).toBeLessThan(60 * 1000); // Within 1 minute (60,000 ms)

        expect(metricData.attributes.name).toBe('Order Confirmation');
        expect(eventData.SiteID).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.external_catalog_id).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.integration_key).toBe(KLAVIYO_DEMANDWARE_INTEGRATION_KEY);

        expect(eventData['Item Count']).toBe(1);
        expect(eventData.product_line_items.length).toBe(1);
        expect(eventData.product_line_items[0]['Product Name']).toBe('Incase');
    });
});
