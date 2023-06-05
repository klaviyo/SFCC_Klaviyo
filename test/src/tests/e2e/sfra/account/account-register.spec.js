import { test, expect } from '@playwright/test'
import { AccountPage } from '../page-objects/account.js'

let testData = {
    firstName: 'Account',
    lastName: 'Automation',
    phone: '7777777777',
    password: 'Abcd1234$$'
}

let accountPage
let email

test.beforeEach(async ({ page, isMobile }) => {
    accountPage = new AccountPage(page, isMobile)
    await accountPage.gotoAccountLogin()
    await accountPage.acceptCookies()
})

test.describe('Client account functionality', () => {
    test('Register new account', async ({ page }) => {
        email = await accountPage.generateEmail()
        testData.email = email
        await accountPage.fillRegistrationForm(testData)
        await accountPage.getLogs()
        expect(await page.innerText('h1.page-title')).toBe('Dashboard')
    })

    test('Log into new account', async ({ page }) => {
        await accountPage.gotoAccountLogin()
        await accountPage.fillLoginForm(email, testData.password)
        expect(await page.innerText('h1.page-title')).toBe('Dashboard')
    })
})