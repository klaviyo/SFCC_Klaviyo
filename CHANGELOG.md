# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to SFCC versioning practice where the Year is the
first number and the Month is the second number. The third number will be
bumped for multiple releases during one month.

### [Unreleased]
##### Fixed
- Order Confirmation event will now correctly fire for orders with coupons.
##### Updated
- Rename sendEmail function to trackEvent
- Fix grammar/typos in comments and docstrings
- Remove unused functions from Core and SG cartridges
    - sendOrderEmail from Core emailUtils
    - sendKlaviyoShipmentEmail from SG Klaviyo.js controller

### [21.7.0] - 2021-7-27
##### Updated
- Remove unused functions from SFRA and Core cartridges
    - SFRA controller functions
        - FooterSubscribe
        - Subscribe
        - ShipmentConfirmation
    - buildCartDataLayer from SFRA klaviyoUtils
    - sendShipmentConfirmation from Core klaviyoUtils

### [20.11.0] - 2020-11-25
##### Added
- Enable Prophet debugger to detect cartridge.
- Enable watch and upload cartridge with sgmf cli tool.
- Fix image size and email that can crash if empty.
- Add trackViewedItem for profile tracking.

[Unreleased]: https://github.com/SalesforceCommerceCloud/link_klaviyo/compare/release-21.7.0...HEAD
[21.7.0]: https://github.com/SalesforceCommerceCloud/link_klaviyo/compare/release-20.11.0...release-21.7.0
[20.11.0]: https://github.com/SalesforceCommerceCloud/link_klaviyo/compare/release-20.1.0...release-20.11.0
[20.1.0]: https://github.com/SalesforceCommerceCloud/link_klaviyo/compare/da798cc8d3aeda9465bc9c4bb65d5184e4116e4f...release-20.1.0

#### NOTE
- The CHANGELOG was created on 2020-11-25 and does not contain information about earlier releases
