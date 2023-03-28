const ArrayList = require('../mocks/dw.util.Collection')
const Money = require('../mocks/dw.value.Money')
const Customer = require('../mocks/dw.customer.Customer')

class LineItemCtnr {
    constructor() {
        this.productLineItems = []
        this.paymentInstruments = []
        this.paymentStatus = { value: 0 }
        this.status = { value: 0 }
        this.customerEmail = 'qa@unittest.com'
        this.billingAddress = {
            firstName: 'Ricky',
            lastName: 'Bobby',
            address1: '54321 First Last Lane',
            address2: '',
            city: 'West Palm',
            postalCode: '02135',
            phone: '011-235-8137',
            stateCode: 'FL',
            countryCode: {
                displayValue: 'United States',
                value: 'US'
            },
            setPhone: (phoneNumber) => {},
            getCountryCode: () => { return { value: this.countryCode } },
            setCountryCode: (countryCode) => {},
            setFirstName: (other) => { },
            setLastName: (other) => { },
            setAddress1: (other) => {},
            setAddress2: (other) => {},
            setCity: (other) => {},
            setPostalCode: (other) => {},
            setStateCode: (other) => {}
        },
        this.defaultShipment = {
            UUID: '1234-1234-1234-1235',
            setShippingMethod: function (shippingMethod) {
                return shippingMethod
            },
            shippingAddress: {
                address1: '1 Drury Lane',
                address2: null,
                countryCode: {
                    displayValue: 'United States',
                    value: 'US'
                },
                firstName: 'The Muffin',
                lastName: 'Man',
                city: 'Far Far Away',
                phone: '333-333-3333',
                postalCode: '04330',
                stateCode: 'ME'
            },
            shippingMethod: {
                ID: '001',
                displayName: 'Ground',
                description: 'Order received within 7-10 business days',
                custom: {
                    estimatedArrivalTime: '7-10 Business Days'
                }
            },
            gift: true
        }
        this.totalGrossPrice = new Money(0)
        this.customer = new Customer()
        this.allProductLineItems = new ArrayList(this.productLineItems)
        this.shippingTotalPrice = new Money(7.99)
        this.totalTax = new Money(0)
    }

    getProductLineItems() {
        const lineItems = this.productLineItems.filter(function (lineItem) {
            return lineItem.product.ID === productId
        })
        return new ArrayList(productId ? lineItems : this.productLineItems)
    }

    removeProductLineItem(productLineItem) {
        const index = this.productLineItems.indexOf(productLineItem)
        if (index > -1) {
            this.productLineItems.splice(index, 1)
        }
    }

    getTotalGrossPrice() {
        return this.totalGrossPrice
    }

    createBonusLineItem(product, shipment) {
        const productObj = product === Object(product) ? product : {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: product,
            name: 'test',
            productID: product
        }
        if (!empty(productObj)) {
            this.bonusLineItems.push({
                getQualifyingProductLineItemForBonusProduct() {
                    return productObj
                }
            })
        }
    }

    createProductLineItem(product, shipment) {
        const productObj = product === Object(product) ? product : {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: product,
            name: 'unittest'
        }
        shipment = 'ID' in shipment ? shipment : this.defaultShipment
        if (!empty(productObj)) {
            this.productLineItems.push({
                isGift: function () {
                    return false
                },
                product: productObj,
                productID: productObj.ID,
                quantity: {
                    value: 1
                },
                price: {
                    value: 100
                },
                tax: {
                    value: 10
                },
                shipment: shipment,
                setShipment(shipmentObj) {
                    this.shipment = shipmentObj
                },
                UUID: 'ca155038d934befcd30f532e92',
                getUUID() {
                    return this.UUID
                },
                custom: {},
                setPriceValue(price) {
                    this.price = new Money(price)
                    this.priceValue = price
                },
                setQuantityValue(quantityValue) {
                    this.quantity.value = quantityValue
                },
                replaceProduct(replaceableProduct) {
                    this.product = replaceableProduct
                }
            })
        }
        shipment.productLineItems = this.productLineItems
        return this.productLineItems[this.productLineItems.length - 1]
    }

    getCurrencyCode() {
        return 'USD'
    }
}

module.exports = LineItemCtnr