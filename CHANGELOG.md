# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to SFCC versioning practice where the Year is the
first number and the Month is the second number. The third number will be
bumped for multiple releases during one month.

<!-- BEGIN RELEASE NOTES -->
### [Unreleased]

### [23.7.1] - 2023-07-13

#### Added
- Test2

### [23.7.0] - 2023-07-13

#### Added
- Added pre-commit to the repository and ran across all files
- Code-less, configurable onsite identification: Merchants can add a setting to have Klaviyo listen for email submission on any field on their site simply by providing a CSS selector. This allows Klaviyo to identify visitors without requiring the merchant to insert JS throughout the site.
- Branded events: Events from the cartridge can all be branded (since they are all normalized and sent server-side). This is a big unlock for prebuilt flows. This is default-enabled but configurable because merchants that migrate to this version may want to disable to avoid ‘breaking changes’ in preexisting flows.
- Checkout rebuild link: Started Checkout includes a link to rebuild the checkout.
- Consent at checkout site preference: Sync subscribers to a specified Klaviyo list ID

#### Changed
- Updated the legacy `_learnq` js object to the new `klaviyo` js object.
- Uses V3 APIs
- Better cross-architecture support and improved developer experience: Event triggering logic is standardized across SFRA and Site Genesis, improved code readability & maintainability by eliminating complex and unused code.

#### Fixed
- Event tracking reliability & setup time: Added OOTB tracking for “Added to Cart” (never fired unless a user was logged in on SFRA), increased event reliability by standardizing on backend trigger logic (and server-side events). This logic is not susceptible to front-end customizations, which were one of the most common reasons for events not triggering.

### [21.10.0] - 2021-10-14

#### Fixed

- Order Confirmation event will now correctly fire for orders with coupons.
- Order Confirmation will now correctly fire if product has no primary category.

#### Changed

- Rename sendEmail function to trackEvent
- Fix grammar/typos in comments and docstrings
- Remove unused functions from Core and SG cartridges
  - sendOrderEmail from Core emailUtils
  - sendKlaviyoShipmentEmail from SG Klaviyo.js controller
- Increased logging coverage for easier debugging
- Updated documentation included with cartridge

### [21.7.0] - 2021-7-27

#### Changed

- Remove unused functions from SFRA and Core cartridges
  - SFRA controller functions
    - FooterSubscribe
    - Subscribe
    - ShipmentConfirmation
  - buildCartDataLayer from SFRA klaviyoUtils
  - sendShipmentConfirmation from Core klaviyoUtils
- Removed unused pageFooter.isml file from SFRA cartridge

### [20.11.0] - 2020-11-25

#### Added

- Enable Prophet debugger to detect cartridge.
- Enable watch and upload cartridge with sgmf cli tool.
- Fix image size and email that can crash if empty.
- Add trackViewedItem for profile tracking.
<!-- END RELEASE NOTES -->

<!-- BEGIN LINKS -->
[Unreleased]: https://github.com/ykolln/SFCC_Klaviyo/compare/23.7.1...HEAD
[23.7.1]: https://github.com/ykolln/SFCC_Klaviyo/compare/23.7.0...23.7.1
[23.7.0]: https://github.com/klaviyo/SFCC_Klaviyo/compare/21.10.0...23.7.0
[21.10.0]: https://github.com/klaviyo/SFCC_Klaviyo/compare/21.7.0...21.10.0
[21.7.0]: https://github.com/klaviyo/SFCC_Klaviyo/compare/20.11.0...21.7.0
[20.11.0]: https://github.com/klaviyo/SFCC_Klaviyo/compare/20.1.0...20.11.0
[20.1.0]: https://github.com/klaviyo/SFCC_Klaviyo/compare/da798cc8d3aeda9465bc9c4bb65d5184e4116e4f...20.1.0
<!-- END LINKS -->

#### NOTE

- The CHANGELOG was created on 2020-11-25 and does not contain information about earlier releases
