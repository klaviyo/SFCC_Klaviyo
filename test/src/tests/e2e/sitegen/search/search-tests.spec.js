import { test, expect } from '@playwright/test'
import { Search } from '../page-objects/search.js'

let testData = {
    firstName: 'Product',
    lastName: 'Automation',
    phone: '7777777777',
}

let search
let email

test.beforeEach(async ({ page, isMobile }) => {
    search = new Search(page, isMobile)
    await search.goHome()
    await search.acceptCookies()
})

test.describe('Test Klaviyo search event', () => {
    test('Perform a search and verify event data', async ({ page }) => {
        const searchTerm = 'shirts'
        const resultMsg = 'Klaviyo Service Result:'
        email = await search.generateEmail()
        testData.email = email
        testData.password = await search.generatePassword()
        await search.accountPage.gotoAccountLogin()
        await search.accountPage.fillRegistrationForm(testData)
        await search.enterSearchTerm(searchTerm)
        const logData = await search.getDebugLogs(resultMsg)
        expect(logData[0].success).toBe(true)
    })
})