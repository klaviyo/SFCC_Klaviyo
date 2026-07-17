const expect = require('chai').expect
const path = require('path');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Logger = require('../mocks/dw.system.Logger');
const Site = require('../mocks/dw.system.Site');
const StringUtils = require('../mocks/dw.util.StringUtils');

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'));

const utils = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/utils', {
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    'dw/util/StringUtils': StringUtils,
    '*/cartridge/scripts/klaviyo/services.js': {
        KlaviyoEventService: {}
    }
});

describe('klaviyoUtils', () => {
    describe('setSiteIdAndIntegrationInfo', () => {
        it('should set the siteId and integrationInfo on the data object', () => {
            const data = {};
            utils.setSiteIdAndIntegrationInfo(data, 'testSiteId');

            expect(data).to.deep.equal({
                SiteID: 'testSiteId',
                integration_key: 'demandware',
                external_catalog_id: 'testSiteId',
            });
        });
    });

    describe('currency helpers (IES-235)', () => {
        const optionLineItems = [{
            lineItemText: 'Gift Wrap',
            optionID: 'giftWrap',
            optionValueID: 'yes',
            basePrice: { value: 5 }
        }]

        const lineItem = {
            adjustedPrice: { value: 10 },
            price: { value: 12 }
        }

        const product = {
            getPriceModel: function() {
                return {
                    getPrice: function() {
                        return { value: 20 }
                    },
                    // priceInfo.priceBook must be present so priceCheck can resolve a root book
                    priceInfo: {
                        priceBook: {}
                    },
                    getPriceBookPrice: function() {
                        return null
                    }
                }
            }
        }

        let previousSession
        let previousDw

        beforeEach(() => {
            previousSession = global.session
            previousDw = global.dw
            global.session = {
                getCurrency: function() {
                    return {
                        getCurrencyCode: function() {
                            return 'USD'
                        }
                    }
                }
            }
            global.dw = {
                value: {
                    Money: function(value, currencyCode) {
                        return { value: value, currencyCode: currencyCode }
                    }
                }
            }
        })

        afterEach(() => {
            global.session = previousSession
            global.dw = previousDw
        })

        it('captureProductOptions should use the provided currencyCode over session', () => {
            const options = utils.captureProductOptions(optionLineItems, 'EUR')
            expect(options[0]['Option Price'].currencyCode).to.equal('EUR')
        })

        it('captureProductOptions should fall back to session currency when currencyCode is omitted', () => {
            const options = utils.captureProductOptions(optionLineItems)
            expect(options[0]['Option Price'].currencyCode).to.equal('USD')
        })

        it('captureBonusProduct should use the provided currencyCode over session', () => {
            const bonus = utils.captureBonusProduct(lineItem, product, 'EUR')
            expect(bonus.originalPrice.currencyCode).to.equal('EUR')
            expect(bonus.price.currencyCode).to.equal('EUR')
        })

        it('captureBonusProduct should fall back to session currency when currencyCode is omitted', () => {
            const bonus = utils.captureBonusProduct(lineItem, product)
            expect(bonus.originalPrice.currencyCode).to.equal('USD')
            expect(bonus.price.currencyCode).to.equal('USD')
        })

        it('priceCheck should use the provided currencyCode over session', () => {
            const priceData = utils.priceCheck(lineItem, product, 'EUR')
            expect(priceData.purchasePrice.currencyCode).to.equal('EUR')
            expect(priceData.originalPrice.currencyCode).to.equal('EUR')
        })

        it('priceCheck should fall back to session currency when currencyCode is omitted', () => {
            const priceData = utils.priceCheck(lineItem, product)
            expect(priceData.purchasePrice.currencyCode).to.equal('USD')
            expect(priceData.originalPrice.currencyCode).to.equal('USD')
        })
    })
});
