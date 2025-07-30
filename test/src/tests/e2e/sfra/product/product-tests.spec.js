const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../page-objects/product.js');
const { checkEventWithRetry } = require('../../../../utils/event-checker.js');
const {
    KLAVIYO_METRIC_ID_VIEWED_PRODUCT,
    KLAVIYO_METRIC_ID_VIEWED_CATEGORY,
    KLAVIYO_E2E_TEST_SITE_ID,
    KLAVIYO_DEMANDWARE_INTEGRATION_KEY,
} = require('../../../../constants/klaviyo-test-settings.js');

let testData = {
    firstName: 'Product',
    lastName: 'Automation',
    phone: '7777777777',
};

let productPage;
let email;

test.beforeEach(async ({ page, isMobile }) => {
    productPage = new ProductPage(page, isMobile);
    await productPage.goHome();
    await productPage.acceptCookies();
});

test.describe('Test Klaviyo viewed product event', () => {
    test('Navigate to a PDP and verify event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:';
        email = await productPage.generateEmail();
        testData.email = email;
        testData.password = await productPage.generatePassword();
        await productPage.accountPage.gotoAccountLogin();
        await productPage.accountPage.fillRegistrationForm(testData);
        await productPage.visitPDP();
        const logData = await productPage.getDebugLogs(resultMsg);
        expect(logData[0].success).toBe(true);

        // Check for Klaviyo event with retries
        const events = await checkEventWithRetry(email, KLAVIYO_METRIC_ID_VIEWED_PRODUCT);
        // console.log("Events:", JSON.stringify(events, null, 2));
        expect(events).toBeDefined();
        expect(events.data.length).toBeGreaterThan(0);

        // Validate the event top level data
        const metricData = events.included[0];
        const eventData = events.data[0].attributes.event_properties;
        const eventTime = new Date(events.data[0].attributes.datetime);
        expect(Math.abs(new Date() - eventTime)).toBeLessThan(60 * 1000); // Within 1 minute (60,000 ms)

        // Validate metric data
        expect(metricData.attributes.name).toBe('Viewed Product');
        expect(metricData.attributes.integration.key).toBe('api');

        // Validate event data
        expect(eventData['Product Name']).toBe('Bootleg Trouser');
        expect(eventData.external_catalog_id).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.integration_key).toBe(KLAVIYO_DEMANDWARE_INTEGRATION_KEY);
    });
});

test.describe('Test Klaviyo viewed category event', () => {
    test('Navigate to a PLP and verify event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:';
        email = await productPage.generateEmail();
        testData.email = email;
        testData.password = await productPage.generatePassword();
        await productPage.accountPage.gotoAccountLogin();
        await productPage.accountPage.fillRegistrationForm(testData);
        await productPage.visitPLP();
        const logData = await productPage.getDebugLogs(resultMsg);
        expect(logData[0].success).toBe(true);

        // Check for Klaviyo event with retries
        const events = await checkEventWithRetry(email, KLAVIYO_METRIC_ID_VIEWED_CATEGORY);
        // console.log("Events:", JSON.stringify(events, null, 2));
        expect(events).toBeDefined();
        expect(events.data.length).toBeGreaterThan(0);

        // Validate the event top level data
        const metricData = events.included[0];
        const eventData = events.data[0].attributes.event_properties;
        const eventTime = new Date(events.data[0].attributes.datetime);
        expect(Math.abs(new Date() - eventTime)).toBeLessThan(60 * 1000); // Within 1 minute (60,000 ms)

        // Validate metric data
        expect(metricData.attributes.name).toBe('Viewed Category');
        expect(metricData.attributes.integration.key).toBe('api');

        // Validate event data
        expect(eventData['Viewed Category']).toBe('newarrivals-womens');
        expect(eventData.external_catalog_id).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData.integration_key).toBe(KLAVIYO_DEMANDWARE_INTEGRATION_KEY);
    });
});
