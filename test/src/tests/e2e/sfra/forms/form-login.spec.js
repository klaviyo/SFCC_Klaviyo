import { test, expect } from '@playwright/test'
import { Forms } from '../page-objects/forms.js'

let testData = {
    email: 'playwright-qa@klav-test.com'
}

let forms

test.beforeEach(async ({page, isMobile}) => {
    forms = new Forms(page, isMobile)
    await forms.accountPage.gotoAccountLogin()
    await forms.acceptCookies()
})

test.describe('Login & Register form field email extraction', () => {
    test('Login Form Data Listener', async ({ page }) => {
        forms.enterLoginEmail(testData)
        const loginInput = page.locator('#login-form-email')
        const dataListener = await loginInput.getAttribute('data-listener')
        expect(dataListener).toBe('klaviyo')
    })
})