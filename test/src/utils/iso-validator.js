function isValidIso8601(val) {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    try {
        const isValid = iso8601Regex.test(val)
        isValid ? true : false
        return true
    } catch (error) {
        return false
    }
}

module.exports = isValidIso8601