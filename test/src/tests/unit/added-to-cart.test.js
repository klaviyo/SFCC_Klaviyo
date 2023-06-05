const expect = require('chai').expect
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Logger = require('../mocks/dw.system.Logger')
const URLUtils = require('../mocks/dw.web.URLUtils')
const ProductMgr = require('../mocks/dw.catalog.ProductMgr')
const BasketMgr = require('../mocks/BasketMgr')
const basketStubs = require('../mocks/util/basketObjectStubs')

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

global.empty = sinon.stub()

const basketManagerMock = new BasketMgr()
const currentBasket = basketManagerMock.getCurrentBasket()

const addedToCartEvent = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/eventData/addedToCart.js', {
    'dw/system/Logger': Logger,
    'dw/web/URLUtils': URLUtils,
    'dw/catalog/ProductMgr': ProductMgr,
    '*/cartridge/scripts/klaviyo/utils': {
        KLImageSize: 'large',
        EVENT_NAMES: {
            'addedToCart': 'Added to Cart',
        },
        captureProductOptions: basketStubs().pdctLineItems,
        captureProductBundles: basketStubs().bundlePdct,
        priceCheck: () => {
            return {
                purchasePrice: 10.00,
                purchasePriceValue: 10.00,
                originalPrice: 20.00,
                originalPriceValue: 20.00
            }
        },
        dedupeArray: () => {
            return ['Skin Care']
        }
    },
})

describe('int_klaviyo_core/cartridge/scripts/klaviyo/eventData => addedToCart', () => {

    beforeEach(() => {
        global.empty.returns(false)
    })

    it('should return event data for "Added to Cart Event" event', () => {
        const expectedResult = {
            event: 'Added to Cart',
            basketGross: 99.99,
            itemCount: 1,
            lineItems: [
              {
                productID: 'NG3614270264405',
                productName: 'Belle de Teint',
                productImageURL: 'https://sforce.co/43Pig4s',
                productPageURL: 'https://production-sitegenesis-dw.demandware.net/s/RefArch/home?lang=en_US',
                productUPC: '555',
                viewedProductAvailability: 1,
                categories: ['Health'],
                primaryCategory: 'Skin Care',
                masterProductID: 'NG3614270264405',
                price: 10.00,
                priceValue: 10.00,
                originalPrice: 20.00,
                originalPriceValue: 20.00,
                'productOptions': [{
                    'basePrice': {
                        'value': 0.99
                    },
                    'lineItemText': 'lineItemText1',
                    'optionID': 'optionId1',
                    'optionValueID': 'selectedValueId1',
                    'productName': 'productName1',
                },
                {
                    'basePrice': {
                        'value': 1.99
                    },
                    'lineItemText': 'lineItemText2',
                    'optionID': 'optionId2',
                    'optionValueID': 'selectedValueId2',
                    'productName': 'productName2',
                }],
                'Is Product Bundle': true,
                'Bundled Product IDs': [
                    'sony-ps3-consoleM',
                    'easports-nascar-09-ps3M',
                    'easports-monopoly-ps3M',
                    'namco-eternal-sonata-ps3M',
                    'sony-warhawk-ps3M'
                ],
                'Is Bonus Product': true
              }
            ],
            items: [ 'Belle de Teint' ],
            categories: [ 'Skin Care' ],
            primaryCategories: [ 'Skin Care' ],
            productAddedToCart: {}
        }
        const resultsObj = addedToCartEvent.getData(currentBasket)
        expect(resultsObj).to.deep.equal(expectedResult)
    })
})