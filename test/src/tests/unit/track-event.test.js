const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Site = require('../mocks/dw.system.Site')
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')

global.empty = sinon.stub()

const KlaviyoEventServiceMock = {
    call: () => {
        return { ok: true,
            getEventData: (requestData) => {
                return requestData
            }
        }
    }
}

const klaviyoUtils = proxyquire('../../../../cartridges/int_klaviyo_core/cartridge/scripts/klaviyo/utils.js', {
    'dw/util/StringUtils': StringUtils,
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    '*/cartridge/scripts/klaviyo/services.js': {
        KlaviyoEventService: KlaviyoEventServiceMock
    },
})

describe('int_klaviyo_core/cartridge/scripts/klaviyo/utils => trackEvent', () => {

    beforeEach(() => {
        global.empty.returns(false)
    })

    it('should return { success: true } if trackEvent function succeeds', () => {
        const exchangeID = 'ABaaaaBA'
        const event = 'Added To Cart'
        const data = {
            'Product ID': 'NG3614270264405',
            'Product Name': 'Belle de Teint',
            'Product Page URL': 'https://production-sitegenesis-dw.demandware.net/s/RefArch/home?lang=en_US',
            'Product Image URL': 'https://sforce.co/43Pig4s',
            'Price': 69,
            'Product UPC': '555',
            'Categories': ['Health'],
            'Primary Category': 'Skin Care'
        }

        const testData = {
            type: 'event',
            attributes: {
              profile: {
                  $exchange_id: exchangeID,
              },
              metric: {
                  name: event,
                  service: 'demandware'
              },
              properties: data,
              time: (new Date()).toISOString()
            }
        }

        const expectedResult = { success: true }
        const resultObj = klaviyoUtils.trackEvent(exchangeID, data, event)
        expect(resultObj).to.deep.equal(expectedResult)

        const mockResponse = KlaviyoEventServiceMock.call().getEventData(testData)

        expect(mockResponse).to.have.nested.property('attributes.profile.$exchange_id', exchangeID)
        expect(mockResponse).to.have.nested.property('attributes.metric.name', event)
        expect(mockResponse).to.have.nested.property('attributes.metric.service', 'demandware')
        expect(mockResponse).to.have.nested.property('attributes.properties', data)
        expect(mockResponse).to.have.nested.property('attributes.time')
    })
})