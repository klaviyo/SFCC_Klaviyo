const ProductPriceModel = require('../mocks/dw.catalog.ProductPriceModel')
const ProductVariationModel = require('../mocks/dw.catalog.ProductVariationModel')

class Product {
    constructor(props) {
        if (props) {
            this.ID = props.ID || 'NG3614270264405'
        } else {
            this.ID = 'NG3614270264405'
            this.masterProduct = {
                ID: 'NG3614270264405',
            }
        }
        this.name = 'Belle de Teint'
        this.variant = !this.masterProduct
        this.brand = 'LORA'
        this.price = 96
        this.availabilityModel = this.getAvailabilityModel()
        this.minOrderQuantity = { value: 1 }
        this.quantity = { value: 1 }
        this.variationModel = new ProductVariationModel()
        this.priceModel = new ProductPriceModel()
        this.shortDescription = {
            getMarkup: function () {
                return this.description
            },
            description: 'Because a healthy glow always starts with healthy skin'
        }
        this.categoryAssignments = this.getCategoryAssignments()
        this.getPrimaryCategory = () => {
            return this.getCategory()
        }
        this.primaryCategory = this.getCategory()
        this.image = {
            'small': {
                URL: 'https://sforce.co/43Pig4s'
            },
            'medium': {
                URL: 'https://sforce.co/43Pig4s'
            },
            'large': {
                URL: 'https://sforce.co/43Pig4s'
            }
        }
        this.custom = {
            mfrWarrantyParts: 12,
            mfrWarrantyLabor: 12
        }
        this.UPC = '555'
        this.isbonusProduct = this.getBonusProduct()
        this.originalPrice = 100
        this.originalPriceValue = 99
        this.priceValue = 1
    }

    getImage(size) {
        const _image = this.image[size]
        if (!_image) {
            return
        }
        return {
            _image,
            getAbsURL() {
                return 'https://sforce.co/43Pig4s'
            }
        }
    }

    getName() {
        return this.name
    }

    getBrand() {
        return this.brand
    }

    getID() {
        return this.ID
    }

    getUPC() {
        return this.UPC
    }

    getAvailabilityModel() {
        return {
            'availability': 1,
            'availabilityStatus': 'IN_STOCK',
            'inStock': true,
            'orderable': true,
            'SKUCoverage': 1,
            'timeToOutOfStock': 0,
            inventoryRecord: {
                perpetual: false,
                allocation: 10,
                ATS: {
                    value: 100
                },
                getATS() {
                    return {
                        value: 10,
                        getValue: function () {
                            return 10
                        }
                    }
                },
                setAllocation: function (allocation) {
                    this.allocation = allocation
                },
                getAllocation: function () {
                    return {
                        getValue: function () {
                            return 10
                        }
                    }
                }
            },
            isOrderable() {
                return true
            }
        }
    }

    getCategory() {
        const displayName = 'Skin Care'
        return {
            displayName: displayName
        }
    }

    getAllCategories() {
        const displayName = 'Skin Care'
        return [{
            displayName: displayName
        }]
    }

    getCategoryAssignments() {
        const category = 'health',
            displayName = 'Health',
            length = 2
        return [{
            category: {
                displayName: displayName,
            },
            displayName: displayName,
            length: length,
        }]
    }

    getOnlineCategories() {
        const displayName = 'testCategory',
            length = 2,
            online = true,
            parent = {
                displayName: 'testCategoryParent',
                parent: null,
                length: 2
            }
        return {
            displayName: displayName,
            online: online,
            parent: parent,
            length: length,
            toArray: function () {
                return [{
                    displayName: displayName,
                    online: true,
                    parent: parent,
                    length: length
                }]
            }
        }
    }

    isVariant() {
        return this.variant
    }

    isProduct() {
        return true
    }

    isOnline() {
        return true
    }

    isMaster() {
        return this.master
    }

    getPriceModel() {
        return this.priceModel
    }

    getVariationModel() {
        return this.variationModel
    }

    getShortDescription() {
        return this.shortDescription
    }

    getBonusProduct() {
        return true
    }
}

module.exports = Product