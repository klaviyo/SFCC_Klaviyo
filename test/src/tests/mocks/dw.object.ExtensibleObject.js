const Super = require('../mocks/dw.object.PersistentObject')

const ExtensibleObject = function () {}

ExtensibleObject.prototype = new Super()

ExtensibleObject.prototype.describe = function () {}
ExtensibleObject.prototype.getCustom = function () {
    return this.custom
}
ExtensibleObject.prototype.custom = {}

module.exports = ExtensibleObject