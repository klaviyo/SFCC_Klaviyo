# Klaviyo Cartridge for B2C Commerce

This is the Salesforce Certified Commerce Cloud Cartridge to integrate Klaviyo.

## Making updates
1) Follow Klaviyo's standard process of making a pull request and getting it reviewed before merging.
2) Update [CHANGELOG.md](https://github.com/klaviyo/SFCC_Klaviyo/blob/master/CHANGELOG.md). Details on formatting the changelog (including categorizing changes) can be found here: [keepachangelog.com](https://keepachangelog.com/en/1.0.0/)
    1) If this is a change that will not immediately get sent along to Salesforce i.e. not a version update:
        1) Add any changes under the [`[Unreleased]`](https://github.com/klaviyo/SFCC_Klaviyo/blob/master/CHANGELOG.md#unreleased) section. This will be a comparison of the most recent commits to the latest tagged version.
    2) If this is a version update:
        1) Add a new version between `[Unreleased]` and the most recent version. Include the incremented version number following [semantic versioning](https://semver.org/spec/v2.0.0.html) practices and the date. Add your changes under this version.
        2) Move any unreleased changes into your version update under the appropriate categories.
        3) Update the `[Unreleased]` link to point from your new version to HEAD e.g. if you're updating to version 1.0.2 you'd update the link from `1.0.1...HEAD` to `1.0.2...HEAD`.
        4) Add a link to your new version. The tag won't yet exist but you can create a link to the tag you will create shortly. Follow the pattern of previous links.
3) Upon approval merge your changes into master.