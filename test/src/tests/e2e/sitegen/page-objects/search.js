import { expect } from '@playwright/test'
import path from 'path'
import { BasePage } from './base'
import { AccountPage } from './account'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join('..', '.env') })

exports.Search = class Forms extends BasePage {
    constructor(page, isMobile) {
        super(page, isMobile)

        this.accountPage = new AccountPage(page, isMobile)
        this.registerTab = this.accountPage.registerTab

        this.searchInputSelector = '#q'
    }

    async enterSearchTerm(data) {
        const searchInputs = await this.page.locator(this.searchInputSelector)
        await searchInputs.first().fill(data)
        await this.page.waitForLoadState('networkidle')
        await this.page.press(this.searchInputSelector, 'Enter')
    }
}