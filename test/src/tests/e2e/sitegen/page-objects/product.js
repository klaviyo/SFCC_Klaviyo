import { expect } from '@playwright/test'
import path from 'path'
import { BasePage } from './base'
import { AccountPage } from './account'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join('..', '.env') })

exports.ProductPage = class ProductPage extends BasePage {
    constructor(page, isMobile) {
        super(page, isMobile)

        this.accountPage = new AccountPage(page, isMobile)

        this.newArrivals = page.locator('.has-sub-menu')
        this.categoryLocator = page.locator('.category-tile')
        this.productLocator = page.locator('.thumb-link')
        this.productTitle = page.locator('.product-name')

        this.sizeSwatches = page.locator('.swatches.size')
        this.sizeSelect = page.locator('.swatchanchor')
        this.addToCartLocator = page.locator('#add-to-cart')
    }

    async getProduct() {
        await this.newArrivals.first().click()
        await this.page.waitForTimeout(5000)
        const categories = await this.categoryLocator
        await categories.first().click()
        await this.page.waitForLoadState('networkidle')
        const products = await this.productLocator
        const pdpURL = await products.first().getAttribute('href')
        await this.page.goto(pdpURL)
    }

    async addToCart() {
        await this.selectSize()
        await this.addToCartLocator.click()
        await this.page.waitForTimeout(5000)
    }

    async selectSize() {
        if (await this.sizeSelect.last().isVisible()) {
            await this.sizeSelect.last().click()
        }
        return
    }

    async selectWidth() {
        if (await this.widthSelect.isVisible()) {
            const options = await this.widthSelect.locator('option')
            const optVal = await options.last().getAttribute('value')
            await this.widthSelect.selectOption({ value: optVal })
        }
        return
    }

    async visitPDP() {
        await this.newArrivals.first().click()
        await this.page.waitForTimeout(5000)
        const categories = await this.categoryLocator
        await categories.first().click()
        await this.page.waitForLoadState('networkidle')
        const products = await this.productLocator
        const pdpURL = await products.first().getAttribute('href')
        await this.page.goto(pdpURL)
    }

    async visitPLP() {
        await this.newArrivals.first().click()
        await this.page.waitForTimeout(5000)
        const categories = await this.categoryLocator
        await categories.first().click()
        await this.page.waitForLoadState('networkidle')
    }
}