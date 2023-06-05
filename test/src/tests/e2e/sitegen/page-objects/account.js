import { expect } from '@playwright/test'
import path from 'path'
import { BasePage } from './base.js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join('..', '.env') })

exports.AccountPage = class AccountPage extends BasePage {
    constructor(page, isMobile) {
        super(page, isMobile)

        // Account registration form elements
        this.registerTab = page.locator('#dwfrm_login_register > fieldset > div > button')
        this.firstName = '//input[@id="dwfrm_profile_customer_firstname"]'
        this.lastName = '//input[@id="dwfrm_profile_customer_lastname"]'
        this.emailRegister = '//input[@id="dwfrm_profile_customer_email"]'
        this.emailRegisterConf = '//input[@id="dwfrm_profile_customer_emailconfirm"]'
        this.password = "//input[starts-with(@id, 'dwfrm_profile_login_password_')]"
        this.passwordConf = "//input[starts-with(@id, 'dwfrm_profile_login_passwordconfirm_')]"
        this.createAccountBtn = page.locator('#RegistrationForm > fieldset:nth-child(2) > div.form-row.form-row-button > button')

        // Account selectors
        this.emailLogin = "//input[starts-with(@id, 'dwfrm_login_username_')]"
        this.passwordLogin = "//input[starts-with(@id, 'dwfrm_login_password_')]"
        this.loginBtn = page.locator('#dwfrm_login > fieldset > div.form-row.form-row-button > button')
    }

    async gotoAccountLogin() {
        const loginURL = `${this.baseUrl}/en_US/Login-Show`
        await this.page.goto(`${loginURL}`)
    }

    async fillRegistrationForm(data) {
        await this.registerTab.click()
        await this.page.locator(this.firstName).fill(data.firstName)
        await this.page.locator(this.lastName).fill(data.lastName)
        await this.page.locator(this.emailRegister).fill(data.email)
        await this.page.locator(this.emailRegisterConf).fill(data.email)
        await this.page.locator(this.password).fill(data.password)
        await this.page.locator(this.passwordConf).fill(data.password)
        await this.createAccountBtn.click()
    }

    async fillLoginForm(email, password) {
        await this.page.locator(this.emailLogin).fill(email)
        await this.page.locator(this.passwordLogin).fill(password)
        await this.loginBtn.click()
    }
}