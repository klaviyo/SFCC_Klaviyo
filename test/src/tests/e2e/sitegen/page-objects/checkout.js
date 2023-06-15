import { expect } from '@playwright/test'
import path from 'path'
import { BasePage } from './base'
import { ProductPage } from './product'
import { AccountPage } from './account'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join('..', '.env') })

exports.CheckoutPage = class CheckoutPage extends BasePage {
    constructor(page, isMobile) {
        super(page, isMobile)

        this.productPage = new ProductPage(page, isMobile)
        this.accountPage = new AccountPage(page, isMobile)

        this.guestCheckoutBtn = 'dwfrm_login_unregistered'

        // Shipping form
        this.shippingFnameLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_firstName')
        this.shippingLnameLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_lastName')
        this.shippingAddressLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_address1')
        this.cityLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_city')
        this.postCodeLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_postal')
        this.countryLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_country')
        this.stateLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_states_state')
        this.phoneLocator = page.locator('#dwfrm_singleshipping_shippingAddress_addressFields_phone')
        this.sameAsLocator = page.locator('#dwfrm_singleshipping_shippingAddress_useAsBillingAddress')

        // Billing form
        this.billingEmailLocator = page.locator('#dwfrm_billing_billingAddress_email_emailAddress')

        // Payment form
        this.nameOnCardLocator = page.locator('#dwfrm_billing_paymentMethods_creditCard_owner')
        this.cardNumberSelector = "//input[starts-with(@id, 'dwfrm_billing_paymentMethods_creditCard_number_')]"
        this.securityCodeSelector = "//input[starts-with(@id, 'dwfrm_billing_paymentMethods_creditCard_cvn_')]"
        this.cardExpMonth = page.locator('#dwfrm_billing_paymentMethods_creditCard_expiration_month')
        this.cardExpYear = page.locator('#dwfrm_billing_paymentMethods_creditCard_expiration_year')

        this.orderSuccessMessage = page.locator('#main > div > div.confirmation-message > h1')
    }

    async startCheckout() {
        const parsed = await this.urlParser()
        this.page.goto(`https://${parsed.hostname}/s/SiteGenesis/checkout?lang=en_US`)
        await this.page.waitForTimeout(5000)
    }

    async enterGuestEmail(email) {
        await this.page.locator(this.guestEmailInput).fill(email)
        await this.guestCheckoutSubmit.click()
    }

    async fillShippingForm(data) {
        await this.shippingFnameLocator.fill(data.firstName)
        await this.shippingLnameLocator.fill(data.lastName)
        await this.shippingAddressLocator.fill(data.address)
        await this.cityLocator.fill(data.city)
        await this.postCodeLocator.fill(data.postal)
        await this.countryLocator.locator('option')
        await this.countryLocator.selectOption({ value: data.country })
        await this.stateLocator.locator('option')
        await this.stateLocator.selectOption({ value: data.state })
        await this.phoneLocator.fill(data.phone)
        await this.sameAsLocator.click()
        // await this.submitShippingLocator.click()
        await this.page.getByRole('button', { name: 'Continue to Billing >' }).click()
    }

    async fillBillingForm(data) {
        await this.billingEmailLocator.isVisible()
        await this.billingEmailLocator.fill(data.email)
    }

    async fillPaymentForm(data) {
        await this.nameOnCardLocator.fill(data.name)
        await this.page.locator(this.cardNumberSelector).fill(data.ccn)
        const months = await this.cardExpMonth.locator('option')
        const monthVal = await months.last().getAttribute('value')
        await this.cardExpMonth.selectOption({ value: monthVal })
        const years = await this.cardExpYear.locator('option')
        const yearVal = await years.last().getAttribute('value')
        await this.cardExpYear.selectOption({ value: yearVal })
        await this.page.locator(this.securityCodeSelector).fill('123')
        await this.page.keyboard.press('Tab')
        await this.page.getByRole('button', { name: 'Continue to Place Order >' }).click()
        await this.page.waitForLoadState('networkidle')
        await this.page.getByRole('button', { name: 'Place Order' }).click()
        await this.page.waitForLoadState('networkidle')
    }
}