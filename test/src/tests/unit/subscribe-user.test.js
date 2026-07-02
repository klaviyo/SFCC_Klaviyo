const expect = require('chai').expect
const sinon = require('sinon')
const path = require('path')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Site = require('../mocks/dw.system.Site')
const StringUtils = require('../mocks/dw.util.StringUtils')
const Logger = require('../mocks/dw.system.Logger')

require('app-module-path').addPath(path.join(process.cwd(), '../cartridges'))

global.empty = global.empty || sinon.stub()

// session.custom is read directly inside subscribeUser to gate the email and
// SMS branches; provide a settable shape so each test can opt in/out.
global.session = global.session || {}
global.session.custom = global.session.custom || {}

// Programmable stub so each test can drive .call() behavior (return value or
// throw) without re-loading the module under test.
const subscribeCallStub = sinon.stub()
const KlaviyoSubscribeProfilesServiceMock = {
    call: function (data) {
        return subscribeCallStub(data)
    }
}

Site.setMockPreferenceValue('klaviyo_email_list_id', 'EMAIL_LIST_ID')
Site.setMockPreferenceValue('klaviyo_sms_list_id', 'SMS_LIST_ID')

const klaviyoUtils = proxyquire('int_klaviyo_core/cartridge/scripts/klaviyo/utils.js', {
    'dw/util/StringUtils': StringUtils,
    'dw/system/Logger': Logger,
    'dw/system/Site': Site,
    '*/cartridge/scripts/klaviyo/services.js': {
        KlaviyoSubscribeProfilesService: KlaviyoSubscribeProfilesServiceMock
    }
})

describe('int_klaviyo_core/cartridge/scripts/klaviyo/utils => subscribeUser', () => {

    let loggerErrorSpy

    beforeEach(() => {
        global.empty.returns(false)
        subscribeCallStub.reset()
        loggerErrorSpy = sinon.spy(Logger, 'error')
        global.session.custom.KLEmailSubscribe = false
        global.session.custom.KLSmsSubscribe = false
    })

    afterEach(() => {
        loggerErrorSpy.restore()
    })

    // Don't-retry-when-down behavior (IES-228): a null result from the email
    // call indicates a connection error or timeout -- Klaviyo is hard-down. We
    // must not waste another full timeout window on the SMS call. The log must
    // classify the failure as "unreachable" so support can act on it.
    it('should skip the SMS branch and log "unreachable" when the email service call returns null', () => {
        global.session.custom.KLEmailSubscribe = true
        global.session.custom.KLSmsSubscribe = true

        subscribeCallStub.returns(null)

        const fn = () => klaviyoUtils.subscribeUser('shopper@example.com', '+15555550100')

        expect(fn).to.not.throw()
        // Only the email call should have fired; the SMS call must be skipped.
        expect(subscribeCallStub.callCount).to.equal(1)
        expect(loggerErrorSpy.called).to.be.true
        expect(loggerErrorSpy.firstCall.args[0]).to.match(/unreachable/)
    })

    // Same principle as above but for thrown exceptions (e.g. socket-level
    // timeout surfaced as an exception rather than a null result). The log must
    // include exception name + stack to be useful for debugging.
    it('should skip the SMS branch and log exception name + stack when the email service call throws', () => {
        global.session.custom.KLEmailSubscribe = true
        global.session.custom.KLSmsSubscribe = true

        subscribeCallStub.throws(new Error('simulated socket timeout'))

        const fn = () => klaviyoUtils.subscribeUser('shopper@example.com', '+15555550100')

        expect(fn).to.not.throw()
        expect(subscribeCallStub.callCount).to.equal(1)
        expect(loggerErrorSpy.called).to.be.true
        const logMsg = loggerErrorSpy.firstCall.args[0]
        expect(logMsg).to.match(/name=Error/)
        expect(logMsg).to.match(/message=simulated socket timeout/)
        expect(logMsg).to.match(/stack=/)
    })

    // 5xx === Klaviyo is unresponsive. Same skip behavior as null/throw.
    // This is the Kong-outage scenario for the subscribe service: a 502 with
    // an HTML body. Previously the JSON.parse would also throw on the HTML
    // body, but even with that fixed we should not attempt the SMS call. The
    // log must include the status code so support can confirm the 5xx.
    it('should skip the SMS branch and log a 5xx classification with status code when the email service returns a 5xx with a non-JSON (HTML) body', () => {
        global.session.custom.KLEmailSubscribe = true
        global.session.custom.KLSmsSubscribe = true

        subscribeCallStub.returns({
            ok: false,
            error: 502,
            errorMessage: '<html><body>502 Bad Gateway</body></html>'
        })

        const fn = () => klaviyoUtils.subscribeUser('shopper@example.com', '+15555550100')

        expect(fn).to.not.throw()
        expect(subscribeCallStub.callCount).to.equal(1)
        expect(loggerErrorSpy.called).to.be.true
        const logMsg = loggerErrorSpy.firstCall.args[0]
        expect(logMsg).to.match(/status=502/)
        expect(logMsg).to.match(/unavailable/)
    })

    // Critical positive case: a 4xx response means Klaviyo IS responding (just
    // rejecting our payload), so the SMS subscribe -- a fully independent
    // request with a different payload -- must still be attempted. The log must
    // classify it as "4xx rejected" so support knows Klaviyo is up.
    it('should still attempt the SMS branch and log a 4xx classification with status code when the email call returns a 4xx', () => {
        global.session.custom.KLEmailSubscribe = true
        global.session.custom.KLSmsSubscribe = true

        // Return a 400 with a body that does NOT match the phone-validation
        // retry condition, so the email branch finishes without triggering the
        // internal retry-without-phone path.
        subscribeCallStub.onFirstCall().returns({
            ok: false,
            error: 400,
            errorMessage: JSON.stringify({ errors: [{ code: 'invalid', detail: 'something else' }] })
        })
        subscribeCallStub.onSecondCall().returns({ ok: true })

        const fn = () => klaviyoUtils.subscribeUser('shopper@example.com', '+15555550100')

        expect(fn).to.not.throw()
        // Email call (1) + SMS call (2) -- both attempted because 400 is not a "down" signal.
        expect(subscribeCallStub.callCount).to.equal(2)
        expect(loggerErrorSpy.called).to.be.true
        const logMsg = loggerErrorSpy.firstCall.args[0]
        expect(logMsg).to.match(/status=400/)
        expect(logMsg).to.match(/4xx rejected/)
    })

    // Happy-path end-to-end regression: both calls should succeed.
    it('should attempt both branches when both succeed', () => {
        global.session.custom.KLEmailSubscribe = true
        global.session.custom.KLSmsSubscribe = true

        subscribeCallStub.returns({ ok: true })

        const fn = () => klaviyoUtils.subscribeUser('shopper@example.com', '+15555550100')

        expect(fn).to.not.throw()
        expect(subscribeCallStub.callCount).to.equal(2)
    })
})
