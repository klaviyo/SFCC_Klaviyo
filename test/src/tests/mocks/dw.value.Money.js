class Money {
    constructor(value, currencyCode) {
        this.value = value
        this.currencyCode = currencyCode || 'USD'
        this.available = true
        this.valueOrNull = value
    }

    add(value) {
        return new Money(this.value + valueOf(value), 'USD')
    }

    subtract(money) {
        this.value -= money.value
        return this
    }

    getAmount() {
        return this
    }
    toFormattedString() {
        return '$' + this.value
    }

    valueOf(value) {
        if (typeof (value) === 'object' && value !== null) {
            return value.value
        }
        return value
    }

    getValue() {
        return this.value
    }
}

module.exports = Money