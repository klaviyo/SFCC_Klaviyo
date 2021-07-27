# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to SFCC versioning practice where the Year is the
first number and the Month is the second number. The third number will be
bumped for multiple releases during one month.

### [Unreleased]
#### Updated
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

[Unreleased]: https://github.com/SalesforceCommerceCloud/link_klaviyo/compare/HEAD...release-20.11.0
[20.11.0]: https://github.com/SalesforceCommerceCloud/link_klaviyo/compare/release-20.11.0...release-20.1.0
[20.1.0]: https://github.com/SalesforceCommerceCloud/link_klaviyo/compare/release-20.1.0...master


#### NOTE
- The CHANGELOG was created on 2020-11-25 and does not contain information about earlier releases
