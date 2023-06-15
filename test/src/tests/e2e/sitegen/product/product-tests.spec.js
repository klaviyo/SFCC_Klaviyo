import { test, expect } from '@playwright/test'
import { ProductPage } from '../page-objects/product.js'
import { getLatestMetricData } from '../../../../utils/v3-api-helper.mjs'

let testData = {
    firstName: 'Product',
    lastName: 'Automation',
    phone: '7777777777',
    password: 'Abcd1234$$'
}

let productPage
let email

test.beforeEach(async ({ page, isMobile }) => {
    productPage = new ProductPage(page, isMobile)
    await productPage.goHome()
    await productPage.acceptCookies()
})

test.describe('Test Klaviyo viewed product event', () => {
    test('Navigate to a PDP and verify event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:'
        email = await productPage.generateEmail()
        testData.email = email
        await productPage.accountPage.gotoAccountLogin()
        await productPage.accountPage.fillRegistrationForm(testData)
        await productPage.visitPDP()
        const logData = await productPage.getDebugLogs(resultMsg)
        expect(logData[0].success).toBe(true)
    })
})

test.describe('Test Klaviyo viewed category event', () => {
    test('Navigate to a PLP and verify event data', async ({ page }) => {
        const resultMsg = 'Klaviyo Service Result:'
        email = await productPage.generateEmail()
        testData.email = email
        await productPage.accountPage.gotoAccountLogin()
        await productPage.accountPage.fillRegistrationForm(testData)
        await productPage.visitPLP()
        const logData = await productPage.getDebugLogs(resultMsg)
        expect(logData[0].success).toBe(true)
    })
})

test.describe('Test successful integration with Klaviyo', () => {
    test('Verify Viewed Product metric in Klaviyo sandbox', async ({ page }) => {
        email = await productPage.generateEmail()
        testData.email = email
        await productPage.accountPage.gotoAccountLogin()
        await productPage.accountPage.fillRegistrationForm(testData)
        expect(page.locator('#primary > h1')).toContainText('My Account')
        await productPage.getProduct()
        const metrics = await getLatestMetricData()
        const metricName = metrics.attributes.name
        expect(metricName).toBe('Viewed Product')
    })
})