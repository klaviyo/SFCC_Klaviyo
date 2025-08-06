const expect = require('chai').expect
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Site = require('../mocks/dw.system.Site')
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')
const URLUtils = require('../mocks/dw.web.URLUtils')
const ProductMgr = require('../mocks/dw.catalog.ProductMgr')
const setSiteIdAndIntegrationInfo = require('../mocks/util/setSiteIdAndIntegrationInfo')
global.empty = sinon.stub()

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

const getConfigStub = sinon.stub()
const dedupeArrayStub = sinon.stub()
const fullProductModelStub = sinon.stub()
const getParentProductStub = sinon.stub()

const categories = []
const product = { ID: 'NG3614270264405' }

const categoryMock = {
    displayName: 'Belle de Teint',
    ID: 'NG3614270264405',
    parent: {
        ID: 'NG3614270264405'
    }
}

const apiProductMock = {
    master: true,
    ID: 'NG3614270264406',
    primaryCategory: categoryMock
}

const fullProduct = {
  price: {
    sales: {
      value: 10,
      formatted: '$10.00',
    },
    min: {
      sales: {
        value: 8,
        formatted: '$8.00',
      },
    },
    list: {
      value: 12,
      formatted: '$12.00',
    },
  },
  apiProduct: apiProductMock
}
const options = { pid: product.ID, apiProduct: apiProductMock }

const getProductPrices = proxyquire('int_klaviyo_sfra/cartridge/scripts/klaviyo/viewedProductHelpers.js', {
    originalPriceString: fullProduct.price.list.formatted,
    priceString: fullProduct.price.list,
    '*/cartridge/scripts/helpers/productHelpers': {
        getConfig: getConfigStub.withArgs(product, options).returns(fullProduct),
    },
    '*/cartridge/models/product/fullProduct': fullProductModelStub.withArgs({}, options.apiProduct, options).returns(fullProduct)
})

const viewedProductEvent = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/eventData/viewedProduct.js', {
        'dw/system/Site': Site,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Logger': Logger,
        'dw/web/URLUtils': URLUtils,
        'dw/catalog/ProductMgr': {
            getProduct: function(productID) {
                const productClass = require('../mocks/dw.catalog.Product')
                // Create a master product (no masterProduct property)
                return new productClass({ ID: productID })
            }
        },
        '*/cartridge/scripts/klaviyo/utils': {
            KLImageSize: 'large',
            dedupeArray: dedupeArrayStub.returns(['Health']),
            siteId: Site.getCurrent().getID(),
            setSiteIdAndIntegrationInfo: setSiteIdAndIntegrationInfo,
            getParentProduct: getParentProductStub.returns({ID: 'NG3614270264406', categoryAssignments: [{category: {displayName: 'Health'}}], primaryCategory: {displayName: 'Skin Care'}, getPrimaryCategory: function() {
                return {displayName: 'Skin Care'}
            }})
        },
        '*/cartridge/scripts/klaviyo/viewedProductHelpers.js': getProductPrices,
    },
)

describe('int_klaviyo_core/cartridge/scripts/klaviyo/eventData => viewedProduct', () => {
    beforeEach(() => {
        global.empty.returns(false)
        // Mock empty function to return false for category objects
        global.empty.withArgs({ displayName: 'Skin Care' }).returns(false)
    })

    afterEach(() => {
        getConfigStub.reset()
        dedupeArrayStub.reset()
        fullProductModelStub.reset()
    })

    it('should return specific product data for "Viewed Product" event', () => {
        const expectedResult = {
            "SiteID": "KlaviyoSFRA",
            "external_catalog_id": "KlaviyoSFRA",
            "integration_key": "demandware",
            "Product ID": 'NG3614270264406',
            "Product Name": 'Belle de Teint',
            "Product Page URL": "https://production-sitegenesis-dw.demandware.net/s/RefArch/home?lang=en_US",
            "Product Image URL": "https://sforce.co/43Pig4s",
            "Original Price": 12,
            "Original Price String": "$12.00",
            "Price": 10,
            "Price String": "$10.00",
            "Primary Category": "Skin Care",
            "Product UPC": '555',
            "Categories": [ 'Health' ],
            "value": 10,
            "value_currency": 'USD'
        }

        const resultsObj = viewedProductEvent.getData('NG3614270264406')
        expect(resultsObj).to.deep.equal(expectedResult)
    })
})