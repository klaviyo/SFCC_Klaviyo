const expect = require('chai').expect
const sinon = require('sinon')
const path = require('path')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Site = require('../mocks/dw.system.Site')
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

global.empty = sinon.stub()

// Programmable stub so each test can drive .call() behavior (return value or throw)
// without re-loading the module under test.
const callStub = sinon.stub()
const KlaviyoEventServiceMock = {
    call: function (eventData) {
        return callStub(eventData)
    }
}

const klaviyoUtils = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/utils.js', {
    'dw/util/StringUtils': StringUtils,
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    '*/cartridge/scripts/klaviyo/services.js': {
        KlaviyoEventService: KlaviyoEventServiceMock
    },
})

const exchangeID = 'ABaaaaBA'
const event = 'Added To Cart'
const data = {
    'Product ID': 'NG3614270264405',
    'Product Name': 'Belle de Teint',
    'Price': 69
}

describe('int_klaviyo_core/cartridge/scripts/klaviyo/utils => trackEvent', () => {

    let loggerErrorSpy

    beforeEach(() => {
        global.empty.returns(false)
        callStub.reset()
        loggerErrorSpy = sinon.spy(Logger, 'error')
    })

    afterEach(() => {
        loggerErrorSpy.restore()
    })

    it('should return { success: true } when the service call succeeds', () => {
        callStub.returns({ ok: true })

        const result = klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(result).to.deep.equal({ success: true })
        expect(callStub.calledOnce).to.be.true
    })

    // Regression test for IES-228 / IES-225 (TaylorMade May 5, 2026 outage).
    // During the Kong outage, Klaviyo's API returned a 502 with an HTML body. The
    // previous implementation called JSON.parse(result.errorMessage) on the
    // unhappy path, which threw SyntaxError on the HTML body and propagated up
    // to the checkout controller, taking the storefront down.
    it('should return { success: false } and not throw on a 5xx with a non-JSON (HTML) body', () => {
        callStub.returns({
            ok: false,
            error: 502,
            errorMessage: '<html><body>502 Bad Gateway</body></html>'
        })

        const fn = () => klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(fn).to.not.throw()
        expect(fn()).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
    })

    // Connection error / connection timeout surface in SFCC as a null result
    // from service.call(). Previously trackEvent returned bare undefined here,
    // breaking the { success } contract callers expect for the kldebug overlay.
    it('should return { success: false } and log when the service call returns null (connection error / timeout)', () => {
        callStub.returns(null)

        const result = klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(result).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
    })

    // A socket-level timeout or framework error inside parseResponse can surface
    // as a thrown exception. The try/catch in trackEvent must swallow it so the
    // checkout controller is not interrupted.
    it('should return { success: false } and not re-throw when the service call throws', () => {
        callStub.throws(new Error('simulated socket timeout'))

        const fn = () => klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(fn).to.not.throw()
        expect(fn()).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
    })
})
