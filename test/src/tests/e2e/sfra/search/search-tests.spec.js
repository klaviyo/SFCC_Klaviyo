import { test, expect } from '@playwright/test';
import { Search } from '../page-objects/search.js';
const { checkEventWithRetry } = require('../../../../utils/event-checker.js');
const {
    KLAVIYO_METRIC_ID_SEARCHED_SITE,
    KLAVIYO_E2E_TEST_SITE_ID,
} = require('../../../../constants/klaviyo-test-settings.js');
let testData = {
    firstName: 'Product',
    lastName: 'Automation',
    phone: '7777777777',
    password: 'Abcd1234$$',
};

let search;
let email;

test.beforeEach(async ({ page, isMobile }) => {
    search = new Search(page, isMobile);
    await search.goHome();
    await search.acceptCookies();
});

test.describe('Test Klaviyo search event', () => {
    test('Perform a search and verify event data', async ({ page }) => {
        const searchTerm = 'shirts';
        const resultMsg = 'Klaviyo Service Result:';
        email = await search.generateEmail();
        testData.email = email;
        await search.accountPage.gotoAccountLogin();
        await search.accountPage.fillRegistrationForm(testData);
        await search.enterSearchTerm(searchTerm);
        const logData = await search.getDebugLogs(resultMsg);
        expect(logData[0].success).toBe(true);

        const events = await checkEventWithRetry(email, KLAVIYO_METRIC_ID_SEARCHED_SITE);
        // console.log("Events:", JSON.stringify(events, null, 2));
        expect(events).toBeDefined();
        expect(events.data.length).toBeGreaterThan(0);

        const metricData = events.included[0];
        const eventData = events.data[0].attributes.event_properties;
        const eventTime = new Date(events.data[0].attributes.datetime);
        expect(Math.abs(new Date() - eventTime)).toBeLessThan(60 * 1000); // Within 1 minute (60,000 ms)

        expect(metricData.attributes.name).toBe('Searched Site');
        expect(eventData.SiteID).toBe(KLAVIYO_E2E_TEST_SITE_ID);
        expect(eventData['Search Term']).toBe(searchTerm);
    });
});
