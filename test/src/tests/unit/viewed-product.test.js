const expect = require('chai').expect
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Site = require('../mocks/dw.system.Site')
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')
const URLUtils = require('../mocks/dw.web.URLUtils')
const ProductMgr = require('../mocks/dw.catalog.ProductMgr')

global.empty = sinon.stub()

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

const getConfigStub = sinon.stub()
const dedupeArrayStub = sinon.stub()
const fullProductModelStub = sinon.stub()

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
    variant: true,
    masterProduct: {
        primaryCategory: categoryMock
    },
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
        'dw/catalog/ProductMgr': ProductMgr,
        '*/cartridge/scripts/klaviyo/utils': {
            KLImageSize: 'large',
            dedupeArray: dedupeArrayStub.withArgs(categories).returns(['Health'])
        },
        '*/cartridge/scripts/klaviyo/viewedProductHelpers.js': getProductPrices,
    },
)

describe('int_klaviyo_core/cartridge/scripts/klaviyo/eventData => viewedProduct', () => {
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

    it('should return specific product data for "Viewed Product" event', () => {
        const expectedResult = { object:
            {
                "Product ID": 'NG3614270264405',
                "Product Name": 'Belle de Teint',
                "Product Page URL": "https://production-sitegenesis-dw.demandware.net/s/RefArch/home?lang=en_US",
                "Product Image URL": "https://sforce.co/43Pig4s",
                "Master Product ID": "NG3614270264405",
                "Original Price": 12,
                "Original Price String": "$12.00",
                "Price": 10,
                "Price String": "$10.00",
                "Product UPC": '555',
                "Categories": [ 'Health' ],
                "Primary Category": 'Skin Care'
            }
        }

        const stubResults = resultsDataStub.returns(expectedResult)
        const resultsObj = viewedProductEvent.getData('NG227105-LAC')
        expect(resultsObj).to.deep.equal(stubResults().object)
        expect(resultsDataStub.calledOnce).to.be.true
    })
})