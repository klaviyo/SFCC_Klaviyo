const getServiceData = ((id) => {
    if (id === 'KlaviyoSubscribeProfilesService') {
        return {
            id: id
        }
    } else if ('KlaviyoEventService') {
        return {
            id: id
        }
    }
})

class Service {
    constructor(id, method) {
        this.ID = id
        this.headers = {}
        this.args = {}
        this.configuration = getServiceData(id)
    }

    addHeader(name, value) {
        this.headers[name] = value
    }

    setRequestMethod(method) {
        this.method = method
    }

    setURL(url) {
        this.url = url
    }

    addParam(name, value) {
        this.args[name] = value
    }
}

module.exports = Service
