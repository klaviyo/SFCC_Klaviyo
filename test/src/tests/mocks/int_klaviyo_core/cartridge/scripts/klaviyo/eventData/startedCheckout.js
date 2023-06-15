const SandboxedModule = require('sandboxed-module')
const path = require('path')

require('app-module-path').addPath(path.join(process.cwd(), '../../../../../../../../cartridges'))

module.exports = SandboxedModule.require('int_klaviyo_core/cartridge/scripts/klaviyo/eventData/startedCheckout.js', {
    requires: {
        'dw/util/StringUtils': require('../../../../../dw.util.StringUtils'),
        '*/cartridge/scripts/klaviyo/utils': {
            KLImageSize: 'large'
        },
    },
    singleOnly: true
})