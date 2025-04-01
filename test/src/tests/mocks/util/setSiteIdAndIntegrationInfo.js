const path = require('path')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

// Set up SFCC environment first
const Logger = require('../dw.system.Logger')
const Site = require('../dw.system.Site')
const StringUtils = require('../dw.util.StringUtils')

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

// Mock utils.js with original setSiteIdAndIntegrationInfo implementation
const utils = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/utils', {
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    'dw/util/StringUtils': StringUtils,
    '*/cartridge/scripts/klaviyo/services.js': {
        KlaviyoEventService: {}
    }
});

// Export the function directly
module.exports = utils.setSiteIdAndIntegrationInfo;
