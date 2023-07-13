const sandboxedModule = require('sandboxed-module')

module.exports = sandboxedModule.load('../../../../../../../../../cartridges/int_klaviyo_core/cartridge/scripts/klaviyo/services', {
    requires: {
        'dw/svc/LocalServiceRegistry': require('../../../../../dw.svc.LocalServiceRegistry'),
        'dw/system/Site': require('../../../../../dw.system.Site')
    },
    singleOnly: true
})