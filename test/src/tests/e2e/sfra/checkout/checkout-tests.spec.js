import { test, expect } from '@playwright/test'
import { CheckoutPage } from '../page-objects/checkout.js'

let testData = {
    firstName: 'Product',
    lastName: 'Automation',
    phone: '7777777777',
    password: 'Abcd1234$$',
    address: '4321 First Last Lane',
    country: 'US',
    state: 'FL',
    city: 'West Palm Beach',
    postal: '33405',
}

const paymentData = {
    ccn: '4111 1111 1111 1111'
}

let email
let checkoutPage

test.beforeEach(async ({ page, isMobile }) => {
    checkoutPage = new CheckoutPage(page, isMobile)
    await checkoutPage.goHome()
    await checkoutPage.acceptCookies()
})

test.describe('Test Klaviyo started checkout event', () => {
    test('Enter checkout flow and verify event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:'
        email = await checkoutPage.generateEmail()
        testData.email = email
        await checkoutPage.productPage.getProduct()
        await checkoutPage.productPage.addToCart()
        await checkoutPage.startCheckout()
        await checkoutPage.enterGuestEmail(email)
        const logData = await checkoutPage.getDebugLogs(resultMsg)
        expect(logData[0].success).toBe(true)
    })
})

test.describe('Test Klaviyo add to cart event', () => {
    test('Verify add to cart event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Add To Cart Service Result:'
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

test.describe('Test Klaviyo sms signup', () => {
    test('Verify sms checkbox present and selectable', async ({ page }) => {
        email = await checkoutPage.generateEmail()
        testData.email = email
        await checkoutPage.productPage.getProduct()
        await checkoutPage.productPage.addToCart()
        await checkoutPage.startCheckout()
        await checkoutPage.enterGuestEmail(email)
        await checkoutPage.selectSMS()
        await checkoutPage.fillShippingForm(testData)
        await checkoutPage.fillPaymentForm(paymentData)
        await page.waitForTimeout(3000)
        expect(await page.innerText('h1.page-title')).toBe('Thank You')
    })
})

test.describe('Test Klaviyo email signup', () => {
    test('Verify email checkbox present and selectable', async ({ page }) => {
        email = await checkoutPage.generateEmail()
        testData.email = email
        await checkoutPage.productPage.getProduct()
        await checkoutPage.productPage.addToCart()
        await checkoutPage.startCheckout()
        await checkoutPage.enterGuestEmail(email)
        await checkoutPage.selectEmail()
        await checkoutPage.fillShippingForm(testData)
        await checkoutPage.fillPaymentForm(paymentData)
        await page.waitForTimeout(3000)
        expect(await page.innerText('h1.page-title')).toBe('Thank You')
    })
})
