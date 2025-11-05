const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the test directory
const envPath = path.join(__dirname, '..', '..', '.env');
// console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

class KlaviyoAPI {
    constructor(privateKey, v3Url) {
        this.privateKey = privateKey || process.env.KLAVIYO_SFRA_PRIVATE_KEY;
        this.v3Url = v3Url || process.env.KLAVIYO_V3_URL;
        // console.log('KlaviyoAPI initialized with:');
        // console.log('  Private Key:', this.privateKey ? 'Present' : 'Missing');
        // console.log('  V3 URL:', this.v3Url || 'Missing');
    }

    getHeaders() {
        return {
            'Authorization': `Klaviyo-API-Key ${this.privateKey}`,
            'Content-Type': 'application/json',
            'revision': '2025-10-15'
        }
    }

    /**
     * Creates a profile in Klaviyo
     * @param {string} email - Email address for the profile
     * @returns {Promise<string>} The created profile ID
     */
    async createProfile(email) {
        const response = await axios.post(`https://${this.v3Url}/profiles/`, {
            data: {
                type: 'profile',
                attributes: {
                    email: email
                }
            }
        }, {
            headers: this.getHeaders()
        });
        return response.data.data.id;
    }

    /**
     * Retrieves a profile by email address
     * @param {string} email - Email address to search for
     * @returns {Promise<Object>} Profile data if found, null if not found
     */
    async getProfileByEmail(email) {
        try {
            const response = await axios.get(`https://${this.v3Url}/profiles/`, {
                headers: this.getHeaders(),
                params: {
                    filter: `equals(email,"${email}")`,
                    'fields[profile]': 'id,email,first_name,last_name,phone_number,external_id,subscriptions',
                    'additional-fields[profile]': 'subscriptions'
                }
            });

            // Return the first matching profile or null if none found
            return response.data.data[0] || null;
        } catch (error) {
            console.error('Error retrieving profile:', error.message);
            throw error;
        }
    }

    /**
     * Checks for events in Klaviyo matching the given profile ID and metric ID
     * @param {string} profileId - Klaviyo profile ID
     * @param {string} metricId - Klaviyo metric ID for the event type
     * @returns {Promise<Array>} Array of matching events
     */
    async checkEvent(profileId, metricId) {
        const response = await axios.get(`https://${this.v3Url}/events/`, {
            headers: this.getHeaders(),
            params: {
                filter: `and(equals(profile_id,"${profileId}"),equals(metric_id,"${metricId}"))`,
                'fields[event]': 'event_properties,datetime',
                'fields[metric]':'name,integration',
                'include':'metric',
                'sort': '-datetime',
            }
        });
        return response.data;
    }

    /**
     * Checks if a profile exists in Klaviyo and returns its data
     * @param {string} email - Email address to search for
     * @returns {Promise<Array>} Array of profile data
     */
    async checkProfile(email) {
        const response = await axios.get(`https://${this.v3Url}/profiles/`, {
            headers: this.getHeaders(),
            params: {
                filter: `equals(email,"${email}")`,
                'additional-fields[profile]': 'subscriptions',
                'fields[profile]': 'id,email,subscriptions.email.marketing'
            }
        });
        return response.data.data;
    }

    /**
     * Checks a profile's list relationships in Klaviyo
     * @param {string} profileId - Klaviyo profile ID
     * @returns {Promise<Array>} Array of list relationships
     */
    async checkProfileListRelationships(profileId) {
        const response = await axios.get(`https://${this.v3Url}/profiles/${profileId}/lists`, {
            headers: this.getHeaders(),
            params: {}
        });
        return response.data.data;
    }

    /**
     * Checks for events in Klaviyo matching the given email and metric ID
     * @param {string} email - Email address to search for
     * @param {string} metricId - Klaviyo metric ID for the event type
     * @returns {Promise<Array>} Array of matching events, or null if profile not found
     */
    async checkEventByEmailAndMetric(email, metricId) {
        const profile = await this.getProfileByEmail(email);
        if (!profile) {
            console.log(`No profile found for email: ${email}`);
            return null;
        }
        return this.checkEvent(profile.id, metricId);
    }
}

module.exports = KlaviyoAPI;
