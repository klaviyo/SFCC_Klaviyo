const invalidPhoneMsgErrorMock = JSON.stringify({
    errors: [{
        'id': 'e5c16f07-42a5-4f36-88c5-e4704c04cf7e',
        'status': 400,
        'code': 'invalid',
        'title': 'Invalid input.',
        'detail': 'The phone number provided either does not exist or is ineligible to receive SMS',
        'source': {
            'pointer': 'phone_number'
        },
        'meta': {}
    }]
})

const otherErrorMsgMock = JSON.stringify({
    'errors': [{
        'id': 'e5c16f07-42a5-4f36-88c5-e4704c04cf7e',
        'status': 400,
        'code': 'invalid',
        'title': 'Invalid input.',
        'detail': 'Some other detail not relating to phone number validity',
        'source': {
            'pointer': 'email'
        },
        'meta': {}
    }]
})

const subscribeSuccessMock = {
    ok: true,
    status: 202
}

const invalidPhoneErrorMock = {
    ok: false,
    error: 400,
    'errorMessage': invalidPhoneMsgErrorMock,
}

const otherErrorMock = {
    ok: false,
    error: 400,
    'errorMessage': otherErrorMsgMock,
}

module.exports = {
    subscribeSuccessMock,
    invalidPhoneErrorMock,
    otherErrorMock
}