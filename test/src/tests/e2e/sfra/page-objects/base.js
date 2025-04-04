import { expect } from '@playwright/test';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join('..', '.env') });

const { SFRA_BASE_URL } = process.env;
const KL_DEBUG = 'kldebug=true';

exports.BasePage = class BasePage {
    constructor(page, isMobile) {
        this.page = page;
        this.isMobile = isMobile;
        this.klDebug = KL_DEBUG;
        this.baseUrl = SFRA_BASE_URL;

        // Cookies accept locator
        this.acceptCookiesButton = page.locator(
            '#consent-tracking > div > div > div.modal-footer > div > button.affirm.btn.btn-primary'
        );
    }

    async goHome(url = this.baseUrl, options) {
        await this.page.goto(url, options);
        await this.page.waitForTimeout(3000);
    }

    async acceptCookies() {
        await this.acceptCookiesButton.click();
        return;
    }

    async getKCookies() {
        const cookies = this.page.context().cookies();
        return cookies;
    }

    async parseCookies(cookies) {
        const parsed = '';
        return parsed;
    }

    async getKlavyioCookie(data) {
        const kID = '';
        return kID;
    }

    async getLogs() {
        this.page.on('console', async msg => {
            const values = [];
            for (const arg of msg.args()) values.push(await arg.jsonValue());
            console.log(values);
        });
    }

    async getDebugLogs(result) {
        return new Promise(async resolve => {
            const successMsgs = [];
            const parsed = await this.urlParser();
            const hostname = parsed.hostname;
            const path = parsed.path;
            const search = parsed.search.replace('?', '');
            const hash = parsed.hash;

            this.page.on('console', async message => {
                const logData = [];
                if (message.type() === 'log') {
                    for (const arg of message.args()) {
                        logData.push(await arg.jsonValue());
                    }

                    for (let i = 0; i < logData.length; i++) {
                        if (typeof logData[i] === 'string' && logData[i].includes(`${result}`)) {
                            const successMsg = logData[i + 1];
                            successMsgs.push(successMsg);
                        }
                    }
                }

                setTimeout(() => {
                    resolve(successMsgs);
                }, 5000);
            });

            const debugURL = `https://${hostname}${path}?${this.klDebug}&${search}${hash}`;
            await this.page.goto(debugURL);
            await this.page.waitForTimeout(3000);
        });
    }

    async authorizeAndAcceptCookies() {
        await this.goto();
        await this.authorize();
        await this.acceptCookies();
    }

    async scrollToTop() {
        await this.page.evaluate(() => window.scrollTo(0, 0));
        await this.page.waitForTimeout(2000);
    }

    async scrollToBottom() {
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(2000);
    }

    async scrollToBottomSlowly() {
        await this.page.evaluate(async () => {
            await new Promise(resolve => {
                let scrollHeight;
                let totalHeight;
                const distance = 150;

                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight = window.scrollY + window.innerHeight;
                    scrollHeight = document.body.scrollHeight;

                    if (totalHeight >= scrollHeight - 100) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 80);
            });
        });
    }

    async generateEmail() {
        const email = `playwright-automation-${uuidv4().slice(1, 6)}@mailinator.com`;
        return email;
    }

    async generatePassword() {
        // generate random password
        let password = '';
        // add special characters and numbers randomly
        const specialChars = [
            'abcdefghijklmnopqrstuvwxyz',
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            '!#*_',
            '1234567890',
        ];
        for (let charSets of specialChars) {
            for (let i = 0; i < 4; i++) {
                const randomIndex = Math.floor(Math.random() * charSets.length);
                password += charSets[randomIndex];
            }
        }
        return password;
    }

    async urlParser() {
        const ogURL = new URL(this.page.url());
        const hostname = ogURL.hostname;
        const path = ogURL.pathname;
        const search = ogURL.search;
        const hash = ogURL.hash;
        return {
            url: ogURL,
            hostname: hostname,
            path: path,
            search: search,
            hash: hash,
        };
    }

    async debugURL() {
        const ogURL = new URL(this.page.url());
        const hostname = ogURL.hostname;
        const path = ogURL.pathname;
        const search = ogURL.search;
        const hash = ogURL.hash;
        const debugURL = `https://${hostname}${path}?${KL_DEBUG}&${search}${hash}`;
        return debugURL;
    }
};
