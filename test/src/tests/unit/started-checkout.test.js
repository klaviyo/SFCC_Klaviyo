const expect = require('chai').expect
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')
const URLUtils = require('../mocks/dw.web.URLUtils')
const ProductMgr = require('../mocks/dw.catalog.ProductMgr')
const BasketMgr = require('../mocks/BasketMgr')
const Money = require('../mocks/dw.value.Money')
const basketStubs = require('../mocks/util/basketObjectStubs')

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

global.empty = sinon.stub()

const basketManagerMock = new BasketMgr()
const currentBasket = basketManagerMock.getCurrentBasket()

const startedCheckoutEvent = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/eventData/startedCheckout.js', {
        'dw/system/Logger': Logger,
        'dw/web/URLUtils': URLUtils,
        'dw/catalog/ProductMgr': ProductMgr,
        '*/cartridge/scripts/klaviyo/utils': {
            KLImageSize: 'large',
            captureProductOptions: basketStubs().pdctLineItems,
            captureBonusProduct: basketStubs().bonusPdct,
            captureProductBundles: basketStubs().bundlePdct
        },
        'dw/util/StringUtils': StringUtils,
        'dw/value/Money': Money,
        prepareProductObj: basketStubs().prepProduct
    },
)

describe('int_klaviyo_core/cartridge/scripts/klaviyo/eventData => startedCheckout', () => {
    let productResultsDataStub
    let optionProductStub
    let bundleProductStub

    beforeEach(() => {
        productResultsDataStub = sinon.stub()
        optionProductStub = sinon.stub()
        bundleProductStub = sinon.stub()
        global.empty.returns(false)
    })

    afterEach(() => {
        productResultsDataStub.reset()
        optionProductStub.reset()
        bundleProductStub.reset()
    })

    it('should return the correct basket data for "Started Checkout" event', () => {
        const expectedResult = {
            'Basket Gross Price': 99.99,
            Categories: [
                'Health'
            ],
            'Item Count': 1,
            line_items: [
                {
                    'Is Bonus Product': true,
                    'Original Price': 100,
                    'Original Price Value': 99,
                    Price: 96,
                    'Price Value': 1,
                    'Product ID': 'NG3614270264405',
                    'Product Name': 'Belle de Teint',
                    'Product Image URL': 'https://sforce.co/43Pig4s',
                    'Product Options': basketStubs().productOpts,
                    'Product Description': null,
                    'Product Page URL': 'https://production-sitegenesis-dw.demandware.net/s/RefArch/home?lang=en_US',
                    'Product UPC': '555',
                    'Product Availability Model': 1,
                    'Master Product ID': 'NG3614270264405',
                    'Is Product Bundle': true,
                    'Bundled Product IDs': [
                        "sony-ps3-consoleM",
                        "easports-nascar-09-ps3M",
                        "easports-monopoly-ps3M",
                        "namco-eternal-sonata-ps3M",
                        "sony-warhawk-ps3M"
                    ],
                    Categories: [ 'Health' ],
                }
            ],
            Items: [],
            '$email': 'qa@unittest.com',
            cartRebuildingLink: 'https://production-sitegenesis-dw.demandware.net/s/RefArch/home?lang=en_US?items='
        }

        const stubResults = productResultsDataStub.returns(expectedResult)
        const resultsObj = startedCheckoutEvent.getData(currentBasket)
        expect(resultsObj).to.deep.equal(stubResults())
        expect(productResultsDataStub.calledOnce).to.be.true
    })

    it('should return the correct basket data for "Started Checkout" with product that includes product options', () => {
        const expectedResult = [
            {
              optionID: 'optionId1',
              optionValueID: 'selectedValueId1',
              productName: 'productName1',
              lineItemText: 'lineItemText1',
              basePrice: { value: 0.99 }
            },
            {
              optionID: 'optionId2',
              optionValueID: 'selectedValueId2',
              productName: 'productName2',
              lineItemText: 'lineItemText2',
              basePrice: { value: 1.99 }
            }
        ]

        const stubResults = optionProductStub.returns(expectedResult)
        const resultsObj = startedCheckoutEvent.getData(currentBasket).line_items[0]['Product Options']
        expect(resultsObj).to.deep.equal(stubResults())
        expect(optionProductStub.calledOnce).to.be.true
    })

    it('should return the correct basket data for "Started Checkout" with product bundle', () => {
        const expectedResult = [
            "sony-ps3-consoleM",
            "easports-nascar-09-ps3M",
            "easports-monopoly-ps3M",
            "namco-eternal-sonata-ps3M",
            "sony-warhawk-ps3M"
        ]

        const stubResults = bundleProductStub.returns(expectedResult)
        const resultsObj = startedCheckoutEvent.getData(currentBasket).line_items[0]['Bundled Product IDs']
        expect(resultsObj).to.deep.equal(stubResults())
        expect(bundleProductStub.calledOnce).to.be.true
    })

    it('should return the correct basket data for "Started Checkout" with bonus product', () => {
        const resultsObj = startedCheckoutEvent.getData(currentBasket).line_items[0]
        expect(resultsObj).to.have.nested.property('Is Bonus Product', true)
        expect(resultsObj).to.have.nested.property('Original Price', 100)
        expect(resultsObj).to.have.nested.property('Original Price Value', 99)
        expect(resultsObj).to.have.nested.property('Price', 96)
        expect(resultsObj).to.have.nested.property('Price Value', 1)
    })
})