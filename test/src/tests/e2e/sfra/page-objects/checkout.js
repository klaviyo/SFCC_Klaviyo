import { expect } from '@playwright/test'
import path from 'path'
import { BasePage } from './base'
import { ProductPage } from './product'
import { AccountPage } from './account'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join('..', '.env') })

const { SFRA_BASE_URL } = process.env

exports.CheckoutPage = class CheckoutPage extends BasePage {
    constructor(page, isMobile) {
        super(page, isMobile)

        this.productPage = new ProductPage(page, isMobile)
        this.accountPage = new AccountPage(page, isMobile)

        // Shipping form
        this.guestEmailInput = '#email-guest'
        this.guestCheckoutSubmit = page.locator('.submit-customer')
        this.shippingFnameLocator = page.locator('#shippingFirstNamedefault')
        this.shippingLnameLocator = page.locator('#shippingLastNamedefault')
        this.shippingAddressLocator = page.locator('#shippingAddressOnedefault')
        this.countryLocator = page.locator('#shippingCountrydefault')
        this.stateLocator = page.locator('#shippingStatedefault')
        this.cityLocator = page.locator('#shippingAddressCitydefault')
        this.postCodeLocator = page.locator('#shippingZipCodedefault')
        this.phoneLocator = page.locator('#shippingPhoneNumberdefault')
        this.submitShippingLocator = page.locator('.submit-shipping')

        // Payment form
        this.cardNumberLocator = page.locator('#cardNumber')
        this.cardExpMonth = page.locator('#expirationMonth')
        this.cardExpYear = page.locator('#expirationYear')
        this.securityCode = page.locator('#securityCode')
        this.paymentLocator = page.locator('.submit-payment')
        this.placeOrderLocator = page.locator('.place-order')
    }

    async startCheckout() {
        this.page.goto(`${SFRA_BASE_URL}/en_US/Checkout-Begin`)
        await this.page.waitForTimeout(3000)
    }

    async enterGuestEmail(email) {
        await this.page.locator(this.guestEmailInput).fill(email)
        await this.guestCheckoutSubmit.click()
    }

    async submitShippingForm(){
        await this.submitShippingLocator.click()
        await this.page.waitForTimeout(3000)
    }

    async fillShippingForm(data) {
        await this.shippingFnameLocator.fill(data.firstName)
        await this.shippingLnameLocator.fill(data.lastName)
        await this.shippingAddressLocator.fill(data.address)
        await this.cityLocator.fill(data.city)
        await this.countryLocator.locator('option')
        await this.countryLocator.selectOption({ value: data.country })
        await this.stateLocator.locator('option')
        await this.stateLocator.selectOption({ value: data.state })
        await this.postCodeLocator.fill(data.postal)
        await this.phoneLocator.fill(data.phone)
    }

    async fillPaymentForm(data) {
        await this.cardNumberLocator.fill(data.ccn)
        await this.page.keyboard.press('Tab')
        const months = await this.cardExpMonth.locator('option')
        const monthVal = await months.last().getAttribute('value')
        await this.cardExpMonth.selectOption({ value: monthVal })
        const years = await this.cardExpYear.locator('option')
        const yearVal = await years.last().getAttribute('value')
        await this.cardExpYear.selectOption({ value: yearVal })
        await this.securityCode.fill('123')
        await this.paymentLocator.click()
        await this.page.waitForLoadState('networkidle')
        await this.placeOrderLocator.click()
        await this.page.waitForLoadState('networkidle')
    }

    async enableEmailSubscription() {
        await this.page.locator('.single-shipping').locator('#KLEmailSubscribe').check()
    }
}