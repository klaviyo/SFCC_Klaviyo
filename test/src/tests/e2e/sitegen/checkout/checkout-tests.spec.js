import { test, expect } from '@playwright/test'
import { CheckoutPage } from '../page-objects/checkout.js'

let testData = {
    firstName: 'Checkout',
    lastName: 'Automation',
    phone: '7777777777',
    password: 'Abcd1234$$',
    address: '4321 First Last Lane',
    country: 'us',
    state: 'FL',
    city: 'West Palm Beach',
    postal: '33405',
}

const paymentData = {
    name: 'Checkout Automation',
    ccn: '4111111111111111'
}

let email
let checkoutPage

test.beforeEach(async ({ page, isMobile }) => {
    checkoutPage = new CheckoutPage(page, isMobile)
    await checkoutPage.goHome()
    await checkoutPage.acceptCookies()
})

test.describe('Test Klaviyo started checkout event not identified', () => {
    test('Enter checkout flow as guest', async ({ page }) => {
        // Checkout as guest so we can be identified
        const resultMsg = 'Klaviyo Service Result:'
        email = await checkoutPage.generateEmail()
        testData.email = email
        await checkoutPage.productPage.getProduct()
        await checkoutPage.productPage.addToCart()
        await checkoutPage.startCheckout()
        await page.getByRole('button', { name: 'Checkout as Guest' }).click()
        await checkoutPage.fillShippingForm(testData)
        await checkoutPage.fillBillingForm(testData)
        await checkoutPage.fillPaymentForm(paymentData)
        expect(await checkoutPage.orderSuccessMessage.textContent()).toBe('Thank you for your order.')
        await checkoutPage.productPage.getProduct()
        await checkoutPage.productPage.addToCart()
        await checkoutPage.startCheckout()
        const logData = await checkoutPage.getDebugLogs(resultMsg)
        expect(logData[0].success).toBe(true)
    })
})

test.describe('Test Klaviyo add to cart event', () => {
    test('Verify add to cart event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:'
        email = await checkoutPage.generateEmail()
        testData.email = email
        await checkoutPage.accountPage.gotoAccountLogin()
        await checkoutPage.accountPage.fillRegistrationForm(testData)
        await checkoutPage.productPage.visitPDP()
        const logData = await checkoutPage.getDebugLogs(resultMsg)
        await checkoutPage.productPage.addToCart()
        expect(logData[0].success).toBe(true)
    })
})