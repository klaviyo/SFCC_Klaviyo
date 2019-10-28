Steps to install cartridge:
1. Navigate to Administration -> Operations -> Import and Export
2. Upload the int_klaviyo_services/metadata/klaviyo-services.xml
3. Import the uploaded file through the services section in Administration -> Operations -> Import and Export.
4. Add int_klaviyo_services to the cartridge path.
5. Use the klaviyoTrackEvent() method in int_klaviyo_services/cartridge/scripts/utils/klaviyo/KlaviyoUtils.js to send a track event. The parameters include the email, payload and event type. 