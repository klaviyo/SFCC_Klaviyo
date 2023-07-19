const sinon = require('sinon')
const path = require('path')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Site = require('../mocks/dw.system.Site')
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')
const ServiceRegistry = require('../mocks/dw.svc.LocalServiceRegistry')

require('../mocks/util/globalMocks')()
require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

global.empty = sinon.stub()

const email = 'unittest_01-10@mailinator.com'
const phone_number = '+15558675309'
let KlaviyoSubscribeProfilesService

const servicesMock = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/services.js',
{
    'dw/system/Logger': Logger,
    'dw/svc/LocalServiceRegistry': ServiceRegistry,
    'dw/system/Site': Site,
})

KlaviyoSubscribeProfilesService = servicesMock.KlaviyoSubscribeProfilesService

const subscriberUtilsStub = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/utils.js', {
    'dw/util/StringUtils': StringUtils,
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    '*/cartridge/scripts/klaviyo/services.js': {
        KlaviyoSubscribeProfilesService: KlaviyoSubscribeProfilesService,
    },
})

describe('int_klaviyo_core/cartridge/scripts/klaviyo/utils => subscribeUser', () => {

    beforeEach(() => {
        global.empty.returns(false)
    })

    it('verifies the KlaviyoSubscribeProfilesService responds with (202) when valid email and phone number are provided', () => {
        subscriberUtilsStub.subscribeUser(email, phone_number)
    })

    it('verifies the KlaviyoSubscribeProfilesService responds with (202) when valid email and phone number is null', () => {
        subscriberUtilsStub.subscribeUser(email, null)
    })

    it('verifies the KlaviyoSubscribeProfilesService responds with (400) when internal phone number validation fails', () => {
        subscriberUtilsStub.subscribeUser(email, undefined)
    })

    it('verifies the KlaviyoSubscribeProfilesService responds with (400) when the response does not contain an error message', () => {
        subscriberUtilsStub.subscribeUser()
    })
})
