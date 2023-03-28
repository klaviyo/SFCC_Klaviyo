const Basket = require('../mocks/dw.order.Basket')

class BasketMgr {
    constructor() {
        this.basket = new Basket()
    }

    static getCurrentBasket() {
        return this.basket
    }

    static setCurrentBasket(basket) {
        this.basket = basket
    }
}

module.exports = BasketMgr