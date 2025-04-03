#!/usr/bin/env node

const KlaviyoAPI = require('./klaviyo-api.js');
const { KLAVIYO_METRIC_ID_VIEWED_PRODUCT } = require('../constants/klaviyo-test-settings.js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function main() {
    // Get email from command line arguments
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address as an argument');
        console.error('Usage: node check-profile.js <email>');
        process.exit(1);
    }

    try {
        const klaviyo = new KlaviyoAPI();
        console.log(`Checking profile for email: ${email}`);
        console.log('Using Klaviyo API URL:', process.env.KLAVIYO_V3_URL);
        console.log('Using Klaviyo Private Key:', process.env.KLAVIYO_SFRA_PRIVATE_KEY ? 'Present' : 'Missing');
        
        const profile = await klaviyo.getProfileByEmail(email);
        
        if (profile) {
            console.log('\nProfile found:');
            console.log('----------------');
            console.log(`ID: ${profile.id}`);
            console.log(`Email: ${profile.attributes.email}`);
        } else {
            console.log('\nNo profile found with this email address.');
        }

        const event = await klaviyo.checkEvent(profile.id, KLAVIYO_METRIC_ID_VIEWED_PRODUCT);
        console.log('Event:', event);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main(); 