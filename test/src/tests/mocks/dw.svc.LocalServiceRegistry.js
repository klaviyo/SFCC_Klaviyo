const Service = require('./util/service')
const responseDataMock = require('./util/responseDataMock')

getResponse = (requestBody) => {
    let phone
    let response = {}
    const dataObj = requestBody.data.attributes.subscriptions[0]
    phone = dataObj.phone_number

    // Case 1: Subscribe request is made to Klaviyo to the email channel, including both email and phone number. Response is successful (202)
    if (dataObj.email && phone) {
        response.statusCode = 202,
        response.errorText = null,
        response.statusMessage = 'success',
        response.text = responseDataMock.subscribeSuccessMock
    // Case 1: Subscribe request is made to Klaviyo to the email channel, including both email and phone_number is null. Response is successful (202)
    } else if (dataObj.email && phone === null) {
        response.statusCode = 202,
        response.errorText = null,
        response.statusMessage = 'success',
        response.text = responseDataMock.subscribeSuccessMock
    // Case 2: Subscribe request is made to Klaviyo to the email channel, including both email and phone number. Response is not successful (400) and response contains an error message indicating phone number was invalid:
    } else if (dataObj.email && phone === undefined) {
        response.statusCode = 400,
        response.errorText = 'The phone number provided either does not exist or is ineligible to receive SMS',
        response.statusMessage = 'error',
        response.text = responseDataMock.invalidPhoneErrorMock
    // Case 3: Subscribe request is made to Klaviyo to the email channel, including both email and phone number. Response is not not successful (400) and response does not contain an error message indicating phone number was invalid:
    } else {
        response.statusCode = 400,
        response.errorText = 'Some other error occurred',
        response.statusMessage = 'error',
        response.text = responseDataMock.otherErrorMock
    }

    return response
}

class ServiceRegistry {
    createService(serviceId, fn) {
        const svc = new Service(serviceId)
        return {
            call: (requestBody) => {
                fn.createRequest(svc, requestBody)
                const response = getResponse(requestBody)
                const parsedResponse = fn.parseResponse(svc, response)

                fn.getRequestLogMessage(requestBody)
                fn.getResponseLogMessage(response)

                return parsedResponse
            },
        }
    }
}

module.exports = new ServiceRegistry
