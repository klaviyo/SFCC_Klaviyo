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
});
