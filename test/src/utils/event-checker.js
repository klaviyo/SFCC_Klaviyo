const KlaviyoAPI = require('./klaviyo-api.js');

/**
 * Checks for Klaviyo events with retries
 * @param {string} email - Email address to check events for
 * @param {string} metricId - Klaviyo metric ID to check for
 * @param {Object} options - Optional configuration
 * @param {number} options.waitTime - Time to wait between retries in ms (default: 1000)
 * @param {number} options.tryCount - Number of retry attempts (default: 30)
 * @returns {Promise<Object>} Event data if found, null if not found
 */
async function checkEventWithRetry(email, metricId, options = {}) {
    const { waitTime = 1000, tryCount = 30 } = options;
    const klaviyo = new KlaviyoAPI();
    let eventData = null;

    for (let i = 0; i < tryCount; i++) {
        eventData = await klaviyo.checkEventByEmailAndMetric(email, metricId);
        if (eventData) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    return eventData;
}

module.exports = {
    checkEventWithRetry
};