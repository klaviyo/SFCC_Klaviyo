const expect = require('chai').expect
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Site = require('../mocks/dw.system.Site')
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')
const URLUtils = require('../mocks/dw.web.URLUtils')
const setSiteIdAndIntegrationInfo = require('../mocks/util/setSiteIdAndIntegrationInfo')
global.empty = sinon.stub()

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

const getConfigStub = sinon.stub()
const dedupeArrayStub = sinon.stub()
const fullProductModelStub = sinon.stub()

const categories = []

const viewedCategoryEvent = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/eventData/viewedCategory.js', {
        'dw/system/Site': Site,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Logger': Logger,
        'dw/web/URLUtils': URLUtils,
        '*/cartridge/scripts/klaviyo/utils': {
            KLImageSize: 'large',
            dedupeArray: dedupeArrayStub.withArgs(categories).returns(['Health']),
            siteId: Site.getCurrent().getID(),
            setSiteIdAndIntegrationInfo: setSiteIdAndIntegrationInfo
        }
    },
)

describe('int_klaviyo_core/cartridge/scripts/klaviyo/eventData => viewedCategory', () => {
    let resultsDataStub

    beforeEach(() => {
        resultsDataStub = sinon.stub()
        global.empty.returns(false)
    })

    afterEach(() => {
        resultsDataStub.reset()
        getConfigStub.reset()
        dedupeArrayStub.reset()
        fullProductModelStub.reset()
    })

    it('should return specific catalog data for "Viewed Category" event', () => {
        const resultsObj = viewedCategoryEvent.getData('NG227105-LAC')
        expect(resultsObj).to.deep.equal({
            "SiteID": "KlaviyoSFRA",
            "external_catalog_id": "KlaviyoSFRA",
            "integration_key": "demandware",
            "Viewed Category": 'NG227105-LAC',
        })
    })
})
