let mockPreferences = {
    klaviyo_api_key: 'ababababababababab',
    klaviyo_sendEventsAsSFCC: 'demandware'
}

const preferences = {}

const Site = {
    current: {
        getID() {
            return 'KlaviyoSFRA'
        },
        getCustomPreferenceValue(key) {
            if (Object.prototype.hasOwnProperty.call(mockPreferences, key)) {
                return mockPreferences[key];
        }

            return preferences[key]
        }
    },
    getCurrent() {
        return this.current
    }
}

const setMockPreferenceValue = (key, value, isEnum) => {
    if (isEnum) {
        mockPreferences[key] = {
            getValue() {
                return value
            }
        };
    } else {
        mockPreferences[key] = value
    }
}

const restore = () => {
    mockPreferences = {}
}

module.exports = Site
module.exports.setMockPreferenceValue = setMockPreferenceValue
module.exports.restore = restore

Object.defineProperty(module.exports, 'preferences', {
    get: () => Object.assign({}, preferences, mockPreferences)
})

// const Site = function () {}
//
// Site.prototype.getCurrencyCode = function () {}
// Site.prototype.getName = function () {}
// Site.prototype.getID = function () {}
// Site.getCurrent = function () {
//     return new Site()
// }
// Site.prototype.getPreferences = function () {
//     return this.preferences
// }
// Site.prototype.getHttpHostName = function () {}
// Site.prototype.getHttpsHostName = function () {}
// Site.prototype.getCustomPreferenceValue = function (prefName) {
//     let customPrefs = this.preferences.custom
//     return customPrefs[prefName] // 'klaviyo_api_key'
// }
// Site.prototype.setCustomPreferenceValue = function () {}
// Site.prototype.getDefaultLocale = function () {}
// Site.prototype.getAllowedLocales = function () {}
// Site.prototype.getAllowedCurrencies = function () {}
// Site.prototype.getDefaultCurrency = function () {}
// Site.prototype.getTimezone = function () {}
// Site.prototype.getTimezoneOffset = function () {}
// Site.prototype.isOMSEnabled = function () {}
// Site.prototype.currencyCode = null
// Site.prototype.name = null
// Site.prototype.ID = null
// Site.prototype.current = null
// Site.prototype.preferences = null
// Site.prototype.httpHostName = null
// Site.prototype.httpsHostName = null
// Site.prototype.customPreferenceValue = null
// Site.prototype.defaultLocale = null
// Site.prototype.allowedLocales = null
// Site.prototype.allowedCurrencies = null
// Site.prototype.defaultCurrency = null
// Site.prototype.timezone = null
// Site.prototype.timezoneOffset = null
// Site.prototype.calendar = null
//
// module.exports = Site