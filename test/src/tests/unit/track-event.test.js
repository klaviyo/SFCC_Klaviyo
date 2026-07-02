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
    it('should return { success: false } and log a 5xx classification with status code on a 5xx with a non-JSON (HTML) body', () => {
        callStub.returns({
            ok: false,
            error: 502,
            errorMessage: '<html><body>502 Bad Gateway</body></html>'
        })

        const result = klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(result).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
        const logMsg = loggerErrorSpy.firstCall.args[0]
        expect(logMsg).to.match(/status=502/)
        expect(logMsg).to.match(/unavailable/)
    })

    // 4xx (e.g. payload validation): the log must classify it as "Klaviyo
    // responding" so support can tell it apart from a Klaviyo outage.
    it('should log a 4xx classification with status code when the service returns a 4xx', () => {
        callStub.returns({
            ok: false,
            error: 400,
            errorMessage: '{"errors":[{"detail":"invalid email"}]}'
        })

        const result = klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(result).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
        const logMsg = loggerErrorSpy.firstCall.args[0]
        expect(logMsg).to.match(/status=400/)
        expect(logMsg).to.match(/4xx rejected/)
    })

    // Connection error / connection timeout surface in SFCC as a null result
    // from service.call(). Previously trackEvent returned bare undefined here,
    // breaking the { success } contract callers expect for the kldebug overlay.
    it('should return { success: false } and log "unreachable" when the service call returns null (connection error / timeout)', () => {
        callStub.returns(null)

        const result = klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(result).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
        expect(loggerErrorSpy.firstCall.args[0]).to.match(/unreachable/)
    })

    // A socket-level timeout or framework error inside parseResponse can surface
    // as a thrown exception. The try/catch in trackEvent must swallow it so the
    // checkout controller is not interrupted. The log must include the
    // exception name and stack to be useful for debugging.
    it('should return { success: false } and log exception name + stack when the service call throws', () => {
        callStub.throws(new Error('simulated socket timeout'))

        const result = klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(result).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
        const logMsg = loggerErrorSpy.firstCall.args[0]
        expect(logMsg).to.match(/name=Error/)
        expect(logMsg).to.match(/message=simulated socket timeout/)
        expect(logMsg).to.match(/stack=/)
    })

    // Defensive against pathological throws (e.g. a downstream helper does
    // `throw "oops"` or `throw null`). The formatException helper must fall
    // back to something human-readable so the log line never contains a raw
    // "undefined". Uses sinon's callsFake to bypass sinon.stub.throws, which
    // wraps non-Error values in an Error and defeats this test.
    it('should not render "undefined" in the log when the service call throws a non-Error value', () => {
        callStub.callsFake(() => { throw 'oops-not-an-error' })

        const result = klaviyoUtils.trackEvent(exchangeID, data, event)

        expect(result).to.deep.equal({ success: false })
        expect(loggerErrorSpy.called).to.be.true
        const logMsg = loggerErrorSpy.firstCall.args[0]
        expect(logMsg).to.not.match(/undefined/)
        expect(logMsg).to.match(/oops-not-an-error/)
    })
})
